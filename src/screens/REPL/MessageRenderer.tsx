import React, { useMemo, useEffect } from 'react'
import { Box } from 'ink'
import { Logo } from '../../components/Logo'
import ProjectOnboarding from '../../ProjectOnboarding'
import { Message } from '../../components/Message'
import { MessageResponse } from '../../components/MessageResponse'
import { type MessageRendererProps } from '../REPL.types'
import type { NormalizedMessage } from '../../utils/messages'
import { getToolUseID, INTERRUPT_MESSAGE, reorderMessages } from '../../utils/messages'
import { getOriginalCwd } from '../../utils/state'
import { StaticElementManager } from './StaticElementManager'

export const MessageRenderer: React.FC<MessageRendererProps> = ({
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
  // 监听任务状态变化
  useEffect(() => {
    const hasActiveProcess = inProgressToolUseIDs.size > 0 || toolJSX || toolUseConfirm
    StaticElementManager.getInstance().setTaskStatus(hasActiveProcess)
  }, [inProgressToolUseIDs.size, toolJSX, toolUseConfirm])

  const logoAndOnboarding = useMemo(() => (
    <Box flexDirection="column" key="logo-and-onboarding">
      <Logo mcpClients={mcpClients} isDefaultModel={isDefaultModel} />
      <ProjectOnboarding workspaceDir={getOriginalCwd()} />
    </Box>
  ), [mcpClients, isDefaultModel]);

  // 缓存static元素，避免任务执行期间重新计算
  const cachedStaticElements = useMemo(() => {
    return {
      logo: logoAndOnboarding,
      staticMessages: new Map<string, React.ReactNode>()
    }
  }, [logoAndOnboarding])

  const messagesJSX = useMemo(() => {
    const reorderedMessages = reorderMessages(messages);
    
    // 如果没有消息，返回空数组避免Static组件残留
    if (messages.length === 0) {
      return [
        {
          type: 'transient',
          jsx: <Box key="empty" height={0} />,
          key: 'empty',
        }
      ]
    }
    
    // 任务执行期间，所有元素都使用transient模式避免刷新
    const isTaskInProgress = inProgressToolUseIDs.size > 0 || toolJSX || toolUseConfirm
    
    return [
      {
        type: isTaskInProgress ? 'transient' : 'static',
        jsx: cachedStaticElements.logo,
        key: 'logo-and-onboarding',
      },
      ...reorderedMessages.map((_, index) => {
        const toolUseID = getToolUseID(_)
        const message =
          _.type === 'progress' ? (
            _.content.message.content[0]?.type === 'text' &&
              _.content.message.content[0].text === INTERRUPT_MESSAGE ? (
              <Message
                message={_.content}
                messages={_.normalizedMessages}
                addMargin={false}
                tools={_.tools}
                verbose={verbose ?? false}
                debug={debug}
                erroredToolUseIDs={new Set()}
                inProgressToolUseIDs={new Set()}
                unresolvedToolUseIDs={new Set()}
                shouldAnimate={false}
                shouldShowDot={false}
              />
            ) : (
              <MessageResponse children={undefined}>
                <Message
                  message={_.content}
                  messages={_.normalizedMessages}
                  addMargin={false}
                  tools={_.tools}
                  verbose={verbose ?? false}
                  debug={debug}
                  erroredToolUseIDs={new Set()}
                  inProgressToolUseIDs={new Set()}
                  unresolvedToolUseIDs={
                    new Set([
                      (_.content.message.content[0] as any).id,
                    ])
                  }
                  shouldAnimate={false}
                  shouldShowDot={false}
                />
              </MessageResponse>
            )
          ) : (
            <Message
              message={_}
              messages={messages}
              addMargin={true}
              tools={tools}
              verbose={verbose}
              debug={debug}
              erroredToolUseIDs={erroredToolUseIDs}
              inProgressToolUseIDs={inProgressToolUseIDs}
              shouldAnimate={
                !toolJSX &&
                !toolUseConfirm &&
                !isMessageSelectorVisible &&
                (!toolUseID || inProgressToolUseIDs.has(toolUseID))
              }
              shouldShowDot={true}
              unresolvedToolUseIDs={unresolvedToolUseIDs}
            />
          )

        // 任务执行期间，所有消息都使用transient模式
        const shouldBeStatic = shouldRenderStatically(
          _,
          messages,
          unresolvedToolUseIDs,
        ) && !isTaskInProgress

        return {
          type: shouldBeStatic ? 'static' : 'transient',
          jsx: (
            <Box key={`message-${_.uuid || index}`} width="100%">
              {message}
            </Box>
          ),
          key: `message-${_.uuid || index}`,
        }
      }),
    ]
  }, [
    messages,
    tools,
    verbose,
    debug,
    forkNumber,
    toolJSX,
    toolUseConfirm,
    isMessageSelectorVisible,
    cachedStaticElements.logo,
    cachedStaticElements,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    unresolvedToolUseIDs,
  ])

  return messagesJSX.map(item => item.jsx)
}

function shouldRenderStatically(
  message: NormalizedMessage,
  messages: NormalizedMessage[],
  unresolvedToolUseIDs: Set<string>,
): boolean {
  // PowerShell-specific rendering adjustments
  if (process.platform === 'win32' && process.env.PSModulePath) {
    // In PowerShell, we still want to dynamically render progress messages
    // and unresolved tool use messages to prevent memory leaks while maintaining UX
    switch (message.type) {
      case 'user':
      case 'assistant': {
        const toolUseID = getToolUseID(message)
        if (!toolUseID) {
          // Static messages for regular user/assistant messages
          return true
        }
        if (unresolvedToolUseIDs.has(toolUseID)) {
          // Dynamic rendering for unresolved tool use messages
          return false
        }

        const correspondingProgressMessage = messages.find(
          _ => _.type === 'progress' && _.toolUseID === toolUseID,
        ) as any
        if (!correspondingProgressMessage) {
          // Static rendering if no progress message
          return true
        }

        // Static rendering if no intersection with unresolved tool use IDs
        return !intersects(
          unresolvedToolUseIDs,
          correspondingProgressMessage.siblingToolUseIDs,
        )
      }
      case 'progress':
        // Dynamic rendering for progress messages
        return false
    }
  }
  
  switch (message.type) {
    case 'user':
    case 'assistant': {
      const toolUseID = getToolUseID(message)
      if (!toolUseID) {
        return true
      }
      if (unresolvedToolUseIDs.has(toolUseID)) {
        return false
      }

      const correspondingProgressMessage = messages.find(
        _ => _.type === 'progress' && _.toolUseID === toolUseID,
      ) as any
      if (!correspondingProgressMessage) {
        return true
      }

      return !intersects(
        unresolvedToolUseIDs,
        correspondingProgressMessage.siblingToolUseIDs,
      )
    }
    case 'progress':
      return false
    default:
      return true
  }
}

function intersects<T>(setA: Set<T>, setB: Set<T>): boolean {
  for (const item of setA) {
    if (setB.has(item)) {
      return true
    }
  }
  return false
}