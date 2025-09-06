import { CommandInterface } from '../types'
import { Command } from '@commander-js/extra-typings'
import { ResumeConversation } from '../../../screens/ResumeConversation'
import { render } from 'ink'
import { logEvent } from '../../../services/featureFlags'
import { setup, parseIntValue, isValidNumber } from '../../cli/utils'
import { cwd } from 'process'
import { getTools } from '../../../tools'
import { getCurrentProjectConfig } from '../../../utils/config'
import { getCommands } from '../../../commands'
import { loadLogList, CACHE_PATHS, parseLogFilename, getNextAvailableLogForkNumber, loadMessagesFromLog } from '../../../utils/log'
import { getClients } from '../../../services/mcpClient'
import { existsSync } from 'fs'
import { logError } from '../../../utils/log'
import { REPL } from '../../../screens/REPL'
import { isDefaultSlowAndCapableModel } from '../../../utils/model'
import { assertMinVersion } from '../../../utils/autoUpdater'
import React from 'react'

export class ResumeCommand implements CommandInterface {
  name = 'resume'
  description = 'Resume a previous conversation'

  configure(program: Command): Command {
    program
      .command('resume')
      .description(
        'Resume a previous conversation. Optionally provide a number (0, 1, 2, etc.) or file path to resume a specific conversation.',
      )
      .argument(
        '[identifier]',
        'A number (0, 1, 2, etc.) or file path to resume a specific conversation',
      )
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .option('-e, --enable-architect', 'Enable the Architect tool', () => true)
      .option('-v, --verbose', 'Do not truncate message output', () => true)
      .option(
        '--safe',
        'Enable strict permission checking mode (default is permissive)',
        () => true,
      )
      .action(async (identifier, { cwd, enableArchitect, safe, verbose }) => {
        await setup(cwd, safe)
        assertMinVersion()

        const [tools, commands, logs, mcpClients] = await Promise.all([
          getTools(
            enableArchitect ?? getCurrentProjectConfig().enableArchitectTool,
          ),
          getCommands(),
          loadLogList(CACHE_PATHS.messages()),
          getClients(),
        ])

        // If a specific conversation is requested, load and resume it directly
        if (identifier !== undefined) {
          // Check if identifier is a number or a file path
          const number = parseIntValue(identifier)
          const isNumber = isValidNumber(number)
          let messages, date, forkNumber
          try {
            if (isNumber) {
              logEvent('tengu_resume', { number: number.toString() })
              const log = logs[number]
              if (!log) {
                console.error('No conversation found at index', number)
                process.exit(1)
              }
              messages = await loadMessagesFromLog(log.fullPath, tools)
              ;({ date, forkNumber } = log)
            } else {
              // Handle file path case
              logEvent('tengu_resume', { filePath: identifier })
              if (!existsSync(identifier)) {
                console.error('File does not exist:', identifier)
                process.exit(1)
              }
              messages = await loadMessagesFromLog(identifier, tools)
              const pathSegments = identifier.split('/')
              const filename = pathSegments[pathSegments.length - 1] ?? 'unknown'
              ;({ date, forkNumber } = parseLogFilename(filename))
            }
            const fork = getNextAvailableLogForkNumber(date, forkNumber ?? 1, 0)
            const isDefaultModel = await isDefaultSlowAndCapableModel()
            render(
              <REPL
                initialPrompt=""
                messageLogName={date}
                initialForkNumber={fork}
                shouldShowPromptInput={true}
                verbose={verbose}
                commands={commands}
                tools={tools}
                safeMode={safe}
                initialMessages={messages}
                mcpClients={mcpClients}
                isDefaultModel={isDefaultModel}
              />,
              { exitOnCtrlC: false },
            )
          } catch (error) {
            logError(`Failed to load conversation: ${error}`)
            process.exit(1)
          }
        } else {
          // Show the conversation selector UI
          const context: { unmount?: () => void } = {}
          const { unmount } = render(
            <ResumeConversation
              context={context}
              commands={commands}
              logs={logs}
              tools={tools}
              verbose={verbose}
            />,
            { exitOnCtrlC: true },
          )
          context.unmount = unmount
        }
      })
    return program
  }

  async execute(): Promise<void> {
    // This command is handled by the configure method
  }
}