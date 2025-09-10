import React, { useState } from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../utils/theme'

export type TaskAction = 
  | 'cancel'      // 取消任务
  | 'pause'       // 暂停任务（需要后端支持）
  | 'resume'      // 恢复任务
  | 'restart'     // 重新开始
  | 'view_logs'   // 查看日志
  | 'copy_details' // 复制详情

interface TaskControl {
  id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending' | 'paused'
  description: string
  agentType: string
}

interface TaskControlPanelProps {
  task: TaskControl
  isVisible: boolean
  onAction: (taskId: string, action: TaskAction) => void
  onClose?: () => void
  width?: number
}

export function TaskControlPanel({ 
  task, 
  isVisible, 
  onAction, 
  onClose,
  width = 60
}: TaskControlPanelProps) {
  const [selectedAction, setSelectedAction] = useState<TaskAction | null>(null)
  const theme = getTheme()

  if (!isVisible || !task) {
    return null
  }

  // Get available actions based on task status
  const getAvailableActions = (): TaskAction[] => {
    switch (task.status) {
      case 'running':
        return ['cancel', 'pause', 'view_logs']
      case 'paused':
        return ['resume', 'cancel', 'view_logs']
      case 'completed':
        return ['restart', 'view_logs', 'copy_details']
      case 'failed':
        return ['restart', 'view_logs', 'copy_details']
      case 'cancelled':
        return ['restart', 'view_logs', 'copy_details']
      case 'pending':
        return ['cancel', 'view_logs']
      default:
        return ['view_logs']
    }
  }

  const getActionLabel = (action: TaskAction): string => {
    switch (action) {
      case 'cancel': return 'Cancel Task'
      case 'pause': return 'Pause Task'
      case 'resume': return 'Resume Task'
      case 'restart': return 'Restart Task'
      case 'view_logs': return 'View Logs'
      case 'copy_details': return 'Copy Details'
      default: return action
    }
  }

  const getActionColor = (action: TaskAction): string => {
    switch (action) {
      case 'cancel': return theme.error
      case 'pause': return theme.warning
      case 'resume': return theme.success
      case 'restart': return theme.primary
      case 'view_logs': return theme.secondary
      case 'copy_details': return theme.secondary
      default: return theme.text
    }
  }

  const handleActionSelect = (action: TaskAction) => {
    setSelectedAction(action)
    onAction(task.id, action)
  }

  const availableActions = getAvailableActions()

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.secondaryBorder} padding={1}>
      {/* Header */}
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Task Controls</Text>
        <Text color={theme.secondaryText}>Press ESC to close</Text>
      </Box>

      {/* Task Info */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Task</Text>
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
        <Box flexDirection="row">
          <Text color={theme.secondaryText}>Status:</Text>
          <Text>{task.status}</Text>
        </Box>
      </Box>

      {/* Available Actions */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold={true} color={theme.primary}>Available Actions</Text>
        {availableActions.map((action, index) => (
          <Box 
            key={action}
            flexDirection="row"
            marginLeft={2}
            onClick={() => handleActionSelect(action)}
          >
            <Text color={getActionColor(action)}>
              {index + 1}. {getActionLabel(action)}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Instructions */}
      <Box flexDirection="column">
        <Text color={theme.secondaryText} bold={true}>Instructions</Text>
        <Text color={theme.secondaryText}>• Click on an action to execute it</Text>
        <Text color={theme.secondaryText}>• Some actions may require confirmation</Text>
        <Text color={theme.secondaryText}>• Press ESC to close this panel</Text>
      </Box>
    </Box>
  )
}