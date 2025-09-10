import type { NormalizedMessage } from '../../utils/messages'

export interface MessageContainerProps {
  messages: NormalizedMessage[]
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

export interface MessageRendererProps extends MessageContainerProps {}