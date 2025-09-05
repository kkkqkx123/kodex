import { TodoList, TodoValidationResult } from '../../types/todo'

export function validateTodoListFormat(content: string): TodoValidationResult {
  const lines = content.trim().split('\n')
  const errors: string[] = []
  const validItems: any[] = []

  // 检查是否为空内容
  if (lines.length === 0) {
    return {
      isValid: false,
      errors: ['Todo list content is empty']
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 跳过空行
    if (!line) continue
    
    // 验证markdown checklist格式
    const checklistRegex = /^\s*\[([ x\-])\]\s+(.+)$/
    const match = line.match(checklistRegex)
    
    if (!match) {
      errors.push(`Line ${i + 1}: Invalid todo item format. Expected format: [ ] Task description or [x] Completed task`)
      continue
    }

    const status = match[1]
    const title = match[2].trim()
    
    if (!title) {
      errors.push(`Line ${i + 1}: Task description cannot be empty`)
      continue
    }

    // 转换状态
    let completed = false
    let inProgress = false
    
    if (status === 'x') {
      completed = true
    } else if (status === '-') {
      inProgress = true
    }

    validItems.push({
      id: generateItemId(),
      title: title,
      description: '',
      completed: completed,
      inProgress: inProgress,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors
    }
  }

  if (validItems.length === 0) {
    return {
      isValid: false,
      errors: ['No valid todo items found']
    }
  }

  const todoList: TodoList = {
    items: validItems,
    version: 1,
    lastUpdated: new Date()
  }

  return {
    isValid: true,
    todoList
  }
}

export function generateItemId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatTodoListForDisplay(todoList: TodoList): string {
  if (todoList.items.length === 0) {
    return 'No todo items found.'
  }

  let output = `Todo List (Version ${todoList.version}) - Last Updated: ${todoList.lastUpdated.toLocaleString()}\n\n`
  
  todoList.items.forEach((item, index) => {
    let status = '⬜'
    if (item.completed) {
      status = '✅'
    } else if (item.inProgress) {
      status = '🔄'
    }
    
    output += `${index + 1}. ${status} ${item.title}\n`
    if (item.description) {
      output += `   Description: ${item.description}\n`
    }
    output += `   Created: ${item.createdAt.toLocaleString()}\n`
    if (item.completed) {
      output += `   Completed: ${item.updatedAt.toLocaleString()}\n`
    } else if (item.inProgress) {
      output += `   In Progress: ${item.updatedAt.toLocaleString()}\n`
    }
    output += '\n'
  })

  return output
}