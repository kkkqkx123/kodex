#!/usr/bin/env -S node --no-warnings=ExperimentalWarning --enable-source-maps
import { initSentry } from '../services/sentry'
import { PRODUCT_COMMAND, PRODUCT_NAME } from '../constants/product'

// Declare global gcInterval for PowerShell memory leak fix
declare global {
  var gcInterval: NodeJS.Timeout | null
}

initSentry() // Initialize Sentry as early as possible

// XXX: Without this line (and the Object.keys, even though it seems like it does nothing!),
// there is a bug in Bun only on Win32 that causes this import to be removed, even though
// its use is solely because of its side-effects.

import React from 'react'
import { ReadStream } from 'tty'
import { openSync, existsSync } from 'fs'
import { render, RenderOptions } from 'ink'
import { REPL } from '../screens/REPL'
import { addToHistory } from '../history'
import { Command } from '@commander-js/extra-typings'
import { ask } from '../utils/ask'
import { hasPermissionsToUseTool } from '../permissions'
import { getTools } from '../tools'
import {
  getGlobalConfig,
  getCurrentProjectConfig,
  enableConfigs,
  validateAndRepairAllGPT5Profiles,
} from '../utils/config'
import { cwd } from 'process'
import { dateToFilename, logError } from '../utils/log'
import { initDebugLogger } from '../utils/debugLogger'
import { isDefaultSlowAndCapableModel } from '../utils/model'
import { getCommands } from '../commands'
import { getClients } from '../services/mcpClient'
import { logEvent } from '../services/featureFlags'
import { cursorShow } from 'ansi-escapes'
import { assertMinVersion } from '../utils/autoUpdater'
import { PersistentShell } from '../utils/PersistentShell'
import { MACRO } from '../constants/macros'
import { showSetupScreens, setup } from './cli/utils'
import { showInvalidConfigDialog } from '../components/InvalidConfigDialog'
import { ConfigParseError } from '../utils/errors'
import { stopAgentWatcher } from '../utils/agentLoader'
import { closeAllClients } from '../services/mcpClient'

// Import command modules
import {
  configCommand,
  approvedToolsCommand,
  mcpCommand,
  doctorCommand,
  updateCommand,
  logCommand,
  resumeCommand,
  errorCommand,
  contextCommand
} from './cli/commands'


async function main() {
  // 初始化调试日志系统
  initDebugLogger()

  // PowerShell-specific memory leak fixes
  if (process.platform === 'win32' && process.env.PSModulePath) {
    // Force garbage collection more aggressively in PowerShell
    if (global.gc) {
      // Clear any existing interval first
      if (global.gcInterval) {
        clearInterval(global.gcInterval);
        global.gcInterval = null;
      }
      
      global.gcInterval = setInterval(() => {
        try {
          global.gc();
          // Force cleanup of unused handles
          if (global.gc) {
            global.gc();
          }
        } catch (e) {
          // Ignore GC errors
        }
      }, 5000); // Run GC every 5 seconds (even more aggressive)
    }

    // Set process title to help with process identification
    try {
      process.title = 'kode-cli';
    } catch (e) {
      // Ignore title setting errors
    }

    // Additional PowerShell-specific fixes for UI rendering and memory management
    // Disable experimental features that may cause issues in PowerShell
    process.env.FORCE_COLOR = '0'; // Disable forced color output in PowerShell
    process.env.NODE_DISABLE_COLORS = '1'; // Disable colors in Node.js
    
    // Set environment variables to optimize terminal rendering in PowerShell
    process.env.TERM = 'dumb'; // Use dumb terminal mode
    
    // Reduce memory usage by limiting event listeners
    process.setMaxListeners(5); // Even more restrictive
    
    // Additional PowerShell-specific optimizations
    process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=2048';
  }

  // Validate configs are valid and enable configuration system
  try {
    enableConfigs()

    // 🔧 Validate and auto-repair GPT-5 model profiles
    try {
      const repairResult = validateAndRepairAllGPT5Profiles()
      if (repairResult.repaired > 0) {
        console.log(`🔧 Auto-repaired ${repairResult.repaired} GPT-5 model configurations`)
      }
    } catch (repairError) {
      // Don't block startup if GPT-5 validation fails
      console.warn('⚠️ GPT-5 configuration validation failed:', repairError)
    }
  } catch (error: unknown) {
    if (error instanceof ConfigParseError) {
      // Show the invalid config dialog with the error object
      await showInvalidConfigDialog({ error })
      return // Exit after handling the config error
    }
  }

  let inputPrompt = ''
  let renderContext: RenderOptions | undefined = {
    exitOnCtrlC: false,
  }
  
  // PowerShell-specific rendering context adjustments
  if (process.platform === 'win32' && process.env.PSModulePath) {
    // Use a simpler rendering context for PowerShell to prevent memory leaks
    renderContext = {
      exitOnCtrlC: false,
      patchConsole: false, // Disable console patching in PowerShell
      debug: false, // Disable debug mode in PowerShell
    }
  }

  if (
    !process.stdin.isTTY &&
    !process.env.CI &&
    // Input hijacking breaks MCP.
    !process.argv.includes('mcp')
  ) {
    inputPrompt = await stdin()
    if (process.platform !== 'win32') {
      try {
        const ttyFd = openSync('/dev/tty', 'r')
        renderContext = { ...renderContext, stdin: new ReadStream(ttyFd) }
      } catch (err) {
        logError(`Could not open /dev/tty: ${err}`)
      }
    }
  }
  await parseArgs(inputPrompt, renderContext)
}

