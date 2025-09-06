import { CommandInterface } from '../types'
import { Command } from '@commander-js/extra-typings'
import { getContext, setContext, removeContext } from '../../../context'
import { logEvent } from '../../../services/featureFlags'
import { setup } from '../../cli/utils'
import { cwd } from 'process'
import { omit } from 'lodash-es'

export class ContextCommand implements CommandInterface {
  name = 'context'
  description = 'Set static context'

  configure(program: Command): Command {
    const context = program
      .command('context')
      .description(
        `Set static context (eg. ${program.name()} context add-file ./src/*.py)`,
      )

    context
      .command('get <key>')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .description('Get a value from context')
      .action(async (key, { cwd }) => {
        await setup(cwd, false)
        logEvent('tengu_context_get', { key })
        const context = omit(
          await getContext(),
          'codeStyle',
          'directoryStructure',
        )
        console.log(context[key])
        process.exit(0)
      })

    context
      .command('set <key> <value>')
      .description('Set a value in context')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .action(async (key, value, { cwd }) => {
        await setup(cwd, false)
        logEvent('tengu_context_set', { key })
        setContext(key, value)
        console.log(`Set context.${key} to "${value}"`)
        process.exit(0)
      })

    context
      .command('list')
      .description('List all context values')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .action(async ({ cwd }) => {
        await setup(cwd, false)
        logEvent('tengu_context_list', {})
        const context = omit(
          await getContext(),
          'codeStyle',
          'directoryStructure',
          'gitStatus',
        )
        console.log(JSON.stringify(context, null, 2))
        process.exit(0)
      })

    context
      .command('remove <key>')
      .description('Remove a value from context')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .action(async (key, { cwd }) => {
        await setup(cwd, false)
        logEvent('tengu_context_delete', { key })
        removeContext(key)
        console.log(`Removed context.${key}`)
        process.exit(0)
      })
    return program
  }

  async execute(): Promise<void> {
    // This command is handled by the configure method
  }
}