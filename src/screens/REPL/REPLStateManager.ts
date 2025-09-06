import { type REPLState, type StateListener, type UnsubscribeFunction, type ToolJSXState } from '../REPL.types'
import { type Message as MessageType, type AssistantMessage, type BinaryFeedbackResult } from '../../query.js'
import { AutoUpdaterResult } from '../../utils/autoUpdater'
import { getNextAvailableLogForkNumber } from '../../utils/log'

export class REPLStateManager {
  private state: REPLState
  private listeners: StateListener[] = []

  constructor(initialMessages?: MessageType[], initialPrompt?: string, messageLogName?: string, initialForkNumber?: number) {
    this.state = {
      messages: initialMessages ?? [],
      isLoading: false,
      abortController: null,
      toolJSX: null,
      toolUseConfirm: null,
      inputValue: '',
      inputMode: 'prompt',
      submitCount: 0,
      isMessageSelectorVisible: false,
      showCostDialog: false,
      haveShownCostDialog: false,
      binaryFeedbackContext: null,
      shouldHideInputBox: false,
      autoUpdaterResult: null,
      forkNumber: getNextAvailableLogForkNumber(messageLogName ?? '', initialForkNumber ?? 0, 0),
      forkConvoWithMessagesOnTheNextRender: null,
    }
  }

  getState(): REPLState {
    return { ...this.state }
  }

  updateState(updater: (state: REPLState) => REPLState): void {
    const newState = updater({ ...this.state })
    this.state = newState
    this.notifyListeners()
  }

  subscribe(listener: StateListener): UnsubscribeFunction {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  // Convenience methods for specific state updates
  setMessages(messages: MessageType[]): void {
    this.updateState(state => ({ ...state, messages }))
  }

  addMessages(newMessages: MessageType[]): void {
    this.updateState(state => ({ 
      ...state, 
      messages: [...state.messages, ...newMessages] 
    }))
  }

  setLoading(isLoading: boolean): void {
    this.updateState(state => ({ ...state, isLoading }))
  }

  setAbortController(abortController: AbortController | null): void {
    this.updateState(state => ({ ...state, abortController }))
  }

  setToolJSX(toolJSX: ToolJSXState): void {
    this.updateState(state => ({ ...state, toolJSX }))
  }

  setToolUseConfirm(toolUseConfirm: any): void {
    this.updateState(state => ({ ...state, toolUseConfirm }))
  }

  setInputValue(inputValue: string): void {
    this.updateState(state => ({ ...state, inputValue }))
  }

  setInputMode(inputMode: 'bash' | 'prompt' | 'koding'): void {
    this.updateState(state => ({ ...state, inputMode }))
  }

  setSubmitCount(submitCount: number): void {
    this.updateState(state => ({ ...state, submitCount }))
  }

  setMessageSelectorVisible(isMessageSelectorVisible: boolean): void {
    this.updateState(state => ({ ...state, isMessageSelectorVisible }))
  }

  setShowCostDialog(showCostDialog: boolean): void {
    this.updateState(state => ({ ...state, showCostDialog }))
  }

  setHaveShownCostDialog(haveShownCostDialog: boolean): void {
    this.updateState(state => ({ ...state, haveShownCostDialog }))
  }

  setBinaryFeedbackContext(binaryFeedbackContext: any): void {
    this.updateState(state => ({ ...state, binaryFeedbackContext }))
  }

  setShouldHideInputBox(shouldHideInputBox: boolean): void {
    this.updateState(state => ({ ...state, shouldHideInputBox }))
  }

  setAutoUpdaterResult(autoUpdaterResult: AutoUpdaterResult | null): void {
    this.updateState(state => ({ ...state, autoUpdaterResult }))
  }

  setForkNumber(forkNumber: number): void {
    this.updateState(state => ({ ...state, forkNumber }))
  }

  setForkConvoWithMessagesOnTheNextRender(messages: MessageType[] | null): void {
    this.updateState(state => ({ ...state, forkConvoWithMessagesOnTheNextRender: messages }))
  }

  incrementForkNumber(): void {
    this.updateState(state => ({ ...state, forkNumber: state.forkNumber + 1 }))
  }

  incrementSubmitCount(): void {
    this.updateState(state => ({ ...state, submitCount: state.submitCount + 1 }))
  }

  getBinaryFeedbackResponse(): (m1: AssistantMessage, m2: AssistantMessage) => Promise<BinaryFeedbackResult> {
    return (m1: AssistantMessage, m2: AssistantMessage): Promise<BinaryFeedbackResult> => {
      return new Promise<BinaryFeedbackResult>(resolve => {
        this.setBinaryFeedbackContext({
          m1,
          m2,
          resolve,
        })
      })
    }
  }
}