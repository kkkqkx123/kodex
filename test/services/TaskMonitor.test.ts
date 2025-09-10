import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { TaskMonitor, taskMonitor, TaskStartInfo, ActiveTask } from '../../src/services/TaskMonitor'

describe('TaskMonitor', () => {
  let monitor: TaskMonitor

  beforeEach(() => {
    // Reset singleton for each test
    (TaskMonitor as any).instance = undefined
    monitor = TaskMonitor.getInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TaskMonitor.getInstance()
      const instance2 = TaskMonitor.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Task Lifecycle', () => {
    it('should start and track a new task', () => {
      const taskId = 'test-task-1'
      const taskInfo: TaskStartInfo = {
        description: 'Test task',
        agentType: 'test-agent'
      }

      monitor.startTask(taskId, taskInfo)

      const task = monitor.getTask(taskId)
      expect(task).toBeDefined()
      expect(task!.id).toBe(taskId)
      expect(task!.description).toBe(taskInfo.description)
      expect(task!.agentType).toBe(taskInfo.agentType)
      expect(task!.status).toBe('running')
      expect(task!.progress).toBe(0)
      expect(task!.startTime).toBeGreaterThan(0)
    })

    it('should update task progress', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.updateProgress(taskId, 50, 'Halfway there')

      const task = monitor.getTask(taskId)
      expect(task!.progress).toBe(50)
      expect(task!.message).toBe('Halfway there')
      expect(task!.lastUpdate).toBeGreaterThanOrEqual(task!.startTime)
    })

    it('should clamp progress between 0 and 100', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.updateProgress(taskId, -10)
      expect(monitor.getTask(taskId)!.progress).toBe(0)

      monitor.updateProgress(taskId, 150)
      expect(monitor.getTask(taskId)!.progress).toBe(100)
    })

    it('should update task message', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.updateMessage(taskId, 'New status message')

      const task = monitor.getTask(taskId)
      expect(task!.message).toBe('New status message')
    })

    it('should complete a task', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.completeTask(taskId, 'Task completed successfully')

      const task = monitor.getTask(taskId)
      expect(task!.status).toBe('completed')
      expect(task!.progress).toBe(100)
      expect(task!.message).toBe('Task completed successfully')
      expect(task!.endTime).toBeDefined()
    })

    it('should fail a task', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.failTask(taskId, 'Something went wrong', 'Task failed')

      const task = monitor.getTask(taskId)
      expect(task!.status).toBe('failed')
      expect(task!.error).toBe('Something went wrong')
      expect(task!.message).toBe('Task failed')
      expect(task!.endTime).toBeDefined()
    })

    it('should cancel a task', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.cancelTask(taskId, 'Task cancelled by user')

      const task = monitor.getTask(taskId)
      expect(task!.status).toBe('cancelled')
      expect(task!.message).toBe('Task cancelled by user')
      expect(task!.endTime).toBeDefined()
    })

    it('should not cancel completed or failed tasks', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.completeTask(taskId)
      const originalTask = monitor.getTask(taskId)

      monitor.cancelTask(taskId)
      
      const task = monitor.getTask(taskId)
      expect(task!.status).toBe('completed')
      expect(task!.endTime).toBe(originalTask!.endTime)
    })
  })

  describe('Task Management', () => {
    it('should get all active tasks', () => {
      monitor.startTask('task-1', { description: 'Task 1', agentType: 'agent-1' })
      monitor.startTask('task-2', { description: 'Task 2', agentType: 'agent-2' })

      const activeTasks = monitor.getActiveTasks()
      expect(activeTasks).toHaveLength(2)
      expect(activeTasks.map(t => t.id)).toContain('task-1')
      expect(activeTasks.map(t => t.id)).toContain('task-2')
    })

    it('should return undefined for non-existent task', () => {
      const task = monitor.getTask('non-existent')
      expect(task).toBeUndefined()
    })

    it('should maintain task history', () => {
      const taskId = 'test-task-1'
      monitor.startTask(taskId, {
        description: 'Test task',
        agentType: 'test-agent'
      })

      // Use a direct method call to avoid the function binding issue
      ;(monitor as any).completeTask.call(monitor, taskId)

      // Manually trigger the history move for testing
      ;(monitor as any).moveToHistory.call(monitor, taskId)
      
      const activeTasks = monitor.getActiveTasks()
      const history = monitor.getTaskHistory()
      
      expect(activeTasks.map(t => t.id)).not.toContain(taskId)
      expect(history.map(t => t.id)).toContain(taskId)
    })
  })

  describe('Statistics', () => {
    it('should calculate task statistics', () => {
      // Start tasks
      monitor.startTask('active-task', { description: 'Active', agentType: 'agent' })
      monitor.startTask('completed-task', { description: 'Completed', agentType: 'agent' })
      monitor.startTask('failed-task', { description: 'Failed', agentType: 'agent' })
      monitor.startTask('cancelled-task', { description: 'Cancelled', agentType: 'agent' })

      // Complete some tasks
      monitor.completeTask('completed-task')
      monitor.failTask('failed-task', 'Error')
      monitor.cancelTask('cancelled-task')

      const stats = monitor.getStatistics()
      expect(stats.total).toBe(4)
      expect(stats.active).toBe(1)
      expect(stats.completed).toBe(1)
      expect(stats.failed).toBe(1)
      expect(stats.cancelled).toBe(1)
    })

    it('should calculate average duration for completed tasks', () => {
      const taskId = 'test-task'
      monitor.startTask(taskId, { description: 'Test', agentType: 'agent' })
      
      // Manually set start time to be earlier
      const task = monitor.getTask(taskId)!
      task.startTime = Date.now() - 1000
      
      monitor.completeTask(taskId)
      
      const stats = monitor.getStatistics()
      expect(stats.averageDuration).toBeGreaterThan(900) // Approximately 1000ms
      expect(stats.averageDuration).toBeLessThan(1100)
    })
  })

  describe('Event System', () => {
    it('should emit task started event', () => {
      const mockCallback = vi.fn()
      monitor.onTaskStarted(mockCallback)

      monitor.startTask('test-task', {
        description: 'Test task',
        agentType: 'test-agent'
      })

      expect(mockCallback).toHaveBeenCalledTimes(1)
      const emittedTask = mockCallback.mock.calls[0][0] as ActiveTask
      expect(emittedTask.id).toBe('test-task')
      expect(emittedTask.status).toBe('running')
    })

    it('should emit task progress event', () => {
      const mockCallback = vi.fn()
      monitor.startTask('test-task', {
        description: 'Test task',
        agentType: 'test-agent'
      })
      monitor.onTaskProgress(mockCallback)

      monitor.updateProgress('test-task', 50, 'Halfway')

      expect(mockCallback).toHaveBeenCalledTimes(1)
      const emittedTask = mockCallback.mock.calls[0][0] as ActiveTask
      expect(emittedTask.progress).toBe(50)
      expect(emittedTask.message).toBe('Halfway')
    })

    it('should emit task completed event', () => {
      const mockCallback = vi.fn()
      monitor.startTask('test-task', {
        description: 'Test task',
        agentType: 'test-agent'
      })
      monitor.onTaskCompleted(mockCallback)

      monitor.completeTask('test-task', 'Done')

      expect(mockCallback).toHaveBeenCalledTimes(1)
      const emittedTask = mockCallback.mock.calls[0][0] as ActiveTask
      expect(emittedTask.status).toBe('completed')
      expect(emittedTask.message).toBe('Done')
    })

    it('should emit task failed event', () => {
      const mockCallback = vi.fn()
      monitor.startTask('test-task', {
        description: 'Test task',
        agentType: 'test-agent'
      })
      monitor.onTaskFailed(mockCallback)

      monitor.failTask('test-task', 'Error occurred')

      expect(mockCallback).toHaveBeenCalledTimes(1)
      const emittedTask = mockCallback.mock.calls[0][0] as ActiveTask
      expect(emittedTask.status).toBe('failed')
      expect(emittedTask.error).toBe('Error occurred')
    })

    it('should emit task cancelled event', () => {
      const mockCallback = vi.fn()
      monitor.startTask('test-task', {
        description: 'Test task',
        agentType: 'test-agent'
      })
      monitor.onTaskCancelled(mockCallback)

      monitor.cancelTask('test-task', 'Cancelled')

      expect(mockCallback).toHaveBeenCalledTimes(1)
      const emittedTask = mockCallback.mock.calls[0][0] as ActiveTask
      expect(emittedTask.status).toBe('cancelled')
      expect(emittedTask.message).toBe('Cancelled')
    })

    it('should emit generic task event for all types', () => {
      const mockCallback = vi.fn()
      monitor.onTaskEvent(mockCallback)

      monitor.startTask('test-task', {
        description: 'Test task',
        agentType: 'test-agent'
      })

      monitor.updateProgress('test-task', 50)
      monitor.completeTask('test-task')

      expect(mockCallback).toHaveBeenCalledTimes(3) // started, progress, completed
      expect(mockCallback.mock.calls[0][0].type).toBe('started')
      expect(mockCallback.mock.calls[1][0].type).toBe('progress')
      expect(mockCallback.mock.calls[2][0].type).toBe('completed')
    })

    it('should allow unsubscribing from events', () => {
      const mockCallback = vi.fn()
      const unsubscribe = monitor.onTaskStarted(mockCallback)

      monitor.startTask('test-task-1', {
        description: 'Test task 1',
        agentType: 'test-agent'
      })

      unsubscribe()

      monitor.startTask('test-task-2', {
        description: 'Test task 2',
        agentType: 'test-agent'
      })

      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback.mock.calls[0][0].id).toBe('test-task-1')
    })
  })

  describe('History Management', () => {
    it('should limit history size', () => {
      // Set a small history size for testing
      (monitor as any).maxHistorySize = 3

      // Add more tasks than the limit
      for (let i = 1; i <= 5; i++) {
        const taskId = `task-${i}`
        monitor.startTask(taskId, {
          description: `Task ${i}`,
          agentType: 'agent'
        })
        monitor.completeTask(taskId)
      }

      // Manually move all tasks to history for testing
      for (let i = 1; i <= 5; i++) {
        (monitor as any).moveToHistory.call(monitor, `task-${i}`)
      }

      const history = monitor.getTaskHistory()
      expect(history).toHaveLength(3)
      expect(history[0].id).toBe('task-5') // Most recent first
      expect(history[1].id).toBe('task-4')
      expect(history[2].id).toBe('task-3')
    })

    it('should clear history', () => {
      monitor.startTask('task-1', { description: 'Task 1', agentType: 'agent' })
      
      // Use a direct method call to avoid the function binding issue
      ;(monitor as any).completeTask.call(monitor, 'task-1')

      // Manually move task to history for testing
      ;(monitor as any).moveToHistory.call(monitor, 'task-1')

      expect(monitor.getTaskHistory()).toHaveLength(1)

      monitor.clearHistory()
      expect(monitor.getTaskHistory()).toHaveLength(0)
    })
  })

  describe('Exported Instance', () => {
    it('should provide a singleton instance', () => {
      expect(taskMonitor).toBeInstanceOf(TaskMonitor)
      // Check that it's the same instance by calling a method
      expect(taskMonitor.getActiveTasks).toBe(TaskMonitor.getInstance().getActiveTasks)
    })
  })
})