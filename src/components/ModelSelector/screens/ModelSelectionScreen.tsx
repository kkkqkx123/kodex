import React from 'react'
import { Box, Text } from 'ink'
import { Select } from '../../CustomSelect/select'
import TextInput from '../../TextInput'
import { Newline } from 'ink'

type ModelSelectionScreenProps = {
  selectedProvider: string
  availableModels: Array<{ model: string; [key: string]: any }>
  modelOptions: Array<{ label: string; value: string }>
  handleModelSelection: (model: string) => void
  modelSearchQuery: string
  handleModelSearchChange: (value: string) => void
  modelSearchCursorOffset: number
  handleModelSearchCursorOffsetChange: (offset: number) => void
  getProviderLabel: (provider: string, modelCount: number) => string
  exitState: { pending: boolean; keyName: string }
}

export function ModelSelectionScreen({
  selectedProvider,
  availableModels,
  modelOptions,
  handleModelSelection,
  modelSearchQuery,
  handleModelSearchChange,
  modelSearchCursorOffset,
  handleModelSearchCursorOffsetChange,
  getProviderLabel,
  exitState,
}: ModelSelectionScreenProps) {
  const modelTypeText = 'this model profile'

  return (
    <Box flexDirection="column" gap={1}>
      <Box
        flexDirection="column"
        gap={1}
        borderStyle="round"
        borderColor="gray"
        paddingX={2}
        paddingY={1}
      >
        <Text bold>
          Model Selection{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>
            Select a model from{' '}
            {
              getProviderLabel(
                selectedProvider,
                availableModels.length,
              ).split(' (')[0]
            }{' '}
            for {modelTypeText}:
          </Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              This model profile can be assigned to different pointers (main,
              task, reasoning, quick) for various use cases.
            </Text>
          </Box>

          <Box marginY={1}>
            <Text bold>Search models:</Text>
            <TextInput
              placeholder="Type to filter models..."
              value={modelSearchQuery}
              onChange={handleModelSearchChange}
              columns={100}
              cursorOffset={modelSearchCursorOffset}
              onChangeCursorOffset={handleModelSearchCursorOffsetChange}
              showCursor={true}
              focus={true}
            />
          </Box>

          {modelOptions.length > 0 ? (
            <>
              <Select
                options={modelOptions}
                onChange={handleModelSelection}
              />
              <Text dimColor>
                Showing {modelOptions.length} of {availableModels.length}{' '}
                models
              </Text>
            </>
          ) : (
            <Box>
              {availableModels.length > 0 ? (
                <Text color="yellow">
                  No models match your search. Try a different query.
                </Text>
              ) : (
                <Text color="yellow">
                  No models available for this provider.
                </Text>
              )}
            </Box>
          )}

          <Box marginTop={1}>
            <Text dimColor>
              Press <Text color="blue">Esc</Text> to go back to
              API key input
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}