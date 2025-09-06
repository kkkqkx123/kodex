import { CommandInterface } from '../types'
import { Command } from '@commander-js/extra-typings'
import { LogList } from '../../../screens/LogList'
import { render } from 'ink'
import { logEvent } from '../../../services/featureFlags'
import { setup } from '../../cli/utils'
import { cwd } from 'process'
import React from 'react'
export class ErrorCommand implements CommandInterface {
  name = 'error'
  description = 'View error logs'

  configure(program: Command): Command {
    program
      .command('error')
      .description(
        'View error logs. Optionally provide a number (0, -1, -2, etc.) to display a specific log.',
      )
      .argument(
        '[number]',
        'A number (0, 1, 2, etc.) to display a specific log',
        parseInt,
      )
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .action(async (number, { cwd }) => {
        await setup(cwd, false)
        logEvent('tengu_view_errors', { number: number?.toString() ?? '' })
        const context: { unmount?: () => void } = {}
        const { unmount } = render(
          <LogList context={context} type="errors" logNumber={number} />,
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