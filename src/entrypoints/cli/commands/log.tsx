import { CommandInterface } from '../types'
import { Command } from '@commander-js/extra-typings'
import { LogList } from '../../../screens/LogList'
import { render } from 'ink'
import { logEvent } from '../../../services/featureFlags'
import { setup } from '../../cli/utils'
import { cwd } from 'process'
import React from 'react'
export class LogCommand implements CommandInterface {
  name = 'log'
  description = 'Manage conversation logs'

  configure(program: Command): Command {
    program
      .command('log')
      .description('Manage conversation logs.')
      .argument(
        '[number]',
        'A number (0, 1, 2, etc.) to display a specific log',
        parseInt,
      )
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .action(async (number, { cwd }) => {
        await setup(cwd, false)
        logEvent('tengu_view_logs', { number: number?.toString() ?? '' })
        const context: { unmount?: () => void } = {}
        const { unmount } = render(
          <LogList context={context} type="messages" logNumber={number} />,
          { exitOnCtrlC: true },
        )
        context.unmount = unmount
      })
    return program
  }

  async execute(): Promise<void> {
    // This command is handled by the configure method
  }
}