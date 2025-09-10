import { TaskMonitor } from '../src/services/TaskMonitor'

// Create a new instance
const monitor = TaskMonitor.getInstance()

// Test if methods exist
console.log('startTask exists:', typeof monitor.startTask)
console.log('completeTask exists:', typeof monitor.completeTask)
console.log('getTask exists:', typeof monitor.getTask)
console.log('getActiveTasks exists:', typeof monitor.getActiveTasks)

// Test basic functionality
const taskId = 'debug-task'
monitor.startTask(taskId, {
  description: 'Debug task',
  agentType: 'debug-agent'
})

const task = monitor.getTask(taskId)
console.log('Task after start:', task)

monitor.completeTask(taskId, 'Debug completed')

const taskAfterComplete = monitor.getTask(taskId)
console.log('Task after complete:', taskAfterComplete)

const activeTasks = monitor.getActiveTasks()
console.log('Active tasks:', activeTasks.length)