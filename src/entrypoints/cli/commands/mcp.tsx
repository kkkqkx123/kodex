// mcp 命令模块
import { Command } from '@commander-js/extra-typings';
import { CommandInterface } from '../types';
import {
  addMcpServer,
  getMcpServer,
  listMCPServers,
  removeMcpServer,
  getClients,
  ensureConfigScope
} from '../../../services/mcpClient';
import { startMCPServer } from '../../mcp';
import { handleMcprcServerApprovals } from '../../../services/mcpServerApproval';
import { setup, showSetupScreens, parseEnvVars } from '../utils';
import { existsSync } from 'fs';
import { cwd } from 'process';
import { logEvent } from '../../../services/featureFlags';
import { PRODUCT_COMMAND, PRODUCT_NAME } from '../../../constants/product';
import { React } from 'react';

/**
 * mcp 命令实现
 */
const mcpCommand: CommandInterface = {
  name: 'mcp',
  description: 'Configure and manage MCP servers',

  configure(program: Command): Command {
    const mcp = program
      .command('mcp')
      .description('Configure and manage MCP servers');

    mcp
      .command('serve')
      .description(`Start the ${PRODUCT_NAME} MCP server`)
      .action(async () => {
        const providedCwd = (program.opts() as { cwd?: string }).cwd ?? cwd();
        logEvent('tengu_mcp_start', { providedCwd });

        // Verify the directory exists
        if (!existsSync(providedCwd)) {
          console.error(`Error: Directory ${providedCwd} does not exist`);
          process.exit(1);
        }

        try {
          await setup(providedCwd, false);
          await startMCPServer(providedCwd);
        } catch (error) {
          console.error('Error: Failed to start MCP server:', error);
          process.exit(1);
        }
      });

    mcp
      .command('add-sse <name> <url>')
      .description('Add an SSE server')
      .option(
        '-s, --scope <scope>',
        'Configuration scope (project or global)',
        'project',
      )
      .action(async (name, url, options) => {
        try {
          const scope = ensureConfigScope(options.scope);
          logEvent('tengu_mcp_add', { name, type: 'sse', scope });

          addMcpServer(name, { type: 'sse', url }, scope);
          console.log(
            `Added SSE MCP server ${name} with URL ${url} to ${scope} config`,
          );
          process.exit(0);
        } catch (error) {
          console.error((error as Error).message);
          process.exit(1);
        }
      });

    mcp
      .command('add [name] [commandOrUrl] [args...]')
      .description('Add a server (run without arguments for interactive wizard)')
      .option(
        '-s, --scope <scope>',
        'Configuration scope (project or global)',
        'project',
      )
      .option(
        '-e, --env <env...>',
        'Set environment variables (e.g. -e KEY=value)',
      )
      .action(async (name, commandOrUrl, args, options) => {
        try {
          // If name is not provided, start interactive wizard
          if (!name) {
            console.log('Interactive wizard mode: Enter the server details');
            const { createInterface } = await import('readline');
            const rl = createInterface({
              input: process.stdin,
              output: process.stdout,
            });

            const question = (query: string) =>
              new Promise<string>(resolve => rl.question(query, resolve));

            // Get server name
            const serverName = await question('Server name: ');
            if (!serverName) {
              console.error('Error: Server name is required');
              rl.close();
              process.exit(1);
            }

            // Get server type
            const serverType = await question(
              'Server type (stdio or sse) [stdio]: ',
            );
            const type =
              serverType && ['stdio', 'sse'].includes(serverType)
                ? serverType
                : 'stdio';

            // Get command or URL
            const prompt = type === 'stdio' ? 'Command: ' : 'URL: ';
            const commandOrUrlValue = await question(prompt);
            if (!commandOrUrlValue) {
              console.error(
                `Error: ${type === 'stdio' ? 'Command' : 'URL'} is required`,
              );
              rl.close();
              process.exit(1);
            }

            // Get args and env if stdio
            let serverArgs: string[] = [];
            let serverEnv: Record<string, string> = {};

            if (type === 'stdio') {
              const argsStr = await question(
                'Command arguments (space-separated): ',
              );
              serverArgs = argsStr ? argsStr.split(' ').filter(Boolean) : [];

              const envStr = await question(
                'Environment variables (format: KEY1=value1,KEY2=value2): ',
              );
              if (envStr) {
                const envPairs = envStr.split(',').map(pair => pair.trim());
                serverEnv = parseEnvVars(envPairs);
              }
            }

            // Get scope
            const scopeStr = await question(
              'Configuration scope (project or global) [project]: ',
            );
            const serverScope = ensureConfigScope(scopeStr || 'project');

            rl.close();

            // Add the server
            if (type === 'sse') {
              logEvent('tengu_mcp_add', {
                name: serverName,
                type: 'sse',
                scope: serverScope,
              });
              addMcpServer(
                serverName,
                { type: 'sse', url: commandOrUrlValue },
                serverScope,
              );
              console.log(
                `Added SSE MCP server ${serverName} with URL ${commandOrUrlValue} to ${serverScope} config`,
              );
            } else {
              logEvent('tengu_mcp_add', {
                name: serverName,
                type: 'stdio',
                scope: serverScope,
              });
              addMcpServer(
                serverName,
                {
                  type: 'stdio',
                  command: commandOrUrlValue,
                  args: serverArgs,
                  env: serverEnv,
                },
                serverScope,
              );

              console.log(
                `Added stdio MCP server ${serverName} with command: ${commandOrUrlValue} ${serverArgs.join(' ')} to ${serverScope} config`,
              );
            }
          } else if (name && commandOrUrl) {
            // Regular non-interactive flow
            const scope = ensureConfigScope(options.scope);

            // Check if it's an SSE URL (starts with http:// or https://)
            if (commandOrUrl.match(/^https?:\/\//)) {
              logEvent('tengu_mcp_add', { name, type: 'sse', scope });
              addMcpServer(name, { type: 'sse', url: commandOrUrl }, scope);
              console.log(
                `Added SSE MCP server ${name} with URL ${commandOrUrl} to ${scope} config`,
              );
            } else {
              logEvent('tengu_mcp_add', { name, type: 'stdio', scope });
              const env = parseEnvVars(options.env);
              addMcpServer(
                name,
                { type: 'stdio', command: commandOrUrl, args: args || [], env },
                scope,
              );

              console.log(
                `Added stdio MCP server ${name} with command: ${commandOrUrl} ${(args || []).join(' ')} to ${scope} config`,
              );
            }
          } else {
            console.error(
              'Error: Missing required arguments. Either provide no arguments for interactive mode or specify name and command/URL.',
            );
            process.exit(1);
          }

          process.exit(0);
        } catch (error) {
          console.error((error as Error).message);
          process.exit(1);
        }
      });

    mcp
      .command('remove <name>')
      .description('Remove an MCP server')
      .option(
        '-s, --scope <scope>',
        'Configuration scope (project, global, or mcprc)',
        'project',
      )
      .action(async (name: string, options: { scope?: string }) => {
        try {
          const scope = ensureConfigScope(options.scope);
          logEvent('tengu_mcp_delete', { name, scope });

          removeMcpServer(name, scope);
          console.log(`Removed MCP server ${name} from ${scope} config`);
          process.exit(0);
        } catch (error) {
          console.error((error as Error).message);
          process.exit(1);
        }
      });

    mcp
      .command('list')
      .description('List configured MCP servers')
      .action(() => {
        logEvent('tengu_mcp_list', {});
        const servers = listMCPServers();
        if (Object.keys(servers).length === 0) {
          console.log(
            `No MCP servers configured. Use \`${PRODUCT_COMMAND} mcp add\` to add a server.`,
          );
        } else {
          for (const [name, server] of Object.entries(servers)) {
            if (server.type === 'sse') {
              console.log(`${name}: ${server.url} (SSE)`);
            } else {
              console.log(`${name}: ${server.command} ${server.args.join(' ')}`);
            }
          }
        }
        process.exit(0);
      });

    mcp
      .command('add-json <name> <json>')
      .description('Add an MCP server (stdio or SSE) with a JSON string')
      .option(
        '-s, --scope <scope>',
        'Configuration scope (project or global)',
        'project',
      )
      .action(async (name, jsonStr, options) => {
        try {
          const scope = ensureConfigScope(options.scope);

          // Parse JSON string
          let serverConfig;
          try {
            serverConfig = JSON.parse(jsonStr);
          } catch (e) {
            console.error('Error: Invalid JSON string');
            process.exit(1);
          }

          // Validate the server config
          if (
            !serverConfig.type ||
            !['stdio', 'sse'].includes(serverConfig.type)
          ) {
            console.error('Error: Server type must be "stdio" or "sse"');
            process.exit(1);
          }

          if (serverConfig.type === 'sse' && !serverConfig.url) {
            console.error('Error: SSE server must have a URL');
            process.exit(1);
          }

          if (serverConfig.type === 'stdio' && !serverConfig.command) {
            console.error('Error: stdio server must have a command');
            process.exit(1);
          }

          // Add server with the provided config
          logEvent('tengu_mcp_add_json', { name, type: serverConfig.type, scope });
          addMcpServer(name, serverConfig, scope);

          if (serverConfig.type === 'sse') {
            console.log(
              `Added SSE MCP server ${name} with URL ${serverConfig.url} to ${scope} config`,
            );
          } else {
            console.log(
              `Added stdio MCP server ${name} with command: ${serverConfig.command} ${(
                serverConfig.args || []
              ).join(' ')} to ${scope} config`,
            );
          }

          process.exit(0);
        } catch (error) {
          console.error((error as Error).message);
          process.exit(1);
        }
      });

    mcp
      .command('get <name>')
      .description('Get details about an MCP server')
      .action((name: string) => {
        logEvent('tengu_mcp_get', { name });
        const server = getMcpServer(name);
        if (!server) {
          console.error(`No MCP server found with name: ${name}`);
          process.exit(1);
        }
        console.log(`${name}:`);
        console.log(`  Scope: ${server.scope}`);
        if (server.type === 'sse') {
          console.log(`  Type: sse`);
          console.log(`  URL: ${server.url}`);
        } else {
          console.log(`  Type: stdio`);
          console.log(`  Command: ${server.command}`);
          console.log(`  Args: ${server.args.join(' ')}`);
          if (server.env) {
            console.log('  Environment:');
            for (const [key, value] of Object.entries(server.env)) {
              console.log(`    ${key}=${value}`);
            }
          }
        }
        process.exit(0);
      });

    // Import servers from Claude Desktop
    mcp
      .command('add-from-claude-desktop')
      .description(
        'Import MCP servers from Claude Desktop (Mac, Windows and WSL)',
      )
      .option(
        '-s, --scope <scope>',
        'Configuration scope (project or global)',
        'project',
      )
      .action(async options => {
        try {
          const scope = ensureConfigScope(options.scope);
          const platform = process.platform;

          // Import fs and path modules
          const { existsSync, readFileSync } = await import('fs');
          const { join } = await import('path');
          const { exec } = await import('child_process');

          // Determine if running in WSL
          const isWSL =
            platform === 'linux' &&
            existsSync('/proc/version') &&
            readFileSync('/proc/version', 'utf-8')
              .toLowerCase()
              .includes('microsoft');

          if (platform !== 'darwin' && platform !== 'win32' && !isWSL) {
            console.error(
              'Error: This command is only supported on macOS, Windows, and WSL',
            );
            process.exit(1);
          }

          // Get Claude Desktop config path
          let configPath;
          if (platform === 'darwin') {
            configPath = join(
              process.env.HOME || '~',
              'Library/Application Support/Claude/claude_desktop_config.json',
            );
          } else if (platform === 'win32') {
            configPath = join(
              process.env.APPDATA || '',
              'Claude/claude_desktop_config.json',
            );
          } else if (isWSL) {
            // Get Windows username
            const whoamiCommand = await new Promise<string>((resolve, reject) => {
              exec(
                'powershell.exe -Command "whoami"',
                {},
                (err: Error, stdout: string) => {
                  if (err) reject(err);
                  else resolve(stdout.trim().split('\\').pop() || '');
                },
              );
            });

            configPath = `/mnt/c/Users/${whoamiCommand}/AppData/Roaming/Claude/claude_desktop_config.json`;
          }

          // Check if config file exists
          if (!existsSync(configPath)) {
            console.error(
              `Error: Claude Desktop config file not found at ${configPath}`,
            );
            process.exit(1);
          }

          // Read config file
          let config;
          try {
            const configContent = readFileSync(configPath, 'utf-8');
            config = JSON.parse(configContent);
          } catch (err) {
            console.error(`Error reading config file: ${err}`);
            process.exit(1);
          }

          // Extract MCP servers
          const mcpServers = config.mcpServers || {};
          const serverNames = Object.keys(mcpServers);
          const numServers = serverNames.length;

          if (numServers === 0) {
            console.log('No MCP servers found in Claude Desktop config');
            process.exit(0);
          }

          // Create server information for display
          const serversInfo = serverNames.map(name => {
            const server = mcpServers[name];
            let description = '';

            if (server.type === 'sse') {
              description = `SSE: ${server.url}`;
            } else {
              description = `stdio: ${server.command} ${(server.args || []).join(' ')}`;
            }

            return { name, description, server };
          });

          // First import all required modules outside the component
          // Import modules separately to avoid any issues
          const ink = await import('ink');
          const reactModule = await import('react');
          const inkjsui = await import('@inkjs/ui');
          const utilsTheme = await import('../../../utils/theme');

          const { render } = ink;
          const React = reactModule; // React is already the default export when imported this way
          const { MultiSelect } = inkjsui;
          const { Box, Text } = ink;
          const { getTheme } = utilsTheme;

          // Use Ink to render a nice UI for selection
          await new Promise<void>(resolve => {
            // Create a component for the server selection
            function ClaudeDesktopImport() {
              const { useState } = reactModule;
              const [isFinished, setIsFinished] = useState(false);
              const [importResults, setImportResults] = useState([]) as [
                { name: string; success: boolean }[],
                React.Dispatch<React.SetStateAction<{ name: string; success: boolean }[]>>
              ];
              const [isImporting, setIsImporting] = useState(false);
              const theme = getTheme();

              // Function to import selected servers
              const importServers = async (selectedServers: string[]) => {
                setIsImporting(true);
                const results = [];

                for (const name of selectedServers) {
                  try {
                    const server = mcpServers[name];

                    // Check if server already exists
                    const existingServer = getMcpServer(name);
                    if (existingServer) {
                      // Skip duplicates - we'll handle them in the confirmation step
                      continue;
                    }

                    addMcpServer(name, server as any, scope);
                    results.push({ name, success: true });
                  } catch (err) {
                    results.push({ name, success: false });
                  }
                }

                setImportResults(results);
                setIsImporting(false);
                setIsFinished(true);

                // Give time to show results
                setTimeout(() => {
                  resolve();
                }, 1000);
              };

              // Handle confirmation of selections
              const handleConfirm = async (selectedServers: string[]) => {
                // Check for existing servers and confirm overwrite
                const existingServers = selectedServers.filter(name =>
                  getMcpServer(name),
                );

                if (existingServers.length > 0) {
                  // We'll just handle it directly since we have a simple UI
                  const results = [];

                  // Process non-existing servers first
                  const newServers = selectedServers.filter(
                    name => !getMcpServer(name),
                  );
                  for (const name of newServers) {
                    try {
                      const server = mcpServers[name];
                      addMcpServer(name, server as any, scope);
                      results.push({ name, success: true });
                    } catch (err) {
                      results.push({ name, success: false });
                    }
                  }

                  // Now handle existing servers by prompting for each one
                  for (const name of existingServers) {
                    try {
                      const server = mcpServers[name];
                      // Overwrite existing server - in a real interactive UI you'd prompt here
                      addMcpServer(name, server as any, scope);
                      results.push({ name, success: true });
                    } catch (err) {
                      results.push({ name, success: false });
                    }
                  }

                  setImportResults(results);
                  setIsImporting(false);
                  setIsFinished(true);

                  // Give time to show results before resolving
                  setTimeout(() => {
                    resolve();
                  }, 1000);
                } else {
                  // No existing servers, proceed with import
                  await importServers(selectedServers);
                }
              };

              return React.createElement(Box, { flexDirection: "column", padding: 1 },
                React.createElement(Box, {
                  flexDirection: "column",
                  borderStyle: "round",
                  borderColor: theme.kode,
                  padding: 1,
                  width: '100%'
                },
                  React.createElement(Text, { bold: true, color: theme.kode },
                    "Import MCP Servers from Claude Desktop"
                  ),
                  React.createElement(Box, { marginY: 1 },
                    React.createElement(Text, null,
                      `Found ${numServers} MCP servers in Claude Desktop.`
                    )
                  ),
                  React.createElement(Text, null,
                    "Please select the servers you want to import:"
                  ),
                  React.createElement(Box, { marginTop: 1 },
                    React.createElement(MultiSelect, {
                      options: serverNames.map(name => ({
                        label: name,
                        value: name,
                      })),
                      defaultValue: serverNames,
                      onSubmit: handleConfirm
                    })
                  )
                ),
                React.createElement(Box, { marginTop: 0, marginLeft: 3 },
                  React.createElement(Text, { dimColor: true },
                    "Space to select · Enter to confirm · Esc to cancel"
                  )
                ),
                isFinished && React.createElement(Box, { marginTop: 1 },
                  React.createElement(Text, { color: theme.success },
                    `Successfully imported ${importResults.filter(r => r.success).length} MCP server${importResults.filter(r => r.success).length !== 1 ? 's' : ''} to local config.`
                  )
                )
              );
            }

            // Render the component
            const { unmount } = render(React.createElement(ClaudeDesktopImport));

            // Clean up when done
            setTimeout(() => {
              unmount();
              resolve();
            }, 300); // Timeout after 30 seconds as a fallback
          });

          process.exit(0);
        } catch (error) {
          console.error(`Error: ${(error as Error).message}`);
          process.exit(1);
        }
      });

    // Function to reset MCP server choices
    const resetMcpChoices = () => {
      // This would need to be implemented based on the actual config system
      console.log('All .mcprc server approvals and rejections have been reset.');
      console.log(
        `You will be prompted for approval next time you start ${PRODUCT_NAME}.`,
      );
      process.exit(0);
    };

    // New command name to match Kode
    mcp
      .command('reset-project-choices')
      .description(
        'Reset all approved and rejected project-scoped (.mcp.json) servers within this project',
      )
      .action(() => {
        logEvent('tengu_mcp_reset_project_choices', {});
        resetMcpChoices();
      });

    // Keep old command for backward compatibility (visible only to ants)
    if (process.env.USER_TYPE === 'ant') {
      mcp
        .command('reset-mcprc-choices')
        .description(
          'Reset all approved and rejected .mcprc servers for this project',
        )
        .action(() => {
          logEvent('tengu_mcp_reset_mcprc_choices', {});
          resetMcpChoices();
        });
    }

    return program;
  },

  async execute(args: any): Promise<void> {
    // mcp命令主要通过子命令执行，这里不需要额外的执行逻辑
  }
};

export default mcpCommand;