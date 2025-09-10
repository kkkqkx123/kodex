import { ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { ReactNode } from 'react'
import { Command } from '../commands'
import type { WrappedClient } from '../services/mcpClient'
import type { Tool } from '../Tool'
import { AutoUpdaterResult } from '../utils/autoUpdater'
import {
  type AssistantMessage,
  type BinaryFeedbackResult,
  type Message as MessageType,
  type ProgressMessage,
} from '../query.js'
import type { NormalizedMessage } from '../utils/messages'

export type BinaryFeedbackContext = {
  m1: AssistantMessage
  m2: AssistantMessage
  resolve: (result: BinaryFeedbackResult) => void
}

export type ToolJSXState = {
  jsx: ReactNode | null
  shouldHidePromptInput: boolean
} | null

export type SetToolJSXFn = (jsx: ToolJSXState) => void

export interface REPLCoreProps {
  commands: Command[]
  safeMode?: boolean
  debug?: boolean
  initialForkNumber?: number | undefined
  initialPrompt: string | undefined
  messageLogName: string
  shouldShowPromptInput: boolean
  tools: Tool[]
  verbose: boolean | undefined
  initialMessages?: MessageType[]
  mcpClients?: WrappedClient[]
  isDefaultModel?: boolean
  onHideInputBox?: () => void
}

export interface REPLState {
  messages: MessageType[]
  isLoading: boolean
  abortController: AbortController | null
  toolJSX: ToolJSXState
  toolUseConfirm: ToolUseConfirm | null
  inputValue: string
  inputMode: 'bash' | 'prompt' | 'koding'
  submitCount: number
  isMessageSelectorVisible: boolean
  showCostDialog: boolean
  haveShownCostDialog: boolean
  binaryFeedbackContext: BinaryFeedbackContext | null
  shouldHideInputBox: boolean
  autoUpdaterResult: AutoUpdaterResult | null
  forkNumber: number
  forkConvoWithMessagesOnTheNextRender: MessageType[] | null
}

export interface QueryContext {
  commands: Command[]
  forkNumber: number
  messageLogName: string
  tools: Tool[]
  verbose: boolean
  safeMode?: boolean
  maxThinkingTokens: number
  isKodingRequest?: boolean
}

export interface MessageRendererProps {
  messages: NormalizedMessage[]
  tools: Tool[]
  verbose: boolean
  debug: boolean
  forkNumber: number
  mcpClients?: WrappedClient[]
  isDefaultModel?: boolean
  erroredToolUseIDs: Set<string>
  inProgressToolUseIDs: Set<string>
  unresolvedToolUseIDs: Set<string>
  toolJSX: ToolJSXState
  toolUseConfirm: ToolUseConfirm | null
  isMessageSelectorVisible: boolean
}

export interface ToolUIManagerProps {
  toolJSX: ToolJSXState
  toolUseConfirm: ToolUseConfirm | null
  binaryFeedbackContext: BinaryFeedbackContext | null
  isMessageSelectorVisible: boolean
  showingCostDialog: boolean
  verbose: boolean
  normalizedMessages: NormalizedMessage[]
  tools: Tool[]
  debug: boolean
  erroredToolUseIDs: Set<string>
  inProgressToolUseIDs: Set<string>
  unresolvedToolUseIDs: Set<string>
}

export interface DialogManagerProps {
  showCostDialog: boolean
  haveShownCostDialog: boolean
  isLoading: boolean
  verbose: boolean
}

export type CleanupFunction = () => void | Promise<void>
export type StateListener = (state: REPLState) => void
export type UnsubscribeFunction = () => void

export interface SignalHandler {
  setup(): CleanupFunction
  handleSIGINT(): void
  handleCleanup(): Promise<void>
}

export interface StateManager {
  getState(): REPLState
  updateState(updater: (state: REPLState) => REPLState): void
  subscribe(listener: StateListener): UnsubscribeFunction
}

export interface QueryCoordinator {
  executeQuery(messages: MessageType[], context: QueryContext): Promise<MessageType[]>
  processToolResults(): void
  handleKodingMode(): void
}

export type ToolUseConfirm = {
  toolName: string
  toolInput: any
  onConfirm: () => void
  onAbort: () => void
}