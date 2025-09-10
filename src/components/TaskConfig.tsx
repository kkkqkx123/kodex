import React, { useState, useEffect, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import { getTheme } from '../utils/theme'

export interface TaskDisplayConfig {
  // Display options
  maxVisibleTasks: number
  showApiInfo: boolean
  showTodos: boolean
  refreshInterval: number
  compact: boolean
  layout: 'vertical' | 'horizontal' | 'compact'

  // Theme options
  theme: {
    bashBorder: string
    claude: string
    koding: string
    permission: string
    secondaryBorder: string
    text: string
    secondaryText: string
    suggestion: string
    // Semantic colors
    success: string
    error: string
    warning: string
    // UI colors
    primary: string
    secondary: string
    diff: {
      added: string
      removed: string
      addedDimmed: string
      removedDimmed: string
    }
    // Task status colors
    taskStatus: {
      running: string
      completed: string
      failed: string
      cancelled: string
      pending: string
    }
    // Progress bar characters
    progressChars: {
      filled: string
      empty: string
    }
  }

  // Notification options
  notifications: {
    maxVisible: number
    position: 'top' | 'bottom'
    autoDismiss: boolean
    defaultDuration: number
  }

  // Error handling options
  errorHandling: {
    maxVisible: number
    autoRetry: boolean
    maxRetries: number
    retryDelay: number
  }
}

// Default configuration
export const defaultConfig: TaskDisplayConfig = {
  maxVisibleTasks: 5,
  showApiInfo: true,
  showTodos: true,
  refreshInterval: 1000,
  compact: false,
  layout: 'vertical',

  theme: {
    bashBorder: '#fd5db1',
    claude: '#5f97cd',
    koding: '#0000ff',
    permission: '#b1b9f9',
    secondaryBorder: '#888',
    text: '#fff',
    secondaryText: '#999',
    suggestion: '#b1b9f9',
    // Semantic colors
    success: '#4eba65',
    error: '#ff6b80',
    warning: '#ffc107',
    // UI colors
    primary: '#fff',
    secondary: '#999',
    diff: {
      added: '#225c2b',
      removed: '#7a2936',
      addedDimmed: '#47584a',
      removedDimmed: '#69484d',
    },
    // Task status colors
    taskStatus: {
      running: '#5f97cd',
      completed: '#4eba65',
      failed: '#ff6b80',
      cancelled: '#888888',
      pending: '#ffc107',
    },
    // Progress bar characters
    progressChars: {
      filled: '█',
      empty: '░',
    }
  },

  notifications: {
    maxVisible: 3,
    position: 'top',
    autoDismiss: true,
    defaultDuration: 5000
  },

  errorHandling: {
    maxVisible: 3,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1000
  }
}

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

// Configuration manager hook
export function useTaskConfig() {
  const [config, setConfig] = useState<TaskDisplayConfig>(defaultConfig)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (!isBrowser) return
    
    try {
      const savedConfig = localStorage.getItem('taskDisplayConfig')
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)

        // Apply the theme
        getTheme(parsedConfig.theme)
      }
    } catch (error) {
      console.debug('Error loading saved configuration:', error)
    }
  }, [])

  // Apply the theme when config changes
  useEffect(() => {
    // Note: In a real implementation, we would apply the theme here
    // For now, we'll just log it
    console.debug('Theme applied:', config.theme)
  }, [config.theme])

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    if (!isBrowser) return
    
    try {
      localStorage.setItem('taskDisplayConfig', JSON.stringify(config))

      // Apply the theme
      // Note: In a real implementation, we would apply the theme here
      // For now, we'll just log it
      console.debug('Theme applied:', config.theme)
    } catch (error) {
      console.debug('Error saving configuration:', error)
    }
  }, [config])

  const updateConfig = useCallback((newConfig: Partial<TaskDisplayConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig)
    // Apply the theme
    // Note: In a real implementation, we would apply the theme here
    // For now, we'll just log it
    console.debug('Theme applied:', defaultConfig.theme)
  }, [])

  const openConfig = useCallback(() => {
    setIsConfigOpen(true)
  }, [])

  const closeConfig = useCallback(() => {
    setIsConfigOpen(false)
  }, [])

  return {
    config,
    updateConfig,
    resetConfig,
    isConfigOpen,
    openConfig,
    closeConfig
  }
}