async function parseArgs(
  stdinContent: string,
  renderContext: RenderOptions | undefined,
): Promise<Command> {
  const program = new Command()

  // PowerShell-specific render context adjustments
  const renderContextWithExitOnCtrlC = process.platform === 'win32' && process.env.PSModulePath
    ? {
        ...renderContext,
        exitOnCtrlC: false,
        patchConsole: false, // Disable console patching in PowerShell
      }
    : {
        ...renderContext,
        exitOnCtrlC: false,
      }

  // Get the initial list of commands filtering based on user type
  const commands = await getCommands()

  // Format command list for help text (using same filter as in help.ts)
  const commandList = commands
    .filter(cmd => !cmd.isHidden)
    .map(cmd => `/${cmd.name} - ${cmd.description}`)
    .join('\n')

  program
    .name(PRODUCT_COMMAND)
    .description(
      `${PRODUCT_NAME} - starts an interactive session by default, use -p/--print for non-interactive output

Slash commands available during an interactive session:
${commandList}`,
    )
    .argument('[prompt]', 'Your prompt', String)
    .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
    .option('-d, --debug', 'Enable debug mode', () => true)
    .option(
      '--debug-verbose',
      'Enable verbose debug terminal output',
      () => true,
    )
    .option(
      '--verbose',
      'Override verbose mode setting from config',
      () => true,
    )
    .option('-e, --enable-architect', 'Enable the Architect tool', () => true)
    .option(
      '-p, --print',
      'Print response and exit (useful for pipes)',
      () => true,
    )
    .option(
      '--safe',
      'Enable strict permission checking mode (default is permissive)',
      () => true,
    )
    .action(
      async (prompt, { cwd, debug, verbose, enableArchitect, print, safe }) => {
        await showSetupScreens(safe, print)
        logEvent('tengu_init', {
          entrypoint: PRODUCT_COMMAND,
          hasInitialPrompt: Boolean(prompt).toString(),
          hasStdin: Boolean(stdinContent).toString(),
          enableArchitect: enableArchitect?.toString() ?? 'false',
          verbose: verbose?.toString() ?? 'false',
          debug: debug?.toString() ?? 'false',
          print: print?.toString() ?? 'false',
        })
        await setup(cwd, safe)

        assertMinVersion()

        const [tools, mcpClients] = await Promise.all([
          getTools(
            enableArchitect ?? getCurrentProjectConfig().enableArchitectTool,
          ),
          getClients(),
        ])

        const inputPrompt = [prompt, stdinContent].filter(Boolean).join('\n')
        if (print) {
          if (!inputPrompt) {
            console.error(
              'Error: Input must be provided either through stdin or as a prompt argument when using --print',
            )
            process.exit(1)
          }

          addToHistory(inputPrompt)
          const { resultText: response } = await ask({
            commands,
            hasPermissionsToUseTool,
            messageLogName: dateToFilename(new Date()),
            prompt: inputPrompt,
            cwd,
            tools,
            safeMode: safe,
          })
          console.log(response)
          process.exit(0)
        } else {
          const isDefaultModel = await isDefaultSlowAndCapableModel()

          render(
            <REPL
              commands={commands}
              debug={debug}
              initialPrompt={inputPrompt}
              messageLogName={dateToFilename(new Date())}
              shouldShowPromptInput={true}
              verbose={verbose}
              tools={tools}
              safeMode={safe}
              mcpClients={mcpClients}
              isDefaultModel={isDefaultModel}
            />,
            renderContext,
          )
        }
      },
    )
    .version(MACRO.VERSION, '-v, --version')

  // Register command modules
  configCommand.configure(program)
  approvedToolsCommand.configure(program)
  mcpCommand.configure(program)
  new doctorCommand().configure(program)
  new updateCommand().configure(program)
  new logCommand().configure(program)
  new resumeCommand().configure(program)
  new errorCommand().configure(program)
  new contextCommand().configure(program)

  // Check if the first argument is a command-line option
  const firstArg = process.argv[2]
  if (firstArg && firstArg.startsWith('-')) {
    // If the first argument is an option, parse all arguments as command-line options
    await program.parseAsync(process.argv)
  } else {
    // Otherwise, treat the arguments as a prompt
    await program.parseAsync(process.argv.slice(0, 2).concat(['--']).concat(process.argv.slice(2)))
  }
  return program
}

