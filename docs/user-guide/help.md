Usage: kode [options] [command] [prompt]
开发环境kode换bun run dev

option以--/-开头。没有则跳过
command中`Commands:`的部分可以直接通过上述格式使用。否则解析为prompt(如help)

Kode - starts an interactive session by default, use -p/--print for non-interactive output

Slash commands available during an interactive session:
/agents - Manage AI agents
/clear - Clear conversation history and free up context
/compact - Clear conversation history but keep a summary in context
/config - Open config panel
/config-cmd - Manage command configurations and templates
/cost - Show the total cost and detailed token statistics of the current session
/exit - Show the total cost and duration of the current session, then exit the process
/quit - Show the total cost and duration of the current session, then exit the process
/doctor - Checks the health of your Kode installation
/help - Show help and available commands
/init - Initialize a new AGENTS.md file with codebase documentation
/ignore - Manage project ignore rules
/kiro-spec - Create comprehensive specification documents for development projects
/mcp - Show MCP server connection status
/todo - Manage todo list operations
/model - Change your AI provider and model settings
/modelstatus - Display current model configuration and status
/onboarding - Run through the onboarding flow
/pr-comments - Get comments from a GitHub pull request
/refresh-commands - Reload custom commands from filesystem
/bug - Submit feedback about Kode
/review - Review a pull request
/terminal-setup - Install Shift+Enter key binding for newlines (iTerm2 and VSCode only)
/lastreq - Force interrupt LLM agent, terminate current task, rollback to previous API request, add prompt content to previous context, and automatically
reissue API request
/undo - Force interrupt LLM agent, terminate current task, rollback to previous API request, add prompt content to previous context, then pause
/lasti - Force interrupt LLM agent, terminate current task, and rollback to previous user input, wait for user instruction. Clear context.
/context - Export full context to .kode/context_export/ file with filename format of MMDD_HHMM_UUID
/ctx-viz - Show token usage breakdown for the current conversation context
/resume - Resume a previous conversation

Arguments:
  prompt                         Your prompt

Options:
  -c, --cwd <cwd>                The current working directory (default: "D:\\ide\\AI-CLI\\Kode")
  -d, --debug                    Enable debug mode
  --debug-verbose                Enable verbose debug terminal output
  --verbose                      Override verbose mode setting from config
  -e, --enable-architect         Enable the Architect tool
  -p, --print                    Print response and exit (useful for pipes)
  --safe                         Enable strict permission checking mode (default is permissive)
  -v, --version                  output the version number
  -h, --help                     display help for command

Commands:
  config                         Manage configuration (eg. claude config set -g theme dark)
  approved-tools                 Manage approved tools
  mcp                            Configure and manage MCP servers
  doctor                         Check the health of your Kode auto-updater
  update                         Check for updates and install if available
  log [options] [number]         Manage conversation logs.
  resume [options] [identifier]  Resume a previous conversation. Optionally provide a number (0, 1, 2, etc.) or file path to resume a specific
                                 conversation.
  error [options] [number]       View error logs. Optionally provide a number (0, -1, -2, etc.) to display a specific log.
  context                        Set static context (eg. kode context add-file ./src/*.py)