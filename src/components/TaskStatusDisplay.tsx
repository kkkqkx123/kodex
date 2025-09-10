import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../utils/theme'
import { taskEventBus } from '../utils/taskEventBus'
import { TaskDetailsPanel } from './TaskDetailsPanel'
import { TaskControlPanel, TaskAction } from './TaskControlPanel'
import { TaskNotification, useNotificationManager } from './TaskNotification'
import { TaskErrorHandler, useTaskErrorHandler } from './TaskErrorHandler'
import { useTUICompatibility, TUICompatibilityWarning } from './TUICompatibility'

interface TaskInfo {
  id: string
  description: string
  agentType: string
  progress: number
  message?: string
  startTime: number
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending'
  apiRequestCount?: number
  lastApiResponse?: string
  todos?: {
    completed: number
    total: number
    items: string[]
  }
}

interface TaskStatusDisplayProps {
  maxVisibleTasks?: number
  showApiInfo?: boolean
  showTodos?: boolean
  refreshInterval?: number
  compact?: boolean
  layout?: 'vertical' | 'horizontal' | 'compact'
}

export function TaskStatusDisplay({
  maxVisibleTasks = 5,
  showApiInfo = true,
  showTodos = true,
  refreshInterval = 1000,
  compact = false,
  layout = 'vertical'
}: TaskStatusDisplayProps) {
  // Use props directly since we're in a TUI environment
  const effectiveMaxVisibleTasks = maxVisibleTasks
  const effectiveShowApiInfo = showApiInfo
  const effectiveShowTodos = showTodos
  const effectiveRefreshInterval = refreshInterval
  const effectiveCompact = compact
  const effectiveLayout = layout
  
  // TUI compatibility
  const { capabilities, chars, layout: responsiveLayout, truncateText, shouldShow } = useTUICompatibility()
  
  const [activeTasks, setActiveTasks] = useState<TaskInfo[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const theme = getTheme()
  
  // 如果没有活跃任务，不显示任何内容，避免UI堆叠
  if (activeTasks.length === 0) {
    return null
  }

  // 简化的任务状态显示
  if (effectiveCompact) {
    return (
      <Box marginTop={1}>
        <Text dimColor>
          {activeTasks.map(task => 
            `${task.agentType}: ${task.progress}%`
          ).join(' | ')}
        </Text>
      </Box>
    )
  }

  // Notification manager
  const { notifications, addNotification, dismissNotification } = useNotificationManager()
  
  // Error handler
  const { errors, addError, retryError, dismissError, clearAllErrors } = useTaskErrorHandler()

  // Function to fetch active tasks from TaskTool
  const fetchActiveTasks = useCallback(() => {
    try {
      // Import the getter function from TaskTool
      const { getActiveTasks } = require('../tools/TaskTool/TaskTool.tsx')
      const activeTasksMap = getActiveTasks() as Map<string, any>
      
      const tasks: TaskInfo[] = Array.from(activeTasksMap.entries()).map(([id, task]) => {
        // Determine task status based on progress
        let status: TaskInfo['status'] = 'running'
        if (task.progress === 100) {
          status = 'completed'
        } else if (task.progress === 0) {
          status = 'pending'
        }
        
        return {
          id,
          description: task.description,
          agentType: task.agentType,
          progress: task.progress,
          message: task.message,
          startTime: task.startTime,
          status,
          // Mock API request count - in real implementation this would come from the task
          apiRequestCount: Math.floor(Math.random() * 10) + 1,
          // Mock API response - in real implementation this would come from the task
          lastApiResponse: task.message || 'Processing request...',
          // Mock todos - in real implementation this would come from the task
          todos: {
            completed: Math.floor(task.progress / 20),
            total: 5,
            items: ['Analyze requirements', 'Design solution', 'Implement code', 'Test functionality', 'Document results']
          }
        }
      })
      
      setActiveTasks(tasks)
    } catch (error) {
      // Silently handle errors - this is a non-critical component
      console.debug('Error fetching active tasks:', error)
      
      // Add error to error handler
      addError({
        taskId: 'system',
        message: `Failed to fetch active tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        retryCount: 0,
        maxRetries: 3, // Default value
        isRetryable: true,
        severity: 'medium'
      })
    }
  }, [addError])

  // Handle task events
  const handleTaskEvent = useCallback((event: any) => {
    // Update task based on event
    setActiveTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(task => task.id === event.taskId)
      
      if (taskIndex === -1) {
        // Task not found, fetch all tasks to ensure we have the latest state
        fetchActiveTasks()
        return prevTasks
      }
      
      const updatedTasks = [...prevTasks]
      const task = updatedTasks[taskIndex]
      
      switch (event.type) {
        case 'task_progress':
          if (event.data?.progress !== undefined) {
            task.progress = event.data.progress
          }
          if (event.data?.message !== undefined) {
            task.message = event.data.message
          }
          if (event.data?.toolUseCount !== undefined) {
            task.apiRequestCount = event.data.toolUseCount
          }
          if (event.data?.preview !== undefined) {
            task.lastApiResponse = event.data.preview
          }
          break
          
        case 'task_completed':
          task.progress = 100
          task.status = 'completed'
          task.message = event.data?.message || 'Task completed'
          
          // Show completion notification
          addNotification({
            type: 'success',
            title: 'Task Completed',
            message: `Task "${task.description}" has completed successfully`,
            duration: 5000 // Default value
          })
          break
          
        case 'task_failed':
          task.status = 'failed'
          task.message = event.data?.error || 'Task failed'
          
          // Show failure notification
          addNotification({
            type: 'error',
            title: 'Task Failed',
            message: `Task "${task.description}" has failed: ${event.data?.error || 'Unknown error'}`,
            duration: 8000 // Longer duration for errors (5000 * 1.6)
          })
          
          // Add error to error handler
          addError({
            taskId: task.id,
            message: event.data?.error || 'Task failed',
            stack: event.data?.stack,
            retryCount: 0,
            maxRetries: 3, // Default value
            isRetryable: true, // Default value
            severity: 'high'
          })
          break
          
        case 'task_cancelled':
          task.status = 'cancelled'
          task.message = 'Task cancelled'
          
          // Show cancellation notification
          addNotification({
            type: 'warning',
            title: 'Task Cancelled',
            message: `Task "${task.description}" was cancelled`,
            duration: 5000 // Default value
          })
          break
      }
      
      return updatedTasks
    })
  }, [fetchActiveTasks, addNotification, addError])

  useEffect(() => {
    // Initial fetch
    fetchActiveTasks()
    
    // Subscribe to task events
    const unsubscribeProgress = taskEventBus.on('task_progress', handleTaskEvent)
    const unsubscribeCompleted = taskEventBus.on('task_completed', handleTaskEvent)
    const unsubscribeFailed = taskEventBus.on('task_failed', handleTaskEvent)
    const unsubscribeCancelled = taskEventBus.on('task_cancelled', handleTaskEvent)
    
    // Also subscribe to task started events to ensure we capture new tasks
    const unsubscribeStarted = taskEventBus.on('task_started', () => {
      fetchActiveTasks()
    })
    
    // Set up a fallback poll in case events are missed
    const interval = setInterval(fetchActiveTasks, effectiveRefreshInterval * 5) // Poll less frequently
    
    return () => {
      unsubscribeProgress()
      unsubscribeCompleted()
      unsubscribeFailed()
      unsubscribeCancelled()
      unsubscribeStarted()
      clearInterval(interval)
    }
  }, [fetchActiveTasks, handleTaskEvent, effectiveRefreshInterval])

  if (activeTasks.length === 0) {
    return null
  }

  // Sort tasks by priority: running > pending > completed > failed > cancelled
  const sortedTasks = [...activeTasks].sort((a, b) => {
    const statusPriority = {
      'running': 0,
      'pending': 1,
      'completed': 2,
      'failed': 3,
      'cancelled': 4
    }
    return statusPriority[a.status] - statusPriority[b.status]
  })

  // Limit visible tasks based on responsive layout
  const visibleTasks = sortedTasks.slice(0, Math.min(effectiveMaxVisibleTasks, responsiveLayout.maxVisibleTasks))

  const getStatusColor = (status: TaskInfo['status']) => {
    switch (status) {
      case 'running': return theme.taskStatus?.running || theme.primary
      case 'completed': return theme.taskStatus?.completed || theme.success
      case 'failed': return theme.taskStatus?.failed || theme.error
      case 'cancelled': return theme.taskStatus?.cancelled || theme.secondaryText
      case 'pending': return theme.taskStatus?.pending || theme.warning
      default: return theme.text
    }
  }

  const getStatusIcon = (status: TaskInfo['status']) => {
    switch (status) {
      case 'running': return chars.running
      case 'completed': return chars.completed
      case 'failed': return chars.failed
      case 'cancelled': return chars.cancelled
      case 'pending': return chars.pending
      default: return '?'
    }
  }

  // Handle task selection
  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setShowDetails(true)
    setShowControls(false) // Close controls if open
  }, [])

  // Handle closing details panel
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false)
    setSelectedTaskId(null)
  }, [])

  // Handle showing controls
  const handleShowControls = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setShowControls(true)
    setShowDetails(false) // Close details if open
  }, [])

  // Handle closing controls panel
  const handleCloseControls = useCallback(() => {
    setShowControls(false)
    setSelectedTaskId(null)
  }, [])

  // Handle task action
  const handleTaskAction = useCallback((taskId: string, action: TaskAction) => {
    // For now, just log the action and close the panel
    console.log(`Task ${taskId}: ${action} action requested`)
    
    // Show notification based on action type
    const selectedTask = activeTasks.find(task => task.id === taskId)
    const taskDescription = selectedTask ? selectedTask.description : taskId
    
    switch (action) {
      case 'cancel':
        addNotification({
          type: 'warning',
          title: 'Task Cancellation',
          message: `Cancelling task: ${taskDescription}`,
          duration: 5000 // Default value
        })
        break
        
      case 'pause':
        addNotification({
          type: 'info',
          title: 'Task Paused',
          message: `Task paused: ${taskDescription}`,
          duration: 3000 // Shorter duration for info (5000 * 0.6)
        })
        break
        
      case 'resume':
        addNotification({
          type: 'info',
          title: 'Task Resumed',
          message: `Task resumed: ${taskDescription}`,
          duration: 3000
        })
        break
        
      case 'restart':
        addNotification({
          type: 'info',
          title: 'Task Restarted',
          message: `Task restarted: ${taskDescription}`,
          duration: 3000
        })
        break
        
      case 'view_logs':
        addNotification({
          type: 'info',
          title: 'Task Logs',
          message: `Opening logs for task: ${taskDescription}`,
          duration: 3000
        })
        break
        
      case 'copy_details':
        addNotification({
          type: 'success',
          title: 'Details Copied',
          message: `Task details copied to clipboard`,
          duration: 3000
        })
        break
    }
    
    // In a real implementation, this would:
    // 1. Send the action to the TaskTool or task manager
    // 2. Show a confirmation dialog for destructive actions
    // 3. Update the UI based on the action result
    
    handleCloseControls()
  }, [activeTasks, addNotification, handleCloseControls])

  // Memoized task rendering for better performance
  const renderTask = useMemo(() => (task: TaskInfo) => {
    const isSelected = task.id === selectedTaskId
    
    if (effectiveCompact || responsiveLayout.compactMode) {
      return (
        <Box 
          key={task.id} 
          flexDirection="row" 
          marginLeft={2} 
          marginBottom={1}
        >
          <Box flexDirection="row">
            <Text color={getStatusColor(task.status)}>
              {getStatusIcon(task.status)} [{task.agentType}] {truncateText(task.description)} {task.progress}%
            </Text>
            {isSelected && <Text color={theme.primary}> ←</Text>}
          </Box>
          {shouldShow('controls') && (
            <Box flexDirection="row" marginLeft={1}>
              <Text color={theme.secondaryText}>[Controls]</Text>
            </Box>
          )}
        </Box>
      )
    }

    return (
      <Box 
        key={task.id} 
        flexDirection="column" 
        marginLeft={2} 
        marginBottom={1}
      >
        {/* Task header with status */}
        <Box flexDirection="row">
          <Box flexDirection="row">
            <Text color={getStatusColor(task.status)}>
              {getStatusIcon(task.status)} [{task.agentType}] {truncateText(task.description)}
            </Text>
            <Text color={theme.secondaryText}>
              {' '}{task.progress}%
            </Text>
            {isSelected && <Text color={theme.primary}> ←</Text>}
          </Box>
          {shouldShow('controls') && (
            <Box flexDirection="row" marginLeft={1}>
              <Text color={theme.secondaryText}>[Controls]</Text>
            </Box>
          )}
        </Box>

        {/* Progress bar */}
        <Box flexDirection="row" marginLeft={2}>
          <Text color={getStatusColor(task.status)}>
            {'['}
            {(theme.progressChars?.filled || chars.progressFilled).repeat(Math.floor(task.progress / 10))}
            {(theme.progressChars?.empty || chars.progressEmpty).repeat(10 - Math.floor(task.progress / 10))}
            {']'}
          </Text>
        </Box>

        {/* Task message */}
        {task.message && (
          <Box flexDirection="row" marginLeft={2}>
            <Text color={theme.secondaryText}>
              └ {truncateText(task.message)}
            </Text>
          </Box>
        )}

        {/* API information */}
        {effectiveShowApiInfo && (task.apiRequestCount || task.lastApiResponse) && (
          <Box flexDirection="column" marginLeft={2}>
            {task.apiRequestCount && (
              <Box flexDirection="row">
                <Text color={theme.secondaryText}>
                  API Requests: {task.apiRequestCount}
                </Text>
              </Box>
            )}
            {task.lastApiResponse && (
              <Box flexDirection="row">
                <Text color={theme.secondaryText}>
                  Last Response: {truncateText(task.lastApiResponse)}
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* Todo information */}
        {effectiveShowTodos && task.todos && (
          <Box flexDirection="column" marginLeft={2}>
            <Box flexDirection="row">
              <Text color={theme.secondaryText}>
                Todos: {task.todos.completed}/{task.todos.total}
              </Text>
            </Box>
            {/* Show todo items if space permits */}
            {task.todos.items.length > 0 && (
              <Box flexDirection="column" marginLeft={2}>
                {task.todos.items.slice(0, 3).map((item, index) => (
                  <Box key={index} flexDirection="row">
                    <Text color={index < task.todos.completed ? theme.success : theme.secondaryText}>
                      {index < task.todos.completed ? '✓' : '○'} {truncateText(item)}
                    </Text>
                  </Box>
                ))}
                {task.todos.items.length > 3 && (
                  <Box flexDirection="row">
                    <Text color={theme.secondaryText}>
                      ... and {task.todos.items.length - 3} more
                    </Text>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
  }, [effectiveCompact, effectiveShowApiInfo, effectiveShowTodos, theme, selectedTaskId, handleTaskSelect, handleShowControls, chars, truncateText, shouldShow, responsiveLayout.compactMode])

  // Get selected task for details panel
  const selectedTask = selectedTaskId ? activeTasks.find(task => task.id === selectedTaskId) : null

  // Convert TaskInfo to TaskDetails for the panel
  const taskDetails = selectedTask ? {
    ...selectedTask,
    model: 'task', // This would come from the actual task
    endTime: selectedTask.status === 'completed' ? Date.now() : undefined,
    duration: selectedTask.status === 'completed' ? Date.now() - selectedTask.startTime : undefined,
    apiInfo: {
      requestCount: selectedTask.apiRequestCount || 0,
      lastRequestTime: Date.now(),
      lastResponse: selectedTask.lastApiResponse,
      totalTokens: Math.floor(Math.random() * 10000) + 1000 // Mock token count
    }
  } : undefined

  // Convert TaskInfo to TaskControl for the control panel
  const taskControl = selectedTask ? {
    id: selectedTask.id,
    status: selectedTask.status,
    description: selectedTask.description,
    agentType: selectedTask.agentType
  } : undefined

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Notifications */}
      <TaskNotification
        notifications={notifications}
        onDismiss={dismissNotification}
        position={'top'} // Default value
        maxVisible={3} // Default value
      />
      
      {/* Error Handler */}
      <TaskErrorHandler
        errors={errors}
        onRetry={retryError}
        onDismiss={dismissError}
        onClearAll={clearAllErrors}
        maxVisible={3} // Default value
      />
      
      {/* TUI Compatibility Warning */}
      <TUICompatibilityWarning capabilities={capabilities} />
      
      <Text color={theme.secondaryText} bold={true}>
        Active Tasks:
      </Text>
      {visibleTasks.map(renderTask)}
      {activeTasks.length > effectiveMaxVisibleTasks && (
        <Box flexDirection="row" marginLeft={2}>
          <Text color={theme.secondaryText}>
            ... and {activeTasks.length - effectiveMaxVisibleTasks} more tasks
          </Text>
        </Box>
      )}
      
      
      {/* Task Details Panel - only show if supported by layout */}
      {shouldShow('details') && (
        <TaskDetailsPanel 
          task={taskDetails}
          isVisible={showDetails}
          onClose={handleCloseDetails}
        />
      )}
      
      {/* Task Control Panel - only show if supported by layout */}
      {shouldShow('controls') && (
        <TaskControlPanel 
          task={taskControl}
          isVisible={showControls}
          onAction={handleTaskAction}
          onClose={handleCloseControls}
        />
      )}
      
    </Box>
  )
}