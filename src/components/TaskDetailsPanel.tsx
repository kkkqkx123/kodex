import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../utils/theme'

interface TaskDetails {
  id: string
  description: string
  agentType: string
  model?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending'
  progress: number
  startTime: number
  endTime?: number
  duration?: number
  message?: string
  apiInfo: {
    requestCount: number
    lastRequestTime?: number
    lastResponse?: string
    totalTokens?: number
  }
  todos?: {
    completed: number
    total: number
    items: string[]
  }
  error?: {
    message: string
    stack?: string
  }
}

interface TaskDetailsPanelProps {
  task?: TaskDetails
  isVisible: boolean
  onClose?: () => void
  width?: number
  height?: number
}

export function TaskDetailsPanel({ 
  task, 
  isVisible, 
  onClose, 
  width = 80,
  height = 20
}: TaskDetailsPanelProps) {
  const theme = getTheme()

  if (!isVisible || !task) {
    return null
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getStatusColor = (status: TaskDetails['status']) => {
    switch (status) {
      case 'running': return theme.taskStatus?.running || theme.primary
      case 'completed': return theme.taskStatus?.completed || theme.success
      case 'failed': return theme.taskStatus?.failed || theme.error
      case 'cancelled': return theme.taskStatus?.cancelled || theme.secondaryText
      case 'pending': return theme.taskStatus?.pending || theme.warning
      default: return theme.text
    }
  }

  const getStatusText = (status: TaskDetails['status']) => {
    switch (status) {
      case 'running': return 'Running'
      case 'completed': return 'Completed'
      case 'failed': return 'Failed'
      case 'cancelled': return 'Cancelled'
      case 'pending': return 'Pending'
      default: return 'Unknown'
    }
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.secondaryBorder} padding={1}>
      {/* Header */}
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Task Details</Text>
        <Text color={theme.secondaryText}>Press ESC to close</Text>
      </Box>

      {/* Basic Info */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Basic Information</Text>
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>ID:</Text>
          <Text>{task.id}</Text>
        </Box>
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>Description:</Text>
          <Text>{task.description}</Text>
        </Box>
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>Agent:</Text>
          <Text>{task.agentType}</Text>
        </Box>
        {task.model && (
          <Box flexDirection="row">
            <Text color={theme.secondaryText}>Model:</Text>
            <Text>{task.model}</Text>
          </Box>
        )}
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>Status:</Text>
          <Text color={getStatusColor(task.status)}>
            {getStatusText(task.status)}
          </Text>
        </Box>
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>Progress:</Text>
          <Text>{task.progress}%</Text>
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box flexDirection="row" marginBottom={1}>
        <Text color={getStatusColor(task.status)}>
          {'['}
          {(theme.progressChars?.filled || '█').repeat(Math.floor(task.progress / 10))}
          {(theme.progressChars?.empty || '░').repeat(10 - Math.floor(task.progress / 10))}
          {']'}
        </Text>
      </Box>

      {/* Timing Information */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Timing</Text>
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>Started:</Text>
          <Text>{formatTime(task.startTime)}</Text>
        </Box>
        {task.endTime && (
          <Box flexDirection="row">
            <Text color={theme.secondaryText}>Ended:</Text>
            <Text>{formatTime(task.endTime)}</Text>
          </Box>
        )}
        {task.duration !== undefined && (
          <Box flexDirection="row">
            <Text color={theme.secondaryText}>Duration:</Text>
            <Text>{formatDuration(task.duration)}</Text>
          </Box>
        )}
      </Box>

      {/* API Information */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>API Information</Text>
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>Requests:</Text>
          <Text>{task.apiInfo.requestCount}</Text>
        </Box>
        {task.apiInfo.totalTokens !== undefined && (
          <Box flexDirection="row">
            <Text color={theme.secondaryText}>Total Tokens:</Text>
            <Text>{task.apiInfo.totalTokens.toLocaleString()}</Text>
          </Box>
        )}
        {task.apiInfo.lastRequestTime && (
          <Box flexDirection="row">
            <Text color={theme.secondaryText}>Last Request:</Text>
            <Text>{formatTime(task.apiInfo.lastRequestTime)}</Text>
          </Box>
        )}
        {task.apiInfo.lastResponse && (
          <Box flexDirection="column">
            <Text color={theme.secondaryText}>Last Response:</Text>
            <Text>{task.apiInfo.lastResponse}</Text>
          </Box>
        )}
      </Box>

      {/* Todo Information */}
      {task.todos && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold={true} color={theme.primary}>Todos</Text>
          <Box flexDirection="row">
            <Text color={theme.secondaryText}>Progress:</Text>
            <Text>{task.todos.completed}/{task.todos.total}</Text>
          </Box>
          {task.todos.items.length > 0 && (
            <Box flexDirection="column" marginLeft={2}>
              {task.todos.items.map((item, index) => (
                <Box key={index} flexDirection="row">
                  <Text color={index < task.todos.completed ? theme.success : theme.secondaryText}>
                    {index < task.todos.completed ? '✓' : '○'} {item}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Error Information */}
      {task.error && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold={true} color={theme.error}>Error</Text>
          <Box flexDirection="column">
            <Text color={theme.error}>{task.error.message}</Text>
            {task.error.stack && (
              <Text color={theme.secondaryText} dimColor={true}>
                {task.error.stack}
              </Text>
            )}
          </Box>
        </Box>
      )}

      {/* Current Message */}
      {task.message && (
        <Box flexDirection="column">
          <Text bold={true} color={theme.primary}>Current Message</Text>
          <Text>{task.message}</Text>
        </Box>
      )}
    </Box>
  )
}