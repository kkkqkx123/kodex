import React from 'react'
import { Box, Text } from 'ink'
import { ProviderType } from '../../../utils/config/types'
import { CONTEXT_LENGTH_OPTIONS } from '../ModelSelector.types'

type ConfirmationScreenProps = {
  selectedProvider: ProviderType
  resourceName: string
  ollamaBaseUrl: string
  customBaseUrl: string
  selectedModel: string
  apiKey: string
  maxTokens: string
  contextLength: number
  reasoningEffort: string | null
  supportsReasoningEffort: boolean
  handleConfirmation: () => void
  validationError: string | null
  setValidationError: (error: string | null) => void
  getProviderLabel: (provider: string, modelCount: number) => string
  exitState: { pending: boolean; keyName: string }
}

export function ConfirmationScreen({
  selectedProvider,
  resourceName,
  ollamaBaseUrl,
  customBaseUrl,
  selectedModel,
  apiKey,
  maxTokens,
  contextLength,
  reasoningEffort,
  supportsReasoningEffort,
  handleConfirmation,
  validationError,
  setValidationError,
  getProviderLabel,
  exitState,
}: ConfirmationScreenProps) {
  // Show model profile being created

  // Get provider display name
  const providerDisplayName = getProviderLabel(selectedProvider, 0).split(
    ' (',
  )[0]

  // Determine if provider requires API key
  const showsApiKey = selectedProvider !== 'ollama'

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
          Configuration Confirmation{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>Confirm your model configuration:</Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              Please review your selections before saving.
            </Text>
          </Box>

          {validationError && (
            <Box flexDirection="column" marginY={1} paddingX={1}>
              <Text color="red" bold>
                ⚠ Configuration Error:
              </Text>
              <Text color="red">{validationError}</Text>
            </Box>
          )}

          <Box flexDirection="column" marginY={1} paddingX={1}>
            <Text>
              <Text bold>Provider: </Text>
              <Text color="blue">{providerDisplayName}</Text>
            </Text>

            {selectedProvider === 'azure' && (
              <Text>
                <Text bold>Resource Name: </Text>
                <Text color="blue">{resourceName}</Text>
              </Text>
            )}

            {selectedProvider === 'ollama' && (
              <Text>
                <Text bold>Server URL: </Text>
                <Text color="blue">{ollamaBaseUrl}</Text>
              </Text>
            )}

            {selectedProvider === 'custom-openai' && (
              <Text>
                <Text bold>API Base URL: </Text>
                <Text color="blue">{customBaseUrl}</Text>
              </Text>
            )}

            <Text>
              <Text bold>Model: </Text>
              <Text color="blue">{selectedModel}</Text>
            </Text>

            {apiKey && showsApiKey && (
              <Text>
                <Text bold>API Key: </Text>
                <Text color="blue">****{apiKey.slice(-4)}</Text>
              </Text>
            )}

            {maxTokens && (
              <Text>
                <Text bold>Max Tokens: </Text>
                <Text color="blue">{maxTokens}</Text>
              </Text>
            )}

            <Text>
              <Text bold>Context Length: </Text>
              <Text color="blue">
                {CONTEXT_LENGTH_OPTIONS.find(
                  opt => opt.value === contextLength,
                )?.label || `${contextLength.toLocaleString()} tokens`}
              </Text>
            </Text>

            {supportsReasoningEffort && reasoningEffort && (
              <Text>
                <Text bold>Reasoning Effort: </Text>
                <Text color="blue">{reasoningEffort}</Text>
              </Text>
            )}
          </Box>

          <Box marginTop={1}>
            <Text dimColor>
              Press <Text color="blue">Esc</Text> to go back to
              model parameters or <Text color="blue">Enter</Text>{' '}
              to save configuration
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}