import React, { useMemo } from 'react'
import { MessageRenderer } from './MessageRenderer'
import { VirtualMessageList } from './VirtualMessageList'
import { StaticElementManager } from './StaticElementManager'
import type { MessageContainerProps } from './REPL.types'

// 虚拟化阈值 - 消息超过此数量时启用虚拟化
// 提高阈值，减少频繁切换导致的UI残留
const VIRTUALIZATION_THRESHOLD = 20

export const MessageContainer: React.FC<MessageContainerProps> = React.memo(({
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
}) => {
  // 获取任务状态
  const isTaskInProgress = inProgressToolUseIDs.size > 0 || toolJSX || toolUseConfirm
  
  // 统一管理的props对象
  const rendererProps = useMemo(() => ({
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
  }), [
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
  ])

  // 根据消息数量决定渲染策略
  const shouldUseVirtualization = messages.length > VIRTUALIZATION_THRESHOLD

  // 任务执行期间，通知StaticElementManager当前状态
  React.useEffect(() => {
    StaticElementManager.getInstance().setTaskStatus(isTaskInProgress)
  }, [isTaskInProgress])

  if (shouldUseVirtualization) {
    return (
      <VirtualMessageList
        {...rendererProps}
        // 任务执行期间禁用静态元素缓存
        disableStaticCaching={isTaskInProgress}
      />
    )
  }

  return <MessageRenderer {...rendererProps} />
}, (prevProps, nextProps) => {
  // 深度比较，只有当消息相关属性真正变化时才重新渲染
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.tools === nextProps.tools &&
    prevProps.verbose === nextProps.verbose &&
    prevProps.debug === nextProps.debug &&
    prevProps.forkNumber === nextProps.forkNumber &&
    prevProps.mcpClients === nextProps.mcpClients &&
    prevProps.isDefaultModel === nextProps.isDefaultModel &&
    prevProps.erroredToolUseIDs === nextProps.erroredToolUseIDs &&
    prevProps.inProgressToolUseIDs === nextProps.inProgressToolUseIDs &&
    prevProps.unresolvedToolUseIDs === nextProps.unresolvedToolUseIDs &&
    prevProps.toolJSX === nextProps.toolJSX &&
    prevProps.toolUseConfirm === nextProps.toolUseConfirm &&
    prevProps.isMessageSelectorVisible === nextProps.isMessageSelectorVisible
  )
})