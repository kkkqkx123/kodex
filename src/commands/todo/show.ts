import { Command } from '../../commands'
import { TodoService } from '../../services/todoService'
import { formatTodoListForDisplay } from './utils'

export const showTodo = {
  type: 'local',
  name: 'todo-show',
  description: 'Display current todo list content',
  isEnabled: true,
  isHidden: true,
  async call() {
    const todoService = TodoService.getInstance()
    const todoList = await todoService.getTodoList()
    
    const displayText = formatTodoListForDisplay(todoList)
    
    // 在新窗口中显示（这里返回文本，由上层处理显示）
    return displayText
  },
  userFacingName() {
    return 'todo-show'
  },
} satisfies Command