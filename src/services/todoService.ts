import { TodoItem, TodoList } from '../types/todo'
import { getSessionState, setSessionState } from '../utils/sessionState'

const TODO_STORAGE_KEY = 'todoList'

export class TodoService {
  private static instance: TodoService

  static getInstance(): TodoService {
    if (!TodoService.instance) {
      TodoService.instance = new TodoService()
    }
    return TodoService.instance
  }

  async getTodoList(): Promise<TodoList> {
    const state = getSessionState() as any
    const stored = state[TODO_STORAGE_KEY] as TodoList | undefined
    
    if (stored) {
      return stored
    }

    // 返回空的todo list
    return {
      items: [],
      version: 1,
      lastUpdated: new Date()
    }
  }

  async saveTodoList(todoList: TodoList): Promise<void> {
    const state = getSessionState() as any
    setSessionState({
      ...state,
      [TODO_STORAGE_KEY]: {
        ...todoList,
        lastUpdated: new Date()
      }
    } as any)
  }

  async addTodoItem(title: string, description?: string): Promise<TodoItem> {
    const todoList = await this.getTodoList()
    const newItem: TodoItem = {
      id: this.generateId(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    todoList.items.push(newItem)
    todoList.version += 1
    await this.saveTodoList(todoList)

    return newItem
  }

  async updateTodoItem(id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>): Promise<TodoItem | null> {
    const todoList = await this.getTodoList()
    const itemIndex = todoList.items.findIndex(item => item.id === id)
    
    if (itemIndex === -1) {
      return null
    }

    const updatedItem = {
      ...todoList.items[itemIndex],
      ...updates,
      updatedAt: new Date()
    }

    todoList.items[itemIndex] = updatedItem
    todoList.version += 1
    await this.saveTodoList(todoList)

    return updatedItem
  }

  async markAllAsIncomplete(): Promise<void> {
    const todoList = await this.getTodoList()
    
    for (const item of todoList.items) {
      item.completed = false
      item.updatedAt = new Date()
    }

    todoList.version += 1
    await this.saveTodoList(todoList)
  }

  async replaceTodoList(newItems: TodoItem[]): Promise<TodoList> {
    const newTodoList: TodoList = {
      items: newItems,
      version: 1,
      lastUpdated: new Date()
    }

    await this.saveTodoList(newTodoList)
    return newTodoList
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}