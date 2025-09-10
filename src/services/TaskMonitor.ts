import { EventEmitter } from 'events'

export interface TaskStartInfo {
  description: string
  agentType: string
  model?: string
  prompt?: string
}

export interface ActiveTask {
  id: string
  description: string
  agentType: string
  model?: string
  prompt?: string
  startTime: number
  lastUpdate: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  message?: string
  error?: string
  endTime?: number
}

export interface TaskEvent {
  type: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled'
  task: ActiveTask
  timestamp: number
}

export class TaskMonitor extends EventEmitter {
  private static instance: TaskMonitor
  private activeTasks: Map<string, ActiveTask> = new Map()
  private taskHistory: ActiveTask[] = []
  private maxHistorySize = 100

  private constructor() {
    super()
    this.setMaxListeners(100) // Allow many listeners for task events
  }

  static getInstance(): TaskMonitor {
    if (!TaskMonitor.instance) {
      TaskMonitor.instance = new TaskMonitor()
    }
    return TaskMonitor.instance
  }

  /**
   * Start tracking a new task
   */
  startTask(taskId: string, taskInfo: TaskStartInfo): void {
    const task: ActiveTask = {
      id: taskId,
      ...taskInfo,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      status: 'running',
      progress: 0
    }

    this.activeTasks.set(taskId, task)
    this.emitEvent('started', task)
  }

  /**
   * Update task progress
   */
  updateProgress(taskId: string, progress: number, message?: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task) return

    task.progress = Math.max(0, Math.min(100, progress)) // Clamp between 0-100
    task.lastUpdate = Date.now()
    if (message) task.message = message

    this.emitEvent('progress', task)
  }

  /**
   * Update task message without changing progress
   */
  updateMessage(taskId: string, message: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task) return

    task.message = message
    task.lastUpdate = Date.now()

    this.emitEvent('progress', task)
  }

  /**
   * Mark a task as completed
   */
  completeTask(taskId: string, message?: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task) return

    task.status = 'completed'
    task.progress = 100
    task.endTime = Date.now()
    task.lastUpdate = Date.now()
    if (message) task.message = message

    this.emitEvent('completed', task)
    
    // Move to history after a short delay
    setTimeout(() => {
      this.moveToHistory(taskId)
    }, 5000) // Keep in active tasks for 5 seconds after completion
  }

  /**
   * Mark a task as failed
   */
  failTask(taskId: string, error: string, message?: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task) return

    task.status = 'failed'
    task.error = error
    task.endTime = Date.now()
    task.lastUpdate = Date.now()
    if (message) task.message = message

    this.emitEvent('failed', task)
    
    // Move to history after a short delay
    setTimeout(() => {
      this.moveToHistory(taskId)
    }, 5000) // Keep in active tasks for 5 seconds after failure
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string, message?: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task || task.status === 'completed' || task.status === 'failed') return

    task.status = 'cancelled'
    task.endTime = Date.now()
    task.lastUpdate = Date.now()
    if (message) task.message = message

    this.emitEvent('cancelled', task)
    
    // Move to history after a short delay
    setTimeout(() => {
      this.moveToHistory(taskId)
    }, 5000) // Keep in active tasks for 5 seconds after cancellation
  }

  /**
   * Get all active tasks
   */
  getActiveTasks(): ActiveTask[] {
    return Array.from(this.activeTasks.values())
  }

  /**
   * Get a specific task by ID
   */
  getTask(taskId: string): ActiveTask | undefined {
    return this.activeTasks.get(taskId)
  }

  /**
   * Get task history
   */
  getTaskHistory(limit?: number): ActiveTask[] {
    const history = [...this.taskHistory].reverse() // Most recent first
    return limit ? history.slice(0, limit) : history
  }

  /**
   * Clear task history
   */
  clearHistory(): void {
    this.taskHistory = []
  }

  /**
   * Get statistics about tasks
   */
  getStatistics(): {
    total: number
    active: number
    completed: number
    failed: number
    cancelled: number
    averageDuration: number
  } {
    const allTasks = [...this.getActiveTasks(), ...this.taskHistory]
    
    const stats = {
      total: allTasks.length,
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      averageDuration: 0
    }

    let totalDuration = 0
    let completedCount = 0

    for (const task of allTasks) {
      switch (task.status) {
        case 'running':
        case 'pending':
          stats.active++
          break
        case 'completed':
          stats.completed++
          if (task.endTime) {
            totalDuration += task.endTime - task.startTime
            completedCount++
          }
          break
        case 'failed':
          stats.failed++
          break
        case 'cancelled':
          stats.cancelled++
          break
      }
    }

    if (completedCount > 0) {
      stats.averageDuration = totalDuration / completedCount
    }

    return stats
  }

  /**
   * Subscribe to task events
   */
  onTaskEvent(callback: (event: TaskEvent) => void): () => void {
    this.on('taskEvent', callback)
    return () => this.off('taskEvent', callback)
  }

  /**
   * Subscribe to specific task event types
   */
  onTaskStarted(callback: (task: ActiveTask) => void): () => void {
    this.on('task:started', callback)
    return () => this.off('task:started', callback)
  }

  onTaskProgress(callback: (task: ActiveTask) => void): () => void {
    this.on('task:progress', callback)
    return () => this.off('task:progress', callback)
  }

  onTaskCompleted(callback: (task: ActiveTask) => void): () => void {
    this.on('task:completed', callback)
    return () => this.off('task:completed', callback)
  }

  onTaskFailed(callback: (task: ActiveTask) => void): () => void {
    this.on('task:failed', callback)
    return () => this.off('task:failed', callback)
  }

  onTaskCancelled(callback: (task: ActiveTask) => void): () => void {
    this.on('task:cancelled', callback)
    return () => this.off('task:cancelled', callback)
  }

  private moveToHistory(taskId: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task) return

    this.activeTasks.delete(taskId)
    this.taskHistory.push(task)

    // Limit history size
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(-this.maxHistorySize)
    }
  }

  private emitEvent(type: TaskEvent['type'], task: ActiveTask): void {
    const event: TaskEvent = {
      type,
      task,
      timestamp: Date.now()
    }

    // Emit specific event
    this.emit(`task:${type}`, task)
    
    // Emit generic event
    this.emit('taskEvent', event)
  }
}

// Export singleton instance
export const taskMonitor = TaskMonitor.getInstance()