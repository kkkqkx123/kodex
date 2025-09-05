import { Command } from '../../commands'
import { readFileSync } from 'fs'
import { validateTodoListFormat } from './utils'
import { TodoService } from '../../services/todoService'

export const newTodo = {
  type: 'local',
  name: 'todo-new',
  description: 'Replace todo list with content from file',
  isEnabled: true,
  isHidden: true,
  async call(args: string) {
    // 解析文件路径（支持@filename格式）
    const filePath = args.trim()
    if (!filePath) {
      throw new Error('Please specify a file path using @filename format')
    }

    if (!filePath.startsWith('@')) {
      throw new Error('File path must start with @ symbol')
    }

    // 提取实际文件路径（去掉@符号）
    const actualFilePath = filePath.substring(1).trim()
    if (!actualFilePath) {
      throw new Error('Invalid file path format')
    }

    try {
      // 读取文件内容
      const fileContent = readFileSync(actualFilePath, 'utf-8')
      
      // 验证文件格式
      const validationResult = validateTodoListFormat(fileContent)
      
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors 
          ? `Invalid todo list format:\n${validationResult.errors.join('\n')}`
          : 'Invalid todo list format'
        
        throw new Error(errorMessage)
      }

      // 替换现有的todo list
      const todoService = TodoService.getInstance()
      await todoService.replaceTodoList(validationResult.todoList!.items)

      return `Todo list successfully replaced from file: ${actualFilePath}`

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load todo list from file: ${error.message}`)
      }
      throw new Error('Failed to load todo list from file: Unknown error')
    }
  },
  userFacingName() {
    return 'todo-new'
  },
} satisfies Command