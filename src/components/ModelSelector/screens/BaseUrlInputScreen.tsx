import React from 'react'
import { Box, Text } from 'ink'
import TextInput from '../../TextInput'
import { Newline } from 'ink'
import { ProviderType } from '../../../utils/config/types'
import { providers } from '../../../constants/models'

type BaseUrlInputScreenProps = {
  selectedProvider: ProviderType
  customBaseUrl: string
  setCustomBaseUrl: (value: string) => void
  handleCustomBaseUrlSubmit: (url: string) => void
  customBaseUrlCursorOffset: number
  setCustomBaseUrlCursorOffset: (offset: number) => void
  providerBaseUrl: string
  setProviderBaseUrl: (value: string) => void
  handleProviderBaseUrlSubmit: (url: string) => void
  providerBaseUrlCursorOffset: number
  setProviderBaseUrlCursorOffset: (offset: number) => void
 isLoadingModels: boolean
  modelLoadError: string | null
  exitState: { pending: boolean; keyName: string }
}

export function BaseUrlInputScreen({
  selectedProvider,
  customBaseUrl,
  setCustomBaseUrl,
  handleCustomBaseUrlSubmit,
  customBaseUrlCursorOffset,
  setCustomBaseUrlCursorOffset,
  providerBaseUrl,
  setProviderBaseUrl,
  handleProviderBaseUrlSubmit,
  providerBaseUrlCursorOffset,
  setProviderBaseUrlCursorOffset,
  isLoadingModels,
  modelLoadError,
  exitState,
}: BaseUrlInputScreenProps) {
  const isCustomOpenAI = selectedProvider === 'custom-openai'

  // For custom-openai, we still use the old logic with customBaseUrl
  if (isCustomOpenAI) {
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
            Custom API Server Setup{' '}
            {exitState.pending
              ? `(press ${exitState.keyName} again to exit)`
              : ''}
          </Text>
          <Box flexDirection="column" gap={1}>
            <Text bold>Enter your custom API URL:</Text>
            <Box flexDirection="column" width={70}>
              <Text color="gray">
                This is the base URL for your OpenAI-compatible API.
                <Newline />
                For example: https://api.example.com/v1
              </Text>
            </Box>

            <Box>
              <TextInput
                placeholder="https://api.example.com/v1"
                value={customBaseUrl}
                onChange={setCustomBaseUrl}
                onSubmit={handleCustomBaseUrlSubmit}
                columns={100}
                cursorOffset={customBaseUrlCursorOffset}
                onChangeCursorOffset={setCustomBaseUrlCursorOffset}
                showCursor={!isLoadingModels}
                focus={!isLoadingModels}
              />
            </Box>

            <Box marginTop={1}>
              <Text>
                <Text
                  color={
                    isLoadingModels ? "gray" : "blue"
                  }
                >
                  [Submit Base URL]
                </Text>
                <Text> - Press Enter or click to continue</Text>
              </Text>
            </Box>

            <Box marginTop={1}>
              <Text dimColor>
                Press <Text color="blue">Enter</Text> to continue
                or <Text color="blue">Esc</Text> to go back
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  // For all other providers, use the new general provider URL configuration
  const providerName = providers[selectedProvider]?.name || selectedProvider
  const defaultUrl = providers[selectedProvider]?.baseURL || ''

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
          {providerName} API Configuration{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>Configure the API endpoint for {providerName}:</Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              {selectedProvider === 'ollama' ? (
                <>
                  This is the URL of your Ollama server.
                  <Newline />
                  Default is http://localhost:11434/v1 for local Ollama
                  installations.
                </>
              ) : (
                <>
                  This is the base URL for the {providerName} API.
                  <Newline />
                  You can modify this URL or press Enter to use the default.
                </>
              )}
            </Text>
          </Box>

          <Box>
            <TextInput
              placeholder={defaultUrl}
              value={providerBaseUrl}
              onChange={setProviderBaseUrl}
              onSubmit={handleProviderBaseUrlSubmit}
              columns={100}
              cursorOffset={providerBaseUrlCursorOffset}
              onChangeCursorOffset={setProviderBaseUrlCursorOffset}
              showCursor={!isLoadingModels}
              focus={!isLoadingModels}
            />
          </Box>

          <Box marginTop={1}>
            <Text>
              <Text
                color={
                  isLoadingModels ? "gray" : "blue"
                }
              >
                [Submit Base URL]
              </Text>
              <Text> - Press Enter or click to continue</Text>
            </Text>
          </Box>

          {isLoadingModels && (
            <Box marginTop={1}>
              <Text color="green">
                {selectedProvider === 'ollama'
                  ? 'Connecting to Ollama server...'
                  : `Connecting to ${providerName}...`}
              </Text>
            </Box>
          )}

          {modelLoadError && (
            <Box marginTop={1}>
              <Text color="red">Error: {modelLoadError}</Text>
            </Box>
          )}

          <Box marginTop={1}>
            <Text dimColor>
              Press <Text color="blue">Enter</Text> to continue or{' '}
              <Text color="blue">Esc</Text> to go back
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}