export interface TodoItem {
  id: string
  title: string
  description?: string
  completed: boolean
  inProgress?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TodoList {
  items: TodoItem[]
  version: number
  lastUpdated: Date
}

export interface TodoCommandArgs {
  subcommand: 'update' | 'show' | 'rollback' | 'new'
  filePath?: string
  userInstructions?: string
}

export interface TodoValidationResult {
  isValid: boolean
  errors?: string[]
  todoList?: TodoList
}