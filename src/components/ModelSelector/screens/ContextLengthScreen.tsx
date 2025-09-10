import React from 'react'
import { Box, Text } from 'ink'
import { CONTEXT_LENGTH_OPTIONS, DEFAULT_CONTEXT_LENGTH } from '../ModelSelector.types'

type ContextLengthScreenProps = {
  contextLength: number
  setContextLength: (value: number) => void
  handleContextLengthSubmit: () => void
  exitState: { pending: boolean; keyName: string }
}

export function ContextLengthScreen({
  contextLength,
  setContextLength,
  handleContextLengthSubmit,
  exitState,
}: ContextLengthScreenProps) {
  const selectedOption =
    CONTEXT_LENGTH_OPTIONS.find(opt => opt.value === contextLength) ||
    CONTEXT_LENGTH_OPTIONS.find(opt => opt.value === DEFAULT_CONTEXT_LENGTH) ||
    CONTEXT_LENGTH_OPTIONS[2] // Default to 128K

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
          Context Length Configuration{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>Choose the context window length for your model:</Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              This determines how much conversation history and context the
              model can process at once. Higher values allow for longer
              conversations but may increase costs.
            </Text>
          </Box>

          <Box flexDirection="column" marginY={1}>
            {CONTEXT_LENGTH_OPTIONS.map((option, index) => {
              const isSelected = option.value === contextLength
              return (
                <Box key={option.value} flexDirection="row">
                  <Text color={isSelected ? 'blue' : undefined}>
                    {isSelected ? '→ ' : '  '}
                    {option.label}
                    {option.value === DEFAULT_CONTEXT_LENGTH
                      ? ' (recommended)'
                      : ''}
                  </Text>
                </Box>
              )
            })}
          </Box>

          <Box flexDirection="column" marginY={1}>
            <Text dimColor>
              Selected:{' '}
              <Text color="blue">{selectedOption.label}</Text>
            </Text>
          </Box>
        </Box>
      </Box>

      <Box marginLeft={1}>
        <Text dimColor>
          ↑/↓ to select · Enter to continue · Esc to go back
        </Text>
      </Box>
    </Box>
  )
}