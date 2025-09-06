import React, { useMemo } from 'react'
import { Box } from 'ink'
import { Logo } from '../../components/Logo'
import ProjectOnboarding from '../../ProjectOnboarding'
import { Message } from '../../components/Message'
import { MessageResponse } from '../../components/MessageResponse'
import { type MessageRendererProps } from '../REPL.types'
import type { NormalizedMessage } from '../../utils/messages'
import { getToolUseID, INTERRUPT_MESSAGE, reorderMessages } from '../../utils/messages'
import { getOriginalCwd } from '../../utils/state'

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
  const messagesJSX = useMemo(() => {
    return [
      {
        type: 'static',
        jsx: (
          <Box flexDirection="column" key="logo">
            <Logo mcpClients={mcpClients} isDefaultModel={isDefaultModel} />
            <ProjectOnboarding workspaceDir={getOriginalCwd()} />
          </Box>
        ),
      },
      ...reorderMessages(messages).map(_ => {
        const toolUseID = getToolUseID(_)
        const message =
          _.type === 'progress' ? (
            _.content.message.content[0]?.type === 'text' &&
              // Hack: TaskTool interrupts use Progress messages, so don't
              // need an extra ⎿ because <Message /> already adds one.
              // TODO: Find a cleaner way to do this.
              // Check if we're in PowerShell and adjust rendering
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

        const type = shouldRenderStatically(
          _,
          messages,
          unresolvedToolUseIDs,
        )
          ? 'static'
          : 'transient'

        // PowerShell-specific rendering adjustments
        if (process.platform === 'win32' && process.env.PSModulePath) {
          // Simplify rendering in PowerShell to prevent memory leaks
          return {
            type: 'static',
            jsx: (
              <Box key={_.uuid} width="100%">
                {message}
              </Box>
            ),
          }
        }

        if (debug) {
          return {
            type,
            jsx: (
              <Box
                borderStyle="single"
                borderColor={type === 'static' ? 'green' : 'red'}
                key={_.uuid}
                width="100%"
              >
                {message}
              </Box>
            ),
          }
        }

        return {
          type,
          jsx: (
            <Box key={_.uuid} width="100%">
              {message}
            </Box>
          ),
        }
      }),
    ]
  }, [
    forkNumber,
    messages,
    tools,
    verbose,
    debug,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    toolJSX,
    toolUseConfirm,
    isMessageSelectorVisible,
    unresolvedToolUseIDs,
    mcpClients,
    isDefaultModel,
  ])

  return messagesJSX.map(item => item.jsx)
}

// Helper function to determine if a message should be rendered statically
function shouldRenderStatically(
  message: NormalizedMessage,
  messages: NormalizedMessage[],
  unresolvedToolUseIDs: Set<string>,
): boolean {
  
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
      return !intersects(unresolvedToolUseIDs, message.siblingToolUseIDs)
  }
}

function intersects<A>(a: Set<A>, b: Set<A>): boolean {
  return a.size > 0 && b.size > 0 && [...a].some(_ => b.has(_))
}