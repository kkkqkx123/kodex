import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../utils/theme'

export interface TaskError {
  id: string
  taskId: string
  message: string
  stack?: string
  timestamp: number
  retryCount: number
  maxRetries: number
  isRetryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface TaskErrorHandlerProps {
  errors: TaskError[]
  onRetry?: (errorId: string) => void
  onDismiss?: (errorId: string) => void
  onClearAll?: () => void
  maxVisible?: number
}

export function TaskErrorHandler({ 
  errors, 
  onRetry, 
  onDismiss, 
  onClearAll,
  maxVisible = 3 
}: TaskErrorHandlerProps) {
  const theme = getTheme()
  
  // Sort errors by severity and timestamp (newest first)
  const sortedErrors = [...errors]
    .sort((a, b) => {
      // First sort by severity
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      // Then sort by timestamp (newest first)
      return b.timestamp - a.timestamp
    })
    .slice(0, maxVisible)

  const getSeverityColor = (severity: TaskError['severity']) => {
    switch (severity) {
      case 'critical': return theme.error
      case 'high': return theme.error
      case 'medium': return theme.warning
      case 'low': return theme.secondary
      default: return theme.text
    }
  }

  const getSeverityIcon = (severity: TaskError['severity']) => {
    switch (severity) {
      case 'critical': return '⚠'
      case 'high': return '⚠'
      case 'medium': return '⚠'
      case 'low': return '•'
      default: return '•'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (sortedErrors.length === 0) {
    return null
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={theme.error} bold={true}>
        Task Errors:
      </Text>
      
      {sortedErrors.map(error => (
        <Box 
          key={error.id} 
          flexDirection="column" 
          borderStyle="round" 
          borderColor={getSeverityColor(error.severity)}
          padding={1}
          marginBottom={1}
        >
          {/* Header */}
          <Box flexDirection="row" justifyContent="space-between">
            <Box flexDirection="row">
              <Text color={getSeverityColor(error.severity)} bold={true}>
                {getSeverityIcon(error.severity)} {error.severity.toUpperCase()} ERROR
              </Text>
              <Text color={theme.secondaryText}>
                {' '}Task: {error.taskId}
              </Text>
            </Box>
            <Box flexDirection="row">
              <Text color={theme.secondaryText} dimColor={true}>
                {formatTime(error.timestamp)}
              </Text>
              {onDismiss && (
                <Text
                  color={theme.secondaryText}
                >
                  {' '}✕
                </Text>
              )}
            </Box>
          </Box>

          {/* Error message */}
          <Box flexDirection="row" marginTop={1}>
            <Text color={theme.text}>
              {error.message}
            </Text>
          </Box>

          {/* Retry information */}
          <Box flexDirection="row" marginTop={1}>
            <Text color={theme.secondaryText}>
              Retry: {error.retryCount}/{error.maxRetries}
            </Text>
            {error.isRetryable && onRetry && error.retryCount < error.maxRetries && (
              <Box flexDirection="row" marginLeft={2}>
                <Text
                  color={theme.success}
                  underline={true}
                >
                  [Retry]
                </Text>
              </Box>
            )}
          </Box>

          {/* Stack trace (if available and not too long) */}
          {error.stack && error.stack.length < 200 && (
            <Box flexDirection="column" marginTop={1}>
              <Text color={theme.secondaryText} dimColor={true}>
                Stack: {error.stack}
              </Text>
            </Box>
          )}
        </Box>
      ))}
      
      {/* Clear all button */}
      {errors.length > 1 && onClearAll && (
        <Box flexDirection="row" justifyContent="flex-end">
          <Text
            color={theme.secondaryText}
            underline={true}
          >
            [Clear All Errors]
          </Text>
        </Box>
      )}
    </Box>
  )
}

// Error manager hook
export function useTaskErrorHandler() {
  const [errors, setErrors] = useState<TaskError[]>([])

  const addError = useCallback((error: Omit<TaskError, 'id' | 'timestamp'>) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newError: TaskError = {
      ...error,
      id,
      timestamp: Date.now()
    }
    
    setErrors(prev => [...prev, newError])
    return id
  }, [])

  const retryError = useCallback((errorId: string) => {
    setErrors(prev => 
      prev.map(error => 
        error.id === errorId 
          ? { ...error, retryCount: error.retryCount + 1 }
          : error
      )
    )
    
    // In a real implementation, this would trigger a retry of the failed task
    console.log(`Retrying error: ${errorId}`)
  }, [])

  const dismissError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(e => e.id !== errorId))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Auto-dismiss low severity errors after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setErrors(prev => 
        prev.filter(error => 
          error.severity !== 'low' || now - error.timestamp < 300000
        )
      )
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return {
    errors,
    addError,
    retryError,
    dismissError,
    clearAllErrors
  }
}

// Retry utility function
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  onError?: (error: Error, retryCount: number) => void
): Promise<T> {
  let retryCount = 0
  
  while (retryCount <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      retryCount++
      
      if (onError) {
        onError(error as Error, retryCount)
      }
      
      if (retryCount > maxRetries) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected error in retry logic')
}