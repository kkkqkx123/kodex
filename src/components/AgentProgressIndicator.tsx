import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../utils/theme'

interface ActiveTask {
  id: string
  description: string
  agentType: string
  progress: number
  message?: string
  startTime: number
}

interface TaskInfo {
  description: string
  agentType: string
  progress: number
  message?: string
  startTime: number
}

export function AgentProgressIndicator() {
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([])
  const theme = getTheme()

  useEffect(() => {
    // Function to fetch active tasks from TaskTool
    const fetchActiveTasks = () => {
      try {
        // Import the getter function from TaskTool
        const { getActiveTasks } = require('../tools/TaskTool/TaskTool.tsx')
        const activeTasksMap = getActiveTasks() as Map<string, TaskInfo>
        
        const tasks: ActiveTask[] = Array.from(activeTasksMap.entries()).map(([id, task]) => ({
          id,
          description: task.description,
          agentType: task.agentType,
          progress: task.progress,
          message: task.message,
          startTime: task.startTime
        }))
        
        setActiveTasks(tasks)
      } catch (error) {
        // Silently handle errors - this is a non-critical component
        console.debug('Error fetching active tasks:', error)
      }
    }

    // Poll for task updates every second
    const interval = setInterval(fetchActiveTasks, 1000)
    
    // Initial fetch
    fetchActiveTasks()

    return () => clearInterval(interval)
  }, [])

  if (activeTasks.length === 0) {
    return null
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={theme.secondaryText} bold={true}>
        Active Tasks:
      </Text>
      {activeTasks.map(task => (
        <Box key={task.id} flexDirection="column" marginLeft={2}>
          <Box flexDirection="row">
            <Text color={theme.primary}>
              [{task.agentType}] {task.description}
            </Text>
            <Text color={theme.secondaryText}>
              {' '}{task.progress}%
            </Text>
          </Box>
          {task.message && (
            <Box flexDirection="row">
              <Text color={theme.secondaryText}>
                {'  '}└ {task.message}
              </Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}