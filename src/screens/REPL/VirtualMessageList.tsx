import React, { useMemo, useRef, useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { MessageRenderer } from './MessageRenderer'
import { useTerminalSize } from '../../hooks/useTerminalSize'
import type { MessageRendererProps } from '../REPL.types'
import type { NormalizedMessage } from '../../utils/messages'

interface VirtualMessageListProps extends Omit<MessageRendererProps, 'messages'> {
  messages: NormalizedMessage[]
  maxVisibleMessages?: number
}

export const VirtualMessageList: React.FC<VirtualMessageListProps> = ({
  messages,
  maxVisibleMessages = 50,
  ...otherProps
}) => {
  const { rows } = useTerminalSize()
  const [startIndex, setStartIndex] = useState(0)
  const containerRef = useRef<any>(null)

  // 计算可见消息数量
  const visibleCount = useMemo(() => {
    const messageHeight = 3 // 每条消息的估计高度
    const availableRows = Math.max(10, rows - 10) // 保留空间给输入和其他UI
    return Math.min(maxVisibleMessages, Math.floor(availableRows / messageHeight))
  }, [rows, maxVisibleMessages])

  // 计算可见消息范围
  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleCount) {
      return messages
    }
    
    // 始终显示最新的消息
    const endIndex = messages.length
    const start = Math.max(0, endIndex - visibleCount)
    
    return messages.slice(start, endIndex)
  }, [messages, visibleCount])

  // 显示消息数量指示器
  const MessageCountIndicator = useMemo(() => {
    if (messages.length <= visibleCount) return null
    
    const hiddenCount = messages.length - visibleCount
    return (
      <Box marginTop={1} marginBottom={1}>
        <Box>
          <Text color="gray" dimColor>
            显示 {visibleMessages.length} / {messages.length} 条消息 
            ({hiddenCount} 条旧消息已隐藏)
          </Text>
        </Box>
      </Box>
    )
  }, [messages.length, visibleCount, visibleMessages.length])

  return (
    <Box flexDirection="column" width="100%">
      {MessageCountIndicator}
      <MessageRenderer
        {...otherProps}
        messages={visibleMessages}
      />
    </Box>
  )
}