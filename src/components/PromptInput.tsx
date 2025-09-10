import { Box, Text, useInput, Static } from 'ink'
import { sample } from 'lodash-es'
import { getExampleCommands } from '../utils/exampleCommands'
import * as React from 'react'
import { type Message } from '../query'
import { processUserInput } from '../utils/messages'
import { useArrowKeyHistory } from '../hooks/useArrowKeyHistory'
import { useUnifiedCompletion } from '../hooks/useUnifiedCompletion'
import { addToHistory } from '../history'
import TextInput from './TextInput'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { countTokens, countTokensWithContext } from '../utils/tokens'
import { calculateContextStatistics, getContextStatus, type ContextStatistics } from '../utils/contextStatistics'
import { SentryErrorBoundary } from './SentryErrorBoundary'
import { AutoUpdater } from './AutoUpdater'
import type { AutoUpdaterResult } from '../utils/autoUpdater'
import type { Command } from '../commands'
import type { SetToolJSXFn, Tool } from '../Tool'
import { TokenWarning } from './TokenWarning'
import { useTerminalSize } from '../hooks/useTerminalSize'
import { getTheme } from '../utils/theme'
import { getModelManager, reloadModelManager, getCurrentModelContextLimit } from '../utils/model'
import { saveGlobalConfig } from '../utils/config'
import { setTerminalTitle } from '../utils/terminal'
import terminalSetup, {
  isShiftEnterKeyBindingInstalled,
  handleHashCommand,
} from '../commands/terminalSetup'
import { usePermissionContext } from '../context/PermissionContext'
import { CompletionSuggestions } from './CompletionSuggestions'

// Async function to interpret the '#' command input using AI
async function interpretHashCommand(input: string): Promise<string> {
  // Use the AI to interpret the input
  try {
    const { queryQuick } = await import('../services/claude')

    // Create a prompt for the model to interpret the hash command
    const systemPrompt = [
      "You're helping the user structure notes that will be added to their KODING.md file.",
      "Format the user's input into a well-structured note that will be useful for later reference.",
      'Add appropriate markdown formatting, headings, bullet points, or other structural elements as needed.',
      'The goal is to transform the raw note into something that will be more useful when reviewed later.',
      'You should keep the original meaning but make the structure clear.',
    ]

    // Send the request to the AI
    const result = await queryQuick({
      systemPrompt,
      userPrompt: `Transform this note for KODING.md: ${input}`,
    })

    // Extract the content from the response
    if (typeof result.message.content === 'string') {
      return result.message.content
    } else if (Array.isArray(result.message.content)) {
      return result.message.content
        .filter(block => block.type === 'text')
        .map(block => (block.type === 'text' ? block.text : ''))
        .join('\n')
    }

    return `# ${input}\n\n_Added on ${new Date().toLocaleString()}_`
  } catch (e) {
    // If interpretation fails, return the input with minimal formatting
    return `# ${input}\n\n_Added on ${new Date().toLocaleString()}_`
  }
}

type Props = {
  commands: Command[]
  forkNumber: number
  messageLogName: string
  isDisabled: boolean
  isLoading: boolean
  onQuery: (
    newMessages: Message[],
    abortController?: AbortController,
  ) => Promise<void>
  debug: boolean
  verbose: boolean
  messages: Message[]
  setToolJSX: SetToolJSXFn
  onAutoUpdaterResult: (result: AutoUpdaterResult) => void
  autoUpdaterResult: AutoUpdaterResult | null
  tools: Tool[]
  input: string
  onInputChange: (value: string) => void
  mode: 'bash' | 'prompt' | 'koding'
  onModeChange: (mode: 'bash' | 'prompt' | 'koding') => void
  submitCount: number
  onSubmitCountChange: (updater: (prev: number) => number) => void
  setIsLoading: (isLoading: boolean) => void
  setAbortController: (abortController: AbortController | null) => void
  onShowMessageSelector: () => void
  setForkConvoWithMessagesOnTheNextRender: (
    forkConvoWithMessages: Message[],
  ) => void
  readFileTimestamps: { [filename: string]: number }
  abortController: AbortController | null
  onModelChange?: () => void
  onExit?: () => void
  cursorOffset?: number
  onCursorOffsetChange?: (offset: number) => void
}

function getPastedTextPrompt(text: string): string {
  const newlineCount = (text.match(/\r\n|\r|\n/g) || []).length
  return `[Pasted text +${newlineCount} lines] `
}
function PromptInput({
  commands,
  forkNumber,
  messageLogName,
  isDisabled,
  isLoading,
  onQuery,
  debug,
  verbose,
  messages,
  setToolJSX,
  onAutoUpdaterResult,
  autoUpdaterResult,
  tools,
  input,
  onInputChange,
  mode,
  onModeChange,
  submitCount,
  onSubmitCountChange,
  setIsLoading,
  abortController,
  setAbortController,
  onShowMessageSelector,
  setForkConvoWithMessagesOnTheNextRender,
  readFileTimestamps,
  onModelChange,
  onExit,
  cursorOffset: cursorOffsetProp,
  onCursorOffsetChange,
}: Props): React.ReactNode {
  const [isAutoUpdating, setIsAutoUpdating] = useState(false)
  const [exitMessage, setExitMessage] = useState<{
    show: boolean
    key?: string
  }>({ show: false })
  const [message, setMessage] = useState<{ show: boolean; text?: string }>({
    show: false,
  })
  const [modelSwitchMessage, setModelSwitchMessage] = useState<{
    show: boolean
    text?: string
  }>({
    show: false,
  })
  const [pastedImage, setPastedImage] = useState<string | null>(null)
  const [placeholder, setPlaceholder] = useState('')
  const [pastedText, setPastedText] = useState<string | null>(null)

  // Permission context for mode management
  const { cycleMode, currentMode } = usePermissionContext()

  // useEffect(() => {
  //   getExampleCommands().then(commands => {
  //     setPlaceholder(`Try "${sample(commands)}"`)
  //   })
  // }, [])
  const { columns, rows } = useTerminalSize()

  const commandWidth = useMemo(
    () => Math.max(...commands.map(cmd => cmd.userFacingName().length)) + 5,
    [commands],
  )

  // Unified completion system - one hook to rule them all (now with terminal behavior)
  const {
    suggestions,
    selectedIndex,
    isActive: completionActive,
    emptyDirMessage,
  } = useUnifiedCompletion({
    input,
    cursorOffset: cursorOffsetProp,
    onInputChange,
    setCursorOffset: onCursorOffsetChange,
    commands,
    onSubmit,
  })
  // Get theme early for memoized rendering
  const theme = getTheme()

  // 移除旧的renderedSuggestions，现在由独立的CompletionSuggestions组件处理

  const onChange = useCallback(
    (value: string) => {
      if (value.startsWith('!')) {
        onModeChange('bash')
        return
      }
      if (value.startsWith('#')) {
        onModeChange('koding')
        return
      }
      onInputChange(value)
    },
    [onModeChange, onInputChange],
  )

  // Handle Tab key model switching with simple context check
  const handleQuickModelSwitch = useCallback(async () => {
    const modelManager = getModelManager()
    const currentTokens = countTokens(messages)

    const switchResult = modelManager.switchToNextModel(currentTokens)

    if (switchResult.success && switchResult.modelName) {
      // Successful switch
      onSubmitCountChange(prev => prev + 1)
      const newModel = modelManager.getModel('main')
      setModelSwitchMessage({
        show: true,
        text: `✅ Switched to ${switchResult.modelName} (${newModel?.provider || 'Unknown'} | Model: ${newModel?.modelName || 'N/A'})`,
      })
      setTimeout(() => setModelSwitchMessage({ show: false }), 3000)
    } else if (switchResult.blocked && switchResult.message) {
      // Context overflow - show detailed message
      setModelSwitchMessage({
        show: true,
        text: switchResult.message,
      })
      setTimeout(() => setModelSwitchMessage({ show: false }), 5000)
    } else {
      // No other models available or other error
      setModelSwitchMessage({
        show: true,
        text:
          switchResult.message ||
          '⚠️ No other models configured. Use /model to add more models',
      })
      setTimeout(() => setModelSwitchMessage({ show: false }), 3000)
    }
  }, [onSubmitCountChange, messages])

  const { resetHistory, onHistoryUp, onHistoryDown } = useArrowKeyHistory(
    (value: string, mode: 'bash' | 'prompt' | 'koding') => {
      onChange(value)
      onModeChange(mode)
    },
    input,
  )

  // Only use history navigation when there are no suggestions
  const handleHistoryUp = () => {
    if (!completionActive) {
      onHistoryUp()
    }
  }

  const handleHistoryDown = () => {
    if (!completionActive) {
      onHistoryDown()
    }
  }

  async function onSubmit(input: string, isSubmittingSlashCommand = false) {
    // Special handling for "put a verbose summary" and similar action prompts in koding mode
    if (
      (mode === 'koding' || input.startsWith('#')) &&
      input.match(/^(#\s*)?(put|create|generate|write|give|provide)/i)
    ) {
      try {
        // Store the original input for history
        const originalInput = input

        // Strip the # prefix if present
        const cleanInput = mode === 'koding' ? input : input.substring(1).trim()

        // Add to history and clear input field
        addToHistory(mode === 'koding' ? `#${input}` : input)
        onInputChange('')

        // Create additional context to inform Claude this is for KODING.md
        const kodingContext =
          'The user is using Koding mode. Format your response as a comprehensive, well-structured document suitable for adding to AGENTS.md. Use proper markdown formatting with headings, lists, code blocks, etc. The response should be complete and ready to add to AGENTS.md documentation.'

        // Switch to prompt mode but tag the submission for later capture
        onModeChange('prompt')

        // 🔧 Fix Koding mode: clean up previous state
        if (abortController) {
          abortController.abort()
        }
        setIsLoading(false)
        await new Promise(resolve => setTimeout(resolve, 0))

        // Set loading state - AbortController now created in onQuery
        setIsLoading(true)

        // Process as a normal user input but with special handling
        const processedMessages = await processUserInput(
          cleanInput,
          'prompt', // Use prompt mode for processing
          setToolJSX,
          {
            options: {
              commands,
              forkNumber,
              messageLogName,
              tools,
              verbose,
              maxThinkingTokens: 0,
              // Add context flag for koding mode
              isKodingRequest: true,
              kodingContext,
              messages, // Pass the messages array to the context
            },
            messageId: undefined,
            abortController: abortController || new AbortController(), // Temporary controller, actual one created in onQuery
            readFileTimestamps,
            setForkConvoWithMessagesOnTheNextRender,
          },
          pastedImage ?? null,
        )

        // Send query and capture response
        if (processedMessages.length) {
          await onQuery(processedMessages)

          // After query completes, the last message should be Claude's response
          // We'll set up a one-time listener to capture and save Claude's response
          // This will be handled by the REPL component or message handler
        }

        return
      } catch (e) {
        // If something fails, log the error
        console.error('Error processing Koding request:', e)
      }
    }

    // If in koding mode or input starts with '#', interpret it using AI before appending to AGENTS.md
    else if (mode === 'koding' || input.startsWith('#')) {
      try {
        // Strip the # if we're in koding mode and the user didn't type it (since it's implied)
        const contentToInterpret =
          mode === 'koding' && !input.startsWith('#')
            ? input.trim()
            : input.substring(1).trim()

        const interpreted = await interpretHashCommand(contentToInterpret)
        handleHashCommand(interpreted)
      } catch (e) {
        // If interpretation fails, log the error
      }
      onInputChange('')
      addToHistory(mode === 'koding' ? `#${input}` : input)
      onModeChange('prompt')
      return
    }
    if (input === '') {
      return
    }
    if (isDisabled) {
      return
    }
    if (isLoading) {
      return
    }

    // Handle Enter key when completions are active
    // If there are suggestions showing, Enter should complete the selection, not send the message
    if (suggestions.length > 0 && completionActive) {
      // The completion is handled by useUnifiedCompletion hook
      // Just return to prevent message sending
      return
    }

    // Handle exit commands
    if (['exit', 'quit', ':q', ':q!', ':wq', ':wq!'].includes(input.trim())) {
      // Call onExit callback if provided before exiting
      if (onExit) {
        onExit()
      }
      exit()
    }

    let finalInput = input
    if (pastedText) {
      // Create the prompt pattern that would have been used for this pasted text
      const pastedPrompt = getPastedTextPrompt(pastedText)
      if (finalInput.includes(pastedPrompt)) {
        finalInput = finalInput.replace(pastedPrompt, pastedText)
      } // otherwise, ignore the pastedText if the user has modified the prompt
    }
    onInputChange('')
    onModeChange('prompt')
    // Suggestions are now handled by unified completion
    setPastedImage(null)
    setPastedText(null)
    onSubmitCountChange(_ => _ + 1)

    setIsLoading(true)

    const newAbortController = new AbortController()
    setAbortController(newAbortController)

    const processedMessages = await processUserInput(
      finalInput,
      mode,
      setToolJSX,
      {
        options: {
          commands,
          forkNumber,
          messageLogName,
          tools,
          verbose,
          maxThinkingTokens: 0,
          messages, // Pass the messages array to the context
        },
        messageId: undefined,
        abortController: newAbortController,
        readFileTimestamps,
        setForkConvoWithMessagesOnTheNextRender,
      },
      pastedImage ?? null,
    )

    if (processedMessages.length) {
      onQuery(processedMessages, newAbortController)
    } else {
      // Local JSX commands
      addToHistory(input)
      resetHistory()
      return
    }

    for (const message of processedMessages) {
      if (message.type === 'user') {
        const inputToAdd = mode === 'bash' ? `!${input}` : input
        addToHistory(inputToAdd)
        resetHistory()
      }
    }
  }

  function onImagePaste(image: string) {
    onModeChange('prompt')
    setPastedImage(image)
  }

  function onTextPaste(rawText: string) {
    // Replace any \r with \n first to match useTextInput's conversion behavior
    const text = rawText.replace(/\r/g, '\n')

    // Get prompt with newline count
    const pastedPrompt = getPastedTextPrompt(text)

    // Update the input with a visual indicator that text has been pasted
    const newInput =
      input.slice(0, cursorOffsetProp) + pastedPrompt + input.slice(cursorOffsetProp)
    onInputChange(newInput)

    // Update cursor position to be after the inserted indicator
    onCursorOffsetChange?.(cursorOffsetProp + pastedPrompt.length)

    // Still set the pastedText state for actual submission
    setPastedText(text)
  }

  useInput((inputChar, key) => {
    // For bash mode, only exit when deleting the last character (which would be the '!' character)
    if (mode === 'bash' && (key.backspace || key.delete)) {
      // Check the current input state, not the inputChar parameter
      // If current input is empty, we're about to delete the '!' character, so exit bash mode
      if (input === '') {
        onModeChange('prompt')
      }
      return
    }

    // For koding mode, only exit when deleting the last character (which would be the '#' character)
    if (mode === 'koding' && (key.backspace || key.delete)) {
      // Check the current input state, not the inputChar parameter
      // If current input is empty, we're about to delete the '#' character, so exit koding mode
      if (input === '') {
        onModeChange('prompt')
      }
      return
    }

    // For other modes, keep the original behavior
    if (inputChar === '' && (key.escape || key.backspace || key.delete)) {
      onModeChange('prompt')
    }
    // esc is a little overloaded:
    // - when we're loading a response, it's used to cancel the request
    // - otherwise, it's used to show the message selector
    // - when double pressed, it's used to clear the input
    if (key.escape && messages.length > 0 && !input && !isLoading) {
      onShowMessageSelector()
    }

    // Shift+Tab for mode cycling (matching original Claude Code implementation)
    if (key.shift && key.tab) {
      cycleMode()
      return true // Explicitly handled
    }

    return false // Not handled, allow other hooks
  })

  const textInputColumns = useTerminalSize().columns - 6
  const [contextStats, setContextStats] = useState<ContextStatistics>({
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    percentUsed: 0,
    contextLimit: 200000 // This will be updated by calculateContextStatistics
  })

  // Update token usage when messages or tools change
  useEffect(() => {
    let isCancelled = false

    // Use the more accurate token counting that includes context
    const contextLimit = getCurrentModelContextLimit()
    calculateContextStatistics(messages, tools, contextLimit).then(stats => {
      if (!isCancelled) {
        setContextStats(stats)
      }
    }).catch(() => {
      // Fallback to simple counting if there's an error
      if (!isCancelled) {
        const tokens = countTokens(messages)
        setContextStats({
          totalTokens: tokens,
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          percentUsed: 0,
          contextLimit: contextLimit
        })
      }
    })

    return () => {
      isCancelled = true
    }
  }, [messages, tools])
  const tokenUsage = contextStats.totalTokens

  // 🔧 Fix: Track model ID changes to detect external config updates
  const modelManager = getModelManager()
  const currentModelId = (modelManager.getModel('main') as any)?.id || null

  const modelInfo = useMemo(() => {
    // Force fresh ModelManager instance to detect config changes
    const freshModelManager = getModelManager()
    const currentModel = freshModelManager.getModel('main')
    if (!currentModel) {
      return null
    }

    return {
      name: currentModel.modelName, // 🔧 Fix: Use actual model name, not display name
      id: (currentModel as any).id, // 添加模型ID用于调试
      provider: currentModel.provider, // 添加提供商信息
      contextLength: contextStats.contextLimit,
      currentTokens: contextStats.totalTokens,
    }
  }, [contextStats, modelSwitchMessage.show, submitCount, currentModelId]) // Track model ID to detect config changes

  return (
    <Box flexDirection="column">
      {/* Model info in top-right corner - 简化的模型信息显示 */}
      {modelInfo && (
        <Box justifyContent="flex-end" marginBottom={1}>
          <Text dimColor>
            {modelInfo.name} ({modelInfo.provider})
            {Math.round(modelInfo.currentTokens / 1000)}k/
            {Math.round(modelInfo.contextLength / 1000)}k
          </Text>
        </Box>
      )}

      <Box
        alignItems="flex-start"
        justifyContent="flex-start"
        borderColor={
          mode === 'bash'
            ? theme.bashBorder
            : mode === 'koding'
              ? theme.koding
              : theme.secondaryBorder
        }
        borderDimColor
        borderStyle="round"
        marginTop={1}
        width="100%"
      >
        <Box
          alignItems="flex-start"
          alignSelf="flex-start"
          flexWrap="nowrap"
          justifyContent="flex-start"
          width={3}
        >
          {mode === 'bash' ? (
            <Text color={theme.bashBorder}>&nbsp;!&nbsp;</Text>
          ) : mode === 'koding' ? (
            <Text color={theme.koding}>&nbsp;#&nbsp;</Text>
          ) : (
            <Text color={isLoading ? theme.secondaryText : undefined}>
              &nbsp;&gt;&nbsp;
            </Text>
          )}
        </Box>
        <Box paddingRight={1}>
          <TextInput
            multiline
            onSubmit={onSubmit}
            onChange={onChange}
            value={input}
            onHistoryUp={handleHistoryUp}
            onHistoryDown={handleHistoryDown}
            onHistoryReset={() => resetHistory()}
            placeholder={submitCount > 0 ? undefined : placeholder}
            onExit={() => process.exit(0)}
            onExitMessage={(show, key) => setExitMessage({ show, key })}
            onMessage={(show, text) => setMessage({ show, text })}
            onImagePaste={onImagePaste}
            columns={textInputColumns}
            isDimmed={isDisabled || isLoading}
            disableCursorMovementForUpDownKeys={completionActive}
            cursorOffset={cursorOffsetProp}
            onChangeCursorOffset={onCursorOffsetChange}
            onPaste={onTextPaste}
            onSpecialKey={(input, key) => {
              // Handle Shift+M for model switching
              if (key.shift && (input === 'M' || input === 'm')) {
                handleQuickModelSwitch()
                return true // Prevent the 'M' from being typed
              }
              return false
            }}
          />
        </Box>
      </Box>
      {!completionActive && suggestions.length === 0 && (
        <Box
          flexDirection="row"
          justifyContent="space-between"
          paddingX={2}
          paddingY={0}
        >
          <Box justifyContent="flex-start" gap={1}>
            {exitMessage.show ? (
              <Text dimColor>Press {exitMessage.key} again to exit</Text>
            ) : message.show ? (
              <Text dimColor>{message.text}</Text>
            ) : modelSwitchMessage.show ? (
              <Text color={theme.success}>{modelSwitchMessage.text}</Text>
            ) : (
              <>
                <Text
                  color={mode === 'bash' ? theme.bashBorder : undefined}
                  dimColor={mode !== 'bash'}
                >
                  ! for bash mode
                </Text>
                <Text
                  color={mode === 'koding' ? theme.koding : undefined}
                  dimColor={mode !== 'koding'}
                >
                  · # for AGENTS.md
                </Text>
                <Text dimColor>
                  · / for commands · @ for files · % for agents · shift+m to switch model · esc to undo
                </Text>
              </>
            )}
          </Box>
          <SentryErrorBoundary children={
            <Box justifyContent="flex-end" gap={1}>
              {!autoUpdaterResult &&
                !isAutoUpdating &&
                !debug &&
                contextStats.percentUsed < 60 && (
                  <Text dimColor>
                    {terminalSetup.isEnabled &&
                      isShiftEnterKeyBindingInstalled()
                      ? 'shift + ⏎ for newline'
                      : '\\⏎ for newline'}
                  </Text>
                )}
              <TokenWarning tokenUsage={tokenUsage} contextLimit={contextStats.contextLimit} />
              {/* <AutoUpdater
                debug={debug}
                onAutoUpdaterResult={onAutoUpdaterResult}
                autoUpdaterResult={autoUpdaterResult}
                isUpdating={isAutoUpdating}
                onChangeIsUpdating={setIsAutoUpdating}
              /> */}
            </Box>
          } />
        </Box>
      )}
      {/* 独立的补全建议组件，避免整个UI重新渲染 */}
      <CompletionSuggestions
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        emptyDirMessage={emptyDirMessage}
        input={input} // 传递输入作为key的一部分，确保输入变化时完全重新渲染
      />
    </Box>
  )
}

export default memo(PromptInput)

function exit(): never {
  setTerminalTitle('')
  // Clear the terminal line before exiting
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[K')
  }
  process.exit(0)
}
