import React from 'react'
import { Box, Text } from 'ink'
import { Select } from '../../CustomSelect/select'
import { Newline } from 'ink'
import { providers } from '../../../constants/models'
import { ProviderType } from '../../../utils/config/types'
import { ScreenContainer } from '../ModelSelector'

type ProviderSelectionScreenProps = {
  selectedProvider: ProviderType
  handleProviderSelection: (provider: string) => void
  providerOptions: Array<{ label: string; value: string }>
  exitState: { pending: boolean; keyName: string }
}

export function ProviderSelectionScreen({
  selectedProvider,
  handleProviderSelection,
  providerOptions,
  exitState,
}: ProviderSelectionScreenProps) {
  return (
    <ScreenContainer
      title="Provider Selection"
      exitState={exitState} children={undefined}    >
      <Box flexDirection="column" gap={1}>
        <Text bold>
          Select your preferred AI provider for this model profile:
        </Text>
        <Box flexDirection="column" width={70}>
          <Text color="gray">
            Choose the provider you want to use for this model profile.
            <Newline />
            This will determine which models are available to you.
          </Text>
        </Box>

        <Select options={providerOptions} onChange={handleProviderSelection} />

        <Box marginTop={1}>
          <Text dimColor>
            You can change this later by running{' '}
            <Text color="blue">/model</Text> again
          </Text>
        </Box>
      </Box>
    </ScreenContainer>
  )
}