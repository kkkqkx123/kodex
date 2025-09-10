import React from 'react'
import { Box, Text } from 'ink'
import { Newline } from 'ink'
import { ProviderType } from '../../../utils/config/types'

type ConnectionTestScreenProps = {
  selectedProvider: ProviderType
  isTestingConnection: boolean
  connectionTestResult: {
    success: boolean
    message: string
    endpoint?: string
    details?: string
  } | null
  handleConnectionTest: () => void
  getProviderLabel: (provider: string, modelCount: number) => string
  exitState: { pending: boolean; keyName: string }
}

export function ConnectionTestScreen({
  selectedProvider,
  isTestingConnection,
  connectionTestResult,
 handleConnectionTest,
  getProviderLabel,
  exitState,
}: ConnectionTestScreenProps) {
  const providerDisplayName = getProviderLabel(selectedProvider, 0).split(
    ' (',
  )[0]

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
          Connection Test{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>Testing connection to {providerDisplayName}...</Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              This will verify your configuration by sending a test request to
              the API.
              {selectedProvider === 'minimax' && (
                <>
                  <Newline />
                  For MiniMax, we'll test both v2 and v1 endpoints to find the
                  best one.
                </>
              )}
            </Text>
          </Box>

          {!connectionTestResult && !isTestingConnection && (
            <Box marginY={1}>
              <Text>
                <Text color="blue">Press Enter</Text> to start the
                connection test
              </Text>
            </Box>
          )}

          {isTestingConnection && (
            <Box marginY={1}>
              <Text color="blue">🔄 Testing connection...</Text>
            </Box>
          )}

          {connectionTestResult && (
            <Box flexDirection="column" marginY={1} paddingX={1}>
              <Text
                color={connectionTestResult.success ? "green" : 'red'}
              >
                {connectionTestResult.message}
              </Text>

              {connectionTestResult.endpoint && (
                <Text color="gray">
                  Endpoint: {connectionTestResult.endpoint}
                </Text>
              )}

              {connectionTestResult.details && (
                <Text color="gray">
                  Details: {connectionTestResult.details}
                </Text>
              )}

              {connectionTestResult.success ? (
                <Box marginTop={1}>
                  <Text color="green">
                    ✅ Automatically proceeding to confirmation...
                  </Text>
                </Box>
              ) : (
                <Box marginTop={1}>
                  <Text>
                    <Text color="blue">Press Enter</Text> to retry
                    test, or <Text color="blue">Esc</Text> to go
                    back
                  </Text>
                </Box>
              )}
            </Box>
          )}

          <Box marginTop={1}>
            <Text dimColor>
              Press <Text color="blue">Esc</Text> to go back to
              context length
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}