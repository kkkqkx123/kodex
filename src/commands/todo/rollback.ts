import { Command, getCommand, getCommands } from '../../commands'
import { queryLLM } from '../../services/claude'
import { createUserMessage, normalizeMessagesForAPI } from '../../utils/messages'
import { TodoService } from '../../services/todoService'
import compact from '../../commands/compact'
import { loadCustomPrompt, getCommandMetadata } from '../../utils/configLoader'

const DEFAULT_ROLLBACK_PROMPT = `Todo list has been rolled back to incomplete status. Please check if the todo list items have been fully completed. If they are completely done, mark them as completed and continue to the next step.`

export const rollbackTodo = {
  type: 'local',
  name: 'todo-rollback',
  description: 'Rollback todo list and recheck completion status',
  isEnabled: true,
  isHidden: true,

  async call(
    _,
    {
      options: { tools },
      abortController,
      setForkConvoWithMessagesOnTheNextRender,
    },
  ) {
    // 首先标记所有todo为未完成
    const todoService = TodoService.getInstance()
    await todoService.markAllAsIncomplete()
    
    // 调用compact命令
    const commands = await getCommands()
    await compact.call('', {
      options: { commands, tools, slowAndCapableModel: 'main' },
      abortController,
      setForkConvoWithMessagesOnTheNextRender,
    })

    // 获取更新后的todo list
    const todoList = await todoService.getTodoList()
    
    // 准备API请求
    const todoListSummary = `Rolled Back Todo List:\n${todoList.items.map(item => 
      `- ${item.completed ? '✅' : '⬜'} ${item.title}`
    ).join('\n')}`

    // 加载自定义提示词
    const metadata = getCommandMetadata('todo-rollback', true)
    const customPrompt = loadCustomPrompt('todo-rollback', metadata)
    const rollbackPrompt = customPrompt || DEFAULT_ROLLBACK_PROMPT

    const rollbackRequest = createUserMessage(`${rollbackPrompt}\n\n${todoListSummary}`)

    // 发送API请求
    const response = await queryLLM(
      normalizeMessagesForAPI([rollbackRequest]),
      [
        'You are a helpful AI assistant tasked with rechecking todo list completion status after a rollback.',
        'Please carefully verify if each todo item has been fully completed and mark them appropriately.'
      ],
      0,
      tools,
      abortController.signal,
      {
        safeMode: false,
        model: 'main',
        prependCLISysprompt: true,
      },
    )

    const content = response.message.content
    const result = typeof content === 'string'
      ? content
      : content.length > 0 && content[0]?.type === 'text'
        ? content[0].text
        : 'Todo list rollback completed. Rechecking completion status.'

    return result
  },
  userFacingName() {
    return 'todo-rollback'
  },
} satisfies Command