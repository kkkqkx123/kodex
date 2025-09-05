import { Command, getCommand, getCommands } from '../../commands'
import { queryLLM } from '../../services/claude'
import { createUserMessage, normalizeMessagesForAPI } from '../../utils/messages'
import { TodoService } from '../../services/todoService'
import compact from '../../commands/compact'
import { loadCustomPrompt, getCommandMetadata } from '../../utils/configLoader'

const DEFAULT_UPDATE_TODO_PROMPT = `Please review the current todo list and update its completion status based on our conversation progress. 
Carefully examine each todo item and determine if it has been completed based on the work we've done together. Mark items as completed only if they have been fully implemented.
After updating the todo list, please continue with the remaining tasks from where we left off.`

export const updateTodo = {
  type: 'local',
  name: 'todo-update',
  description: 'Update todo list status and continue tasks',
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
    // 首先调用compact命令
    const commands = await getCommands()
    await compact.call('', {
      options: { commands, tools, slowAndCapableModel: 'main' },
      abortController,
      setForkConvoWithMessagesOnTheNextRender,
    })

    // 获取当前todo list
    const todoService = TodoService.getInstance()
    const todoList = await todoService.getTodoList()
    
    // 准备API请求
    const todoListSummary = `Current Todo List:\n${todoList.items.map(item => 
      `- ${item.completed ? '✅' : '⬜'} ${item.title}`
    ).join('\n')}`

    // 加载自定义提示词
    const metadata = getCommandMetadata('todo-update', true)
    const customPrompt = loadCustomPrompt('todo-update', metadata)
    const updateTodoPrompt = customPrompt || DEFAULT_UPDATE_TODO_PROMPT

    const updateRequest = createUserMessage(`${updateTodoPrompt}\n\n${todoListSummary}`)

    // 发送API请求
    const response = await queryLLM(
      normalizeMessagesForAPI([updateRequest]),
      [
        'You are a helpful AI assistant tasked with managing todo lists and continuing development work.',
        'Please update the todo list completion status based on actual progress and continue with remaining tasks.'
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
        : 'Todo list updated successfully. Continuing with remaining tasks.'

    return result
  },
  userFacingName() {
    return 'todo-update'
  },
} satisfies Command