// TODO: stream?
async function stdin() {
  if (process.stdin.isTTY) {
    return ''
  }

  let data = ''
  for await (const chunk of process.stdin) data += chunk
  return data
}

process.on('exit', () => {
  resetCursor()
  PersistentShell.getInstance().close()
  // Clean up file watchers to prevent memory leaks
  stopAgentWatcher().catch(err => {
    console.warn('Failed to stop agent watchers:', err)
  })
  // Clean up MCP client connections
  if (typeof closeAllClients === 'function') {
    closeAllClients().catch(err => {
      console.warn('Failed to close MCP clients:', err)
    })
  }
  // Clean up GC interval
  if (global.gcInterval) {
    clearInterval(global.gcInterval)
    global.gcInterval = null
  }
  // Force final garbage collection
  if (global.gc) {
    try {
      global.gc()
    } catch (e) {
      // Ignore GC errors
    }
  }
})

// SIGINT handling is now managed by the REPL component
// process.on('SIGINT', () => {
//   // Clean up before exit
//   // Clean up GC interval
//   if (global.gcInterval) {
//     clearInterval(global.gcInterval)
//     global.gcInterval = null
//   }

//   // Force garbage collection before exit
//   if (global.gc) {
//     try {
//       global.gc()
//     } catch (e) {
//       // Ignore GC errors
//     }
//   }

//   Promise.allSettled([
//     stopAgentWatcher(),
//     closeAllClients(),
//     PersistentShell.getInstance().close()
//   ]).finally(() => {
//     process.exit(0)
//   })
// })

process.on('SIGTERM', () => {
  // Clean up before exit
  // Clean up GC interval
  if (global.gcInterval) {
    clearInterval(global.gcInterval)
    global.gcInterval = null
  }

  // Force garbage collection before exit
  if (global.gc) {
    try {
      global.gc()
    } catch (e) {
      // Ignore GC errors
    }
  }

  Promise.allSettled([
    stopAgentWatcher(),
    closeAllClients(),
    PersistentShell.getInstance().close()
  ]).finally(() => {
    process.exit(0)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // Force cleanup on uncaught exceptions
  if (global.gcInterval) {
    clearInterval(global.gcInterval)
    global.gcInterval = null
  }
  if (global.gc) {
    try {
      global.gc()
    } catch (e) {
      // Ignore GC errors
    }
  }
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Force cleanup on unhandled rejections
  if (global.gcInterval) {
    clearInterval(global.gcInterval)
    global.gcInterval = null
  }
  if (global.gc) {
    try {
      global.gc()
    } catch (e) {
      // Ignore GC errors
    }
  }
})

function resetCursor() {
  const terminal = process.stderr.isTTY
    ? process.stderr
    : process.stdout.isTTY
      ? process.stdout
      : undefined
  terminal?.write(`\u001B[?25h${cursorShow}`)
}

main()