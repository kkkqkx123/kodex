import React, { memo } from 'react'
import { MessageRenderer } from './MessageRenderer'

interface MessageContainerProps {
  messages: any[]
  tools: any[]
  verbose: boolean
  debug: boolean
  forkNumber: number
  mcpClients?: any[]
  isDefaultModel?: boolean
  erroredToolUseIDs: Set<string>
  inProgressToolUseIDs: Set<string>
  unresolvedToolUseIDs: Set<string>
  toolJSX: any
  toolUseConfirm: any
  isMessageSelectorVisible: boolean
}

export const MessageContainer = memo(({
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
}: MessageContainerProps) => {
  // 只有当消息相关的 props 改变时才重新渲染
  return (
    <MessageRenderer
      messages={messages}
      tools={tools}
      verbose={verbose}
      debug={debug}
      forkNumber={forkNumber}
      mcpClients={mcpClients}
      isDefaultModel={isDefaultModel}
      erroredToolUseIDs={erroredToolUseIDs}
      inProgressToolUseIDs={inProgressToolUseIDs}
      unresolvedToolUseIDs={unresolvedToolUseIDs}
      toolJSX={toolJSX}
      toolUseConfirm={toolUseConfirm}
      isMessageSelectorVisible={isMessageSelectorVisible}
    />
  )
})

MessageContainer.displayName = 'MessageContainer'