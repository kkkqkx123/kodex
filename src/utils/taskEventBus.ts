// Task Event Bus for efficient event-driven communication
type TaskEventType = 'task_started' | 'task_progress' | 'task_completed' | 'task_failed' | 'task_cancelled'

interface TaskEvent {
  type: TaskEventType
  taskId: string
  timestamp: number
  data?: any
}

type TaskEventListener = (event: TaskEvent) => void

class TaskEventBus {
  private listeners: Map<TaskEventType, TaskEventListener[]> = new Map()
  private allListeners: TaskEventListener[] = []

  // Subscribe to specific event type
  on(eventType: TaskEventType, listener: TaskEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    
    const eventListeners = this.listeners.get(eventType)!
    eventListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = eventListeners.indexOf(listener)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  // Subscribe to all events
  onAny(listener: TaskEventListener): () => void {
    this.allListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.allListeners.indexOf(listener)
      if (index > -1) {
        this.allListeners.splice(index, 1)
      }
    }
  }

  // Emit event to all subscribers
  emit(event: TaskEvent): void {
    // Notify specific event listeners
    const specificListeners = this.listeners.get(event.type)
    if (specificListeners) {
      specificListeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in task event listener:', error)
        }
      })
    }
    
    // Notify all-event listeners
    this.allListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in task event listener:', error)
      }
    })
  }

  // Remove all listeners (useful for cleanup)
  removeAllListeners(): void {
    this.listeners.clear()
    this.allListeners.length = 0
  }

  // Get listener count for debugging
  getListenerCount(): number {
    let count = this.allListeners.length
    for (const listeners of this.listeners.values()) {
      count += listeners.length
    }
    return count
  }
}

// Singleton instance
export const taskEventBus = new TaskEventBus()

// Utility functions for common event patterns
export const emitTaskStarted = (taskId: string, data?: any): void => {
  taskEventBus.emit({
    type: 'task_started',
    taskId,
    timestamp: Date.now(),
    data
  })
}

export const emitTaskProgress = (taskId: string, progress: number, data?: any): void => {
  taskEventBus.emit({
    type: 'task_progress',
    taskId,
    timestamp: Date.now(),
    data: { progress, ...data }
  })
}

export const emitTaskCompleted = (taskId: string, data?: any): void => {
  taskEventBus.emit({
    type: 'task_completed',
    taskId,
    timestamp: Date.now(),
    data
  })
}

export const emitTaskFailed = (taskId: string, error?: any, data?: any): void => {
  taskEventBus.emit({
    type: 'task_failed',
    taskId,
    timestamp: Date.now(),
    data: { error, ...data }
  })
}

export const emitTaskCancelled = (taskId: string, data?: any): void => {
  taskEventBus.emit({
    type: 'task_cancelled',
    taskId,
    timestamp: Date.now(),
    data
  })
}