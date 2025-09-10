import React, { useMemo, useEffect } from 'react'
import { Box, Text } from 'ink'
import { MessageRenderer } from './MessageRenderer'
import { useTerminalSize } from '../../hooks/useTerminalSize'
import { StaticElementManager } from './StaticElementManager'
import type { MessageContainerProps } from './REPL.types'

interface VirtualMessageListProps extends MessageContainerProps {
  disableStaticCaching?: boolean
}

export const VirtualMessageList: React.FC<VirtualMessageListProps> = ({
  messages,
  tools,
  verbose,
  debug,
  forkNumber,
  mcpClients,
  isDefaultModel,
  erroredToolUseIDs,
  inProgressToolUseIDs,
  unresolvedToolUseIDs,
  toolJSX,
  toolUseConfirm,
  isMessageSelectorVisible,
  disableStaticCaching = false,
}) => {
  const { height: terminalHeight } = useTerminalSize()
  
  // 计算可见消息数量
  const { visibleMessages, visibleRange } = useMemo(() => {
    if (messages.length === 0) {
      return { visibleMessages: [], visibleRange: { start: 0, end: 0 } }
    }

    // 每条消息大约占用3行高度，加上一些缓冲
    const messageHeight = 3
    const maxVisibleMessages = Math.max(1, Math.floor(terminalHeight / messageHeight))
    
    // 始终显示最新的消息
    const start = Math.max(0, messages.length - maxVisibleMessages)
    const end = messages.length
    
    const visibleMessages = messages.slice(start, end)
    
    return {
      visibleMessages,
      visibleRange: { start, end }
    }
  }, [messages, terminalHeight])

  // 监听任务状态变化
  useEffect(() => {
    const hasActiveProcess = inProgressToolUseIDs.size > 0 || toolJSX || toolUseConfirm
    StaticElementManager.getInstance().setTaskStatus(hasActiveProcess)
  }, [inProgressToolUseIDs.size, toolJSX, toolUseConfirm])

  // 渲染可见消息
  const rendererProps = useMemo(() => ({
    messages: visibleMessages,
    tools,
    verbose,
    debug,
    forkNumber,
    mcpClients,
    isDefaultModel,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    unresolvedToolUseIDs,
    toolJSX,
    toolUseConfirm,
    isMessageSelectorVisible,
  }), [
    visibleMessages,
    tools,
    verbose,
    debug,
    forkNumber,
    mcpClients,
    isDefaultModel,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    unresolvedToolUseIDs,
    toolJSX,
    toolUseConfirm,
    isMessageSelectorVisible,
  ])

  if (visibleMessages.length === 0) {
    return <Box height={0} />
  }

  return (
    <Box flexDirection="column" width="100%">
      {/* 消息数量指示器 */}
      {messages.length > visibleMessages.length && (
        <Box marginBottom={1}>
          <Text dimColor>
            显示 {visibleMessages.length}/{messages.length} 条消息
          </Text>
        </Box>
      )}
      
      {/* 渲染可见消息 */}
      <MessageRenderer 
        {...rendererProps}
        // 任务执行期间禁用static元素缓存
        disableStaticCaching={disableStaticCaching}
      />
    </Box>
  )
}