// Configuration panel component
interface TaskConfigPanelProps {
  config: TaskDisplayConfig
  updateConfig: (config: Partial<TaskDisplayConfig>) => void
  resetConfig: () => void
  onClose: () => void
  width?: number
  height?: number
}

export function TaskConfigPanel({
  config,
  updateConfig,
  resetConfig,
  onClose,
  width = 80,
  height = 20
}: TaskConfigPanelProps) {
  const theme = getTheme()
  const [focusedControl, setFocusedControl] = useState<string | null>(null)
  const controls = [
    'maxVisibleTasksDec', 'maxVisibleTasksInc',
    'refreshIntervalDec', 'refreshIntervalInc',
    'notificationsMaxVisibleDec', 'notificationsMaxVisibleInc',
    'notificationDurationDec', 'notificationDurationInc',
    'errorHandlingMaxVisibleDec', 'errorHandlingMaxVisibleInc',
    'maxRetriesDec', 'maxRetriesInc',
    'retryDelayDec', 'retryDelayInc',
    'resetConfig'
  ]
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Initialize focus on first control
  useEffect(() => {
    if (!focusedControl) {
      setFocusedControl(controls[0])
    }
  }, [focusedControl])

  const handleMaxVisibleTasksChange = (value: number) => {
    updateConfig({ maxVisibleTasks: Math.max(1, Math.min(20, value)) })
  }

  const handleRefreshIntervalChange = (value: number) => {
    updateConfig({ refreshInterval: Math.max(100, Math.min(10000, value)) })
  }

  const handleNotificationDurationChange = (value: number) => {
    updateConfig({
      notifications: {
        ...config.notifications,
        defaultDuration: Math.max(1000, Math.min(30000, value))
      }
    })
  }

  const handleMaxRetriesChange = (value: number) => {
    updateConfig({
      errorHandling: {
        ...config.errorHandling,
        maxRetries: Math.max(0, Math.min(10, value))
      }
    })
  }

  const handleRetryDelayChange = (value: number) => {
    updateConfig({
      errorHandling: {
        ...config.errorHandling,
        retryDelay: Math.max(100, Math.min(10000, value))
      }
    })
  }

  // Handle keyboard input
  useInput((input, key) => {
    // Close config panel with ESC
    if (key.escape) {
      onClose()
      return
    }

    // Navigation between controls
    if (key.tab) {
      const newIndex = (focusedIndex + 1) % controls.length
      setFocusedIndex(newIndex)
      setFocusedControl(controls[newIndex])
      return
    }
    
    if (key.shift && key.tab) {
      const newIndex = (focusedIndex - 1 + controls.length) % controls.length
      setFocusedIndex(newIndex)
      setFocusedControl(controls[newIndex])
      return
    }

    // Handle focused control actions
    if (focusedControl) {
      switch (focusedControl) {
        case 'maxVisibleTasksDec':
          if (input === ' ' || input === '\r') {
            handleMaxVisibleTasksChange(config.maxVisibleTasks - 1)
          }
          break
        case 'maxVisibleTasksInc':
          if (input === ' ' || input === '\r') {
            handleMaxVisibleTasksChange(config.maxVisibleTasks + 1)
          }
          break
        case 'refreshIntervalDec':
          if (input === ' ' || input === '\r') {
            handleRefreshIntervalChange(config.refreshInterval - 100)
          }
          break
        case 'refreshIntervalInc':
          if (input === ' ' || input === '\r') {
            handleRefreshIntervalChange(config.refreshInterval + 100)
          }
          break
        case 'notificationsMaxVisibleDec':
          if (input === ' ' || input === '\r') {
            updateConfig({
              notifications: {
                ...config.notifications,
                maxVisible: Math.max(1, config.notifications.maxVisible - 1)
              }
            })
          }
          break
        case 'notificationsMaxVisibleInc':
          if (input === ' ' || input === '\r') {
            updateConfig({
              notifications: {
                ...config.notifications,
                maxVisible: config.notifications.maxVisible + 1
              }
            })
          }
          break
        case 'notificationDurationDec':
          if (input === ' ' || input === '\r') {
            handleNotificationDurationChange(config.notifications.defaultDuration - 1000)
          }
          break
        case 'notificationDurationInc':
          if (input === ' ' || input === '\r') {
            handleNotificationDurationChange(config.notifications.defaultDuration + 1000)
          }
          break
        case 'errorHandlingMaxVisibleDec':
          if (input === ' ' || input === '\r') {
            updateConfig({
              errorHandling: {
                ...config.errorHandling,
                maxVisible: Math.max(1, config.errorHandling.maxVisible - 1)
              }
            })
          }
          break
        case 'errorHandlingMaxVisibleInc':
          if (input === ' ' || input === '\r') {
            updateConfig({
              errorHandling: {
                ...config.errorHandling,
                maxVisible: config.errorHandling.maxVisible + 1
              }
            })
          }
          break
        case 'maxRetriesDec':
          if (input === ' ' || input === '\r') {
            handleMaxRetriesChange(config.errorHandling.maxRetries - 1)
          }
          break
        case 'maxRetriesInc':
          if (input === ' ' || input === '\r') {
            handleMaxRetriesChange(config.errorHandling.maxRetries + 1)
          }
          break
        case 'retryDelayDec':
          if (input === ' ' || input === '\r') {
            handleRetryDelayChange(config.errorHandling.retryDelay - 100)
          }
          break
        case 'retryDelayInc':
          if (input === ' ' || input === '\r') {
            handleRetryDelayChange(config.errorHandling.retryDelay + 100)
          }
          break
        case 'resetConfig':
          if (input === ' ' || input === '\r') {
            resetConfig()
          }
          break
      }
    }
  })

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.secondaryBorder} padding={1}>
      {/* Header */}
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Task Display Configuration</Text>
        <Text color={theme.secondaryText}>Press ESC to close</Text>
      </Box>

      {/* Display Options */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Display Options</Text>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Max Visible Tasks:</Text>
          <Text color={theme.text}>
            {' '}{config.maxVisibleTasks}
          </Text>
          <Box flexDirection="row" marginLeft={2}>
            <Text
              color={focusedControl === 'maxVisibleTasksDec' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'maxVisibleTasksDec'}
            >
              [-]
            </Text>
            <Text
              color={focusedControl === 'maxVisibleTasksInc' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'maxVisibleTasksInc'}
            >
              [+]
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Show API Info:</Text>
          <Text
            color={config.showApiInfo ? theme.success : theme.error}
          >
            {' '}{config.showApiInfo ? '✓' : '✗'}
          </Text>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Show Todos:</Text>
          <Text
            color={config.showTodos ? theme.success : theme.error}
          >
            {' '}{config.showTodos ? '✓' : '✗'}
          </Text>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Refresh Interval (ms):</Text>
          <Text color={theme.text}>
            {' '}{config.refreshInterval}
          </Text>
          <Box flexDirection="row" marginLeft={2}>
            <Text
              color={focusedControl === 'maxVisibleTasksDec' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'maxVisibleTasksDec'}
            >
              [-]
            </Text>
            <Text
              color={focusedControl === 'maxVisibleTasksInc' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'maxVisibleTasksInc'}
            >
              [+]
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Compact Mode:</Text>
          <Text
            color={config.compact ? theme.success : theme.error}
          >
            {' '}{config.compact ? '✓' : '✗'}
          </Text>
        </Box>
      </Box>

      {/* Notification Options */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Notification Options</Text>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Max Visible:</Text>
          <Text color={theme.text}>
            {' '}{config.notifications.maxVisible}
          </Text>
          <Box flexDirection="row" marginLeft={2}>
            <Text
              color={focusedControl === 'refreshIntervalDec' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'refreshIntervalDec'}
            >
              [-]
            </Text>
            <Text
              color={focusedControl === 'refreshIntervalInc' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'refreshIntervalInc'}
            >
              [+]
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Position:</Text>
          <Text
            color={theme.primary}
          >
            {' '}{config.notifications.position}
          </Text>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Auto Dismiss:</Text>
          <Text
            color={config.notifications.autoDismiss ? theme.success : theme.error}
          >
            {' '}{config.notifications.autoDismiss ? '✓' : '✗'}
          </Text>
        </Box>

        {config.notifications.autoDismiss && (
          <Box flexDirection="row" marginTop={1}>
            <Text color={theme.secondaryText}>Duration (ms):</Text>
            <Text color={theme.text}>
              {' '}{config.notifications.defaultDuration}
            </Text>
            <Box flexDirection="row" marginLeft={2}>
              <Text
                color={focusedControl === 'notificationsMaxVisibleDec' ? theme.kode : theme.secondaryText}
                underline={focusedControl === 'notificationsMaxVisibleDec'}
              >
                [-]
              </Text>
              <Text
                color={focusedControl === 'notificationsMaxVisibleInc' ? theme.kode : theme.secondaryText}
                underline={focusedControl === 'notificationsMaxVisibleInc'}
              >
                [+]
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Error Handling Options */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Error Handling Options</Text>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Max Visible:</Text>
          <Text color={theme.text}>
            {' '}{config.errorHandling.maxVisible}
          </Text>
          <Box flexDirection="row" marginLeft={2}>
            <Text
              color={focusedControl === 'notificationDurationDec' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'notificationDurationDec'}
            >
              [-]
            </Text>
            <Text
              color={focusedControl === 'notificationDurationInc' ? theme.kode : theme.secondaryText}
              underline={focusedControl === 'notificationDurationInc'}
            >
              [+]
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.secondaryText}>Auto Retry:</Text>
          <Text
            color={config.errorHandling.autoRetry ? theme.success : theme.error}
          >
            {' '}{config.errorHandling.autoRetry ? '✓' : '✗'}
          </Text>
        </Box>

        {config.errorHandling.autoRetry && (
          <>
            <Box flexDirection="row" marginTop={1}>
              <Text color={theme.secondaryText}>Max Retries:</Text>
              <Text color={theme.text}>
                {' '}{config.errorHandling.maxRetries}
              </Text>
              <Box flexDirection="row" marginLeft={2}>
                <Text
                  color={focusedControl === 'errorHandlingMaxVisibleDec' ? theme.kode : theme.secondaryText}
                  underline={focusedControl === 'errorHandlingMaxVisibleDec'}
                >
                  [-]
                </Text>
                <Text
                  color={focusedControl === 'errorHandlingMaxVisibleInc' ? theme.kode : theme.secondaryText}
                  underline={focusedControl === 'errorHandlingMaxVisibleInc'}
                >
                  [+]
                </Text>
              </Box>
            </Box>

            <Box flexDirection="row" marginTop={1}>
              <Text color={theme.secondaryText}>Retry Delay (ms):</Text>
              <Text color={theme.text}>
                {' '}{config.errorHandling.retryDelay}
              </Text>
              <Box flexDirection="row" marginLeft={2}>
                <Text
                  color={focusedControl === 'retryDelayDec' ? theme.kode : theme.secondaryText}
                  underline={focusedControl === 'retryDelayDec'}
                >
                  [-]
                </Text>
                <Text
                  color={focusedControl === 'retryDelayInc' ? theme.kode : theme.secondaryText}
                  underline={focusedControl === 'retryDelayInc'}
                >
                  [+]
                </Text>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Actions */}
      <Box flexDirection="row" justifyContent="flex-end" marginTop={1}>
        <Text
          color={focusedControl === 'resetConfig' ? theme.kode : theme.error}
          underline={focusedControl === 'resetConfig' || true}
        >
          [Reset to Defaults]
        </Text>
      </Box>
    </Box>
  )
}