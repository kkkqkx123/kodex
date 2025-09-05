import { Command } from '../../commands'
import { updateTodo } from './update'
import { showTodo } from './show'
import { rollbackTodo } from './rollback'
import { newTodo } from './new'

const SUBCOMMANDS = {
  'update': updateTodo,
  'show': showTodo,
  'rollback': rollbackTodo,
  'new': newTodo
}

export const todoCommand: Command = {
  type: 'local',
  name: 'todo',
  description: 'Manage todo list operations',
  isEnabled: true,
  isHidden: false,
  async call(args: string, context) {
    const [subcommand, ...restArgs] = args.trim().split(' ')
    
    if (!subcommand) {
      return 'Available subcommands: /todo /update, /todo /show, /todo /rollback, /todo /new @filename'
    }

    const subcommandHandler = SUBCOMMANDS[subcommand as keyof typeof SUBCOMMANDS]
    
    if (!subcommandHandler) {
      return `Unknown subcommand: ${subcommand}. Available subcommands: update, show, rollback, new`
    }

    // 调用对应的子命令
    return subcommandHandler.call(restArgs.join(' '), context)
  },
  userFacingName() {
    return 'todo'
  },
} satisfies Command