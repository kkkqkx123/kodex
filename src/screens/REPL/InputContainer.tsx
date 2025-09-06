import React, { memo, useCallback, useEffect, useState } from 'react'
import PromptInput from '../../components/PromptInput'
import { type Command } from '../../commands'
import { type SetToolJSXFn, type Tool } from '../../Tool'
import { type AutoUpdaterResult } from '../../utils/autoUpdater'
import { type Message } from '../../query.js'

interface InputContainerProps {
  commands: Command[]
  forkNumber: number
  messageLogName: string
  tools: Tool[]
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

export const InputContainer = memo(({
  commands,
  forkNumber,
  messageLogName,
  tools,
  isDisabled,
  isLoading,
  onQuery,
  debug,
  verbose,
  messages,
  setToolJSX,
  onAutoUpdaterResult,
  autoUpdaterResult,
  input,
  onInputChange,
  mode,
  onModeChange,
  submitCount,
  onSubmitCountChange,
  setIsLoading,
  setAbortController,
  onShowMessageSelector,
  setForkConvoWithMessagesOnTheNextRender,
  readFileTimestamps,
  abortController,
  onModelChange,
  onExit,
  cursorOffset,
  onCursorOffsetChange,
}: InputContainerProps) => {
  // 只有当输入相关的 props 改变时才重新渲染
  return (
    <PromptInput
      commands={commands}
      forkNumber={forkNumber}
      messageLogName={messageLogName}
      tools={tools}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onQuery={onQuery}
      debug={debug}
      verbose={verbose}
      messages={messages}
      setToolJSX={setToolJSX}
      onAutoUpdaterResult={onAutoUpdaterResult}
      autoUpdaterResult={autoUpdaterResult}
      input={input}
      onInputChange={onInputChange}
      mode={mode}
      onModeChange={onModeChange}
      submitCount={submitCount}
      onSubmitCountChange={onSubmitCountChange}
      setIsLoading={setIsLoading}
      setAbortController={setAbortController}
      onShowMessageSelector={onShowMessageSelector}
      setForkConvoWithMessagesOnTheNextRender={setForkConvoWithMessagesOnTheNextRender}
      readFileTimestamps={readFileTimestamps}
      abortController={abortController}
      onModelChange={onModelChange}
      onExit={onExit}
      cursorOffset={cursorOffset}
      onCursorOffsetChange={onCursorOffsetChange}
    />
  )
})

InputContainer.displayName = 'InputContainer'