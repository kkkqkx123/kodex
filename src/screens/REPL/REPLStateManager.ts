import { type REPLState, type StateListener, type UnsubscribeFunction, type ToolJSXState } from '../REPL.types'
import { type Message as MessageType, type AssistantMessage, type BinaryFeedbackResult } from '../../query.js'
import { AutoUpdaterResult } from '../../utils/autoUpdater'
import { getNextAvailableLogForkNumber } from '../../utils/log'
import { InputStateManager, type InputState } from './InputStateManager'
import { shallowEqual } from '../../utils/shallowEqual'

export class REPLStateManager {
  private state: Omit<REPLState, 'inputValue'>
  private listeners: StateListener[] = []
  private inputStateManager: InputStateManager

  constructor(initialMessages?: MessageType[], initialPrompt?: string, messageLogName?: string, initialForkNumber?: number) {
    this.state = {
      messages: initialMessages ?? [],
      isLoading: false,
      abortController: null,
      toolJSX: null,
      toolUseConfirm: null,
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
    
    this.inputStateManager = new InputStateManager(initialPrompt ?? '')
  }

  getState(): REPLState {
    return {
      ...this.state,
      inputValue: this.inputStateManager.getState().value
    }
  }

  updateState(updater: (state: REPLState) => REPLState): void {
    const newState = updater(this.getState())
    
    // Separate input value from other state properties
    const { inputValue, ...otherState } = newState
    // Only update and notify if state actually changed
    if (!this.shallowEqual(this.state, otherState)) {
      this.state = otherState
      this.notifyListeners()
    }
    
    // Update input state separately
    if (inputValue !== this.inputStateManager.getState().value) {
      this.inputStateManager.setValue(inputValue)
    }
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

  subscribeToInputState(listener: (state: InputState) => void): UnsubscribeFunction {
    return this.inputStateManager.subscribe(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()))
  }

  private shallowEqual(obj1: any, obj2: any): boolean {
    return shallowEqual(obj1, obj2)
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
    this.inputStateManager.setValue(inputValue)
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