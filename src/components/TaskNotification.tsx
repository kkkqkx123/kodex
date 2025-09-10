import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../utils/theme'

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'action'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  timestamp: number
  duration?: number // Auto-dismiss duration in ms
  actions?: Array<{
    label: string
    action: () => void
  }>
}

interface TaskNotificationProps {
  notifications: Notification[]
  onDismiss?: (id: string) => void
  maxVisible?: number
  position?: 'top' | 'bottom'
}

export function TaskNotification({ 
  notifications, 
  onDismiss, 
  maxVisible = 3,
  position = 'top'
}: TaskNotificationProps) {
  const theme = getTheme()
  
  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxVisible)

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'info': return theme.primary
      case 'success': return theme.success
      case 'warning': return theme.warning
      case 'error': return theme.error
      case 'action': return theme.secondary
      default: return theme.text
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info': return 'ℹ'
      case 'success': return '✓'
      case 'warning': return '⚠'
      case 'error': return '✗'
      case 'action': return '→'
      default: return '•'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (sortedNotifications.length === 0) {
    return null
  }

  return (
    <Box flexDirection="column" marginBottom={position === 'top' ? 1 : 0}>
      {sortedNotifications.map(notification => (
        <Box 
          key={notification.id} 
          flexDirection="column" 
          borderStyle="round" 
          borderColor={getNotificationColor(notification.type)}
          padding={1}
          marginBottom={1}
        >
          {/* Header */}
          <Box flexDirection="row" justifyContent="space-between">
            <Box flexDirection="row">
              <Text color={getNotificationColor(notification.type)} bold={true}>
                {getNotificationIcon(notification.type)} {notification.title}
              </Text>
            </Box>
            <Box flexDirection="row">
              <Text color={theme.secondaryText} dimColor={true}>
                {formatTime(notification.timestamp)}
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

          {/* Message */}
          {notification.message && (
            <Box flexDirection="row" marginTop={1}>
              <Text color={theme.text}>
                {notification.message}
              </Text>
            </Box>
          )}

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <Box flexDirection="row" marginTop={1}>
              {notification.actions.map((action, index) => (
                <Box
                  key={index}
                  flexDirection="row"
                  marginRight={index < notification.actions.length - 1 ? 2 : 0}
                >
                  <Text color={getNotificationColor(notification.type)} underline={true}>
                    [{action.label}]
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}

// Notification manager hook
export function useNotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now()
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-dismiss if duration is specified
    if (notification.duration) {
      setTimeout(() => {
        dismissNotification(id)
      }, notification.duration)
    }
    
    return id
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Auto-dismiss old notifications (older than 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setNotifications(prev => 
        prev.filter(n => now - n.timestamp < 30000 || n.duration === undefined)
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications
  }
}