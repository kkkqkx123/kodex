import { Box, Newline, Static, Text } from 'ink'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Command } from '../commands'
import { PermissionProvider } from '../context/PermissionContext'
import { ModeIndicator } from '../components/ModeIndicator'
import PromptInput from '../components/PromptInput'
import { MessageSelector } from '../components/MessageSelector'
import { InputContainer } from './REPL/InputContainer'
import { Message } from '../components/Message'
import { MessageResponse } from '../components/MessageResponse'
import { Spinner } from '../components/Spinner'
import { MessageContainer } from './REPL/MessageContainer'
import { CostThresholdDialog } from '../components/CostThresholdDialog'
import { TaskStatusDisplay } from '../components/TaskStatusDisplay'
import { useApiKeyVerification } from '../hooks/useApiKeyVerification'
import { useCancelRequest } from '../hooks/useCancelRequest'
import { useLogMessages } from '../hooks/useLogMessages'
import { useLogStartupTime } from '../hooks/useLogStartupTime'
import { useCostSummary } from '../cost-tracker'
import { getTotalCost } from '../cost-tracker'
import { logEvent } from '../services/featureFlags'
import {
  setMessagesGetter,
  setMessagesSetter,
  setModelConfigChangeHandler,
} from '../messages'
import { clearTerminal } from '../utils/terminal'
import { normalizeMessages, isNotEmptyMessage, normalizeMessagesForAPI, getUnresolvedToolUseIDs, getInProgressToolUseIDs, getErroredToolUseMessages } from '../utils/messages'
import { getGlobalConfig } from '../utils/config'
import { getOriginalCwd } from '../utils/state'

// Import extracted services and components
import { REPLStateManager } from './REPL/REPLStateManager'
import { SignalHandlerService } from './REPL/SignalHandlerService'
import { QueryCoordinatorService } from './REPL/QueryCoordinatorService'
import { MessageRenderer } from './REPL/MessageRenderer'
import { ToolUIRenderer } from './REPL/ToolUIManager'
import { DialogManager } from './REPL/DialogManager'
import {
  type REPLCoreProps,
  type REPLState,
  type ToolJSXState,
  type QueryContext,
  type MessageRendererProps,
  type ToolUIManagerProps,
  type DialogManagerProps
} from './REPL.types'

export function REPL({
  commands,
  safeMode,
  debug = false,
  initialForkNumber = 0,
  initialPrompt,
  messageLogName,
  shouldShowPromptInput,
  tools,
  verbose: verboseFromCLI,
  initialMessages,
  mcpClients = [],
  isDefaultModel = true,
  onHideInputBox,
}: REPLCoreProps): React.ReactNode {
  // TODO: probably shouldn't re-read config from file synchronously on every keystroke
  const verbose = verboseFromCLI ?? getGlobalConfig().verbose

  // Initialize state manager
  const stateManager = useMemo(() =>
    new REPLStateManager(initialMessages, initialPrompt, messageLogName, initialForkNumber),
    [initialMessages, initialPrompt, messageLogName, initialForkNumber]
  )

  const [state, setState] = useState<REPLState>(stateManager.getState())
  const [inputValue, setInputValue] = useState<string>(initialPrompt ?? '')
  const [cursorOffset, setCursorOffset] = useState<number>(initialPrompt?.length ?? 0)

  // Subscribe to state changes (excluding input value)
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState: REPLState) => {
      setState(newState)
    })
    return unsubscribe
  }, [stateManager])

  // Subscribe to input state changes separately
  useEffect(() => {
    const unsubscribe = stateManager.subscribeToInputState((inputState) => {
      setInputValue(inputState.value)
      setCursorOffset(inputState.offset)
    })
    return unsubscribe
  }, [stateManager])

  // Create direct access to input value
  const getInputValue = useCallback(() => {
    return inputValue
  }, [inputValue])

  const setInputValueCallback = useCallback((value: string) => {
    stateManager.setInputValue(value)
  }, [stateManager])

  // Initialize query coordinator
  const queryCoordinator = useMemo(() => QueryCoordinatorService.getInstance(), [])

  // Refs
  const readFileTimestamps = useRef<{ [filename: string]: number }>({})

  // Hooks
  const { status: apiKeyStatus, reverify } = useApiKeyVerification()

  const onCancel = useCallback(() => {
    if (!state.isLoading) {
      return
    }
    stateManager.setLoading(false)
    if (state.toolUseConfirm) {
      // Tool use confirm handles the abort signal itself
      state.toolUseConfirm.onAbort()
    } else {
      // Wrap abort in try-catch to prevent error display on user interrupt
      try {
        state.abortController?.abort()
      } catch (e) {
        // Silently handle abort errors - this is expected behavior
      }
    }
  }, [state.isLoading, state.toolUseConfirm, state.abortController, stateManager])

  useCancelRequest(
    stateManager.setToolJSX.bind(stateManager),
    stateManager.setToolUseConfirm.bind(stateManager),
    stateManager.setBinaryFeedbackContext.bind(stateManager),
    onCancel,
    state.isLoading,
    state.isMessageSelectorVisible,
    state.abortController?.signal,
  )

  // Handle fork conversation
  useEffect(() => {
    if (state.forkConvoWithMessagesOnTheNextRender) {
      stateManager.incrementForkNumber()
      stateManager.setForkConvoWithMessagesOnTheNextRender(null)
      stateManager.setMessages(state.forkConvoWithMessagesOnTheNextRender)
    }
  }, [state.forkConvoWithMessagesOnTheNextRender, stateManager])

  // Handle cost threshold
  useEffect(() => {
    const totalCost = getTotalCost()
    if (totalCost >= 5 /* $5 */ && !state.showCostDialog && !state.haveShownCostDialog) {
      logEvent('tengu_cost_threshold_reached', {})
      stateManager.setShowCostDialog(true)
    }
  }, [state.messages, state.showCostDialog, state.haveShownCostDialog, stateManager])

  // Handle initial prompt
  const handleInit = useCallback(async () => {
    reverify()

    if (!initialPrompt) {
      return
    }

    await queryCoordinator.handleInitialPrompt(
      initialPrompt,
      commands,
      state.forkNumber,
      messageLogName,
      tools,
      verbose,
      state.messages,
      stateManager.setMessages.bind(stateManager),
      stateManager.setLoading.bind(stateManager),
      stateManager.setAbortController.bind(stateManager),
      stateManager.setToolJSX.bind(stateManager),
      stateManager.setForkConvoWithMessagesOnTheNextRender.bind(stateManager),
      readFileTimestamps.current,
      stateManager.getBinaryFeedbackResponse.bind(stateManager),
    )

    stateManager.setHaveShownCostDialog(
      getGlobalConfig().hasAcknowledgedCostThreshold || false,
    )
  }, [
    initialPrompt,
    reverify,
    queryCoordinator,
    commands,
    state.forkNumber,
    messageLogName,
    tools,
    verbose,
    state.messages,
    stateManager,
  ])

  // Handle query
  const handleQuery = useCallback(async (newMessages: any[], passedAbortController?: AbortController) => {
    const context: QueryContext = {
      commands,
      forkNumber: state.forkNumber,
      messageLogName,
      tools,
      verbose,
      safeMode,
      maxThinkingTokens: 0, // This would be calculated
    }

    await queryCoordinator.executeQuery(
      newMessages,
      context,
      state.messages,
      stateManager.setMessages.bind(stateManager),
      stateManager.setLoading.bind(stateManager),
      stateManager.setAbortController.bind(stateManager),
      stateManager.setToolJSX.bind(stateManager),
      stateManager.getBinaryFeedbackResponse.bind(stateManager),
      passedAbortController,
    )
  }, [
    commands,
    state.forkNumber,
    messageLogName,
    tools,
    verbose,
    safeMode,
    state.messages,
    queryCoordinator,
    stateManager,
  ])

  // Register services
  useCostSummary()
  useLogMessages(state.messages, messageLogName, state.forkNumber)
  useLogStartupTime()

  // Register messages getter and setter
  useEffect(() => {
    const getMessages = () => state.messages
    setMessagesGetter(getMessages)
    setMessagesSetter(stateManager.setMessages.bind(stateManager))
  }, [state.messages, stateManager])

  // Register model config change handler
  useEffect(() => {
    setModelConfigChangeHandler(() => {
      stateManager.incrementForkNumber()
    })
  }, [stateManager])

  // Initial load
  useEffect(() => {
    handleInit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Setup signal handling
  useEffect(() => {
    const cleanup = SignalHandlerService.setupSignalHandling(
      stateManager.setToolJSX.bind(stateManager),
      stateManager.setToolUseConfirm.bind(stateManager),
      stateManager.setBinaryFeedbackContext.bind(stateManager),
      state.isMessageSelectorVisible,
      stateManager.setMessageSelectorVisible.bind(stateManager),
      state.toolUseConfirm,
      state.binaryFeedbackContext,
      state.toolJSX,
      stateManager.setToolJSX.bind(stateManager),
      () => {
        stateManager.setShouldHideInputBox(true)
        if (onHideInputBox) {
          onHideInputBox()
        }
      }
    )

    return cleanup
  }, [
    state.isMessageSelectorVisible,
    state.toolUseConfirm,
    state.binaryFeedbackContext,
    state.toolJSX,
    stateManager,
    onHideInputBox,
  ])

  // Memoized values
  const normalizedMessages = useMemo(
    () => normalizeMessages(state.messages).filter(isNotEmptyMessage),
    [state.messages],
  )

  const unresolvedToolUseIDs = useMemo(
    () => getUnresolvedToolUseIDs(normalizedMessages),
    [normalizedMessages],
  )

  const inProgressToolUseIDs = useMemo(
    () => getInProgressToolUseIDs(normalizedMessages),
    [normalizedMessages],
  )

  const erroredToolUseIDs = useMemo(
    () => new Set(
      getErroredToolUseMessages(normalizedMessages).map(
        _ => (_.message.content[0] as any).id,
      ),
    ),
    [normalizedMessages],
  )

  // Message renderer props
  const messageRendererProps: MessageRendererProps = {
    messages: normalizedMessages,
    tools,
    verbose,
    debug,
    forkNumber: state.forkNumber,
    mcpClients,
    isDefaultModel,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    unresolvedToolUseIDs,
    toolJSX: state.toolJSX,
    toolUseConfirm: state.toolUseConfirm,
    isMessageSelectorVisible: state.isMessageSelectorVisible,
  }
const messagesJSX = useMemo(() => <MessageContainer {...messageRendererProps} />, [
  normalizedMessages, tools, verbose, debug, state.forkNumber,
  mcpClients, isDefaultModel, state.toolJSX, state.toolUseConfirm, state.isMessageSelectorVisible,
  erroredToolUseIDs, inProgressToolUseIDs, unresolvedToolUseIDs
]);

  // Tool UI manager props
  const toolUIManagerProps: ToolUIManagerProps = {
    toolJSX: state.toolJSX,
    toolUseConfirm: state.toolUseConfirm,
    binaryFeedbackContext: state.binaryFeedbackContext,
    isMessageSelectorVisible: state.isMessageSelectorVisible,
    showingCostDialog: !state.isLoading && state.showCostDialog,
    verbose,
    normalizedMessages,
    tools,
    debug,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    unresolvedToolUseIDs,
  }

  // Dialog manager props
  const dialogManagerProps: DialogManagerProps = {
    showCostDialog: state.showCostDialog,
    haveShownCostDialog: state.haveShownCostDialog,
    isLoading: state.isLoading,
    verbose,
  }

  return (
    <PermissionProvider isBypassPermissionsModeAvailable={!safeMode} children={undefined}>
      <ModeIndicator />
      <TaskStatusDisplay />
      {messagesJSX}
      
      {/* 在任务执行时显示Spinner */}
      {state.isLoading && !state.toolJSX && !state.toolUseConfirm && (
        <Box marginTop={1}>
          <Spinner />
        </Box>
      )}
      
      <ToolUIRenderer toolUIManagerProps={toolUIManagerProps} />
      <DialogManager {...dialogManagerProps} />

      {!state.toolUseConfirm &&
        !state.toolJSX?.shouldHidePromptInput &&
        shouldShowPromptInput &&
        !state.isMessageSelectorVisible &&
        !state.binaryFeedbackContext &&
        !(!state.isLoading && state.showCostDialog) &&
        !state.shouldHideInputBox && (
          <>
            <InputContainer
              commands={commands}
              forkNumber={state.forkNumber}
              messageLogName={messageLogName}
              tools={tools}
              isDisabled={apiKeyStatus === 'invalid'}
              isLoading={state.isLoading}
              onQuery={handleQuery}
              debug={debug}
              verbose={verbose}
              messages={state.messages}
              setToolJSX={stateManager.setToolJSX.bind(stateManager)}
              onAutoUpdaterResult={stateManager.setAutoUpdaterResult.bind(stateManager)}
              autoUpdaterResult={state.autoUpdaterResult}
              input={getInputValue()}
              onInputChange={setInputValueCallback}
              cursorOffset={cursorOffset}
              onCursorOffsetChange={setCursorOffset}
              mode={state.inputMode}
              onModeChange={stateManager.setInputMode.bind(stateManager)}
              submitCount={state.submitCount}
              onSubmitCountChange={stateManager.setSubmitCount.bind(stateManager)}
              setIsLoading={stateManager.setLoading.bind(stateManager)}
              setAbortController={stateManager.setAbortController.bind(stateManager)}
              onShowMessageSelector={() =>
                stateManager.setMessageSelectorVisible(prev => !prev)
              }
              setForkConvoWithMessagesOnTheNextRender={
                stateManager.setForkConvoWithMessagesOnTheNextRender.bind(stateManager)
              }
              readFileTimestamps={readFileTimestamps.current}
              abortController={state.abortController}
              onModelChange={() => stateManager.incrementForkNumber()}
              onExit={() => stateManager.setShouldHideInputBox(true)}
            />
          </>
        )}
      {state.isMessageSelectorVisible && (
        <MessageSelector
          erroredToolUseIDs={erroredToolUseIDs}
          unresolvedToolUseIDs={unresolvedToolUseIDs}
          messages={normalizeMessagesForAPI(state.messages)}
          onSelect={async message => {
            stateManager.setMessageSelectorVisible(false)

            // If the user selected the current prompt, do nothing
            if (!state.messages.includes(message)) {
              return
            }

            // Cancel tool use calls/requests
            onCancel()

            // Hack: make sure the "Interrupted by user" message is
            // rendered in response to the cancellation. Otherwise,
            // the screen will be cleared but there will remain a
            // vestigial "Interrupted by user" message at the top.
            setImmediate(async () => {
              // Clear messages, and re-render
              await clearTerminal()
              stateManager.setMessages([])
              stateManager.setForkConvoWithMessagesOnTheNextRender(
                state.messages.slice(0, state.messages.indexOf(message)),
              )

              // Populate/reset the prompt input
              if (typeof message.message.content === 'string') {
                stateManager.setInputValue(message.message.content)
              }
            })
          }}
          onEscape={() => stateManager.setMessageSelectorVisible(false)}
          tools={tools}
        />
      )}
      {/** Fix occasional rendering artifact */}
      <Newline />
    </PermissionProvider>
  )
}