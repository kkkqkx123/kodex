import React from 'react'
import { Box, Text } from 'ink'
import { Select } from '../../CustomSelect/select'
import { Newline } from 'ink'
import { ScreenContainer } from '../ModelSelector'

type AnthropicSubMenuScreenProps = {
  handleAnthropicProviderSelection: (providerType: 'official' | 'bigdream' | 'opendev' | 'custom') => void
  exitState: { pending: boolean; keyName: string }
}

export function AnthropicSubMenuScreen({
  handleAnthropicProviderSelection,
  exitState,
}: AnthropicSubMenuScreenProps) {
  const anthropicOptions = [
    { label: 'Official Anthropic API', value: 'official' },
    { label: 'BigDream (Community Proxy)', value: 'bigdream' },
    { label: 'OpenDev (Community Proxy)', value: 'opendev' },
    { label: 'Custom Anthropic-Compatible API', value: 'custom' },
  ]

  return (
    <ScreenContainer
      title="Claude Provider Selection"
      exitState={exitState} children={undefined}    >
      <Box flexDirection="column" gap={1}>
        <Text bold>
          Choose your Anthropic API access method for this model profile:
        </Text>
        <Box flexDirection="column" width={70}>
          <Text color="gray">
            • <Text bold>Official Anthropic API:</Text> Direct access to
            Anthropic's official API
            <Newline />• <Text bold>BigDream:</Text> Community proxy
            providing Claude access
            <Newline />• <Text bold>Custom:</Text> Your own
            Anthropic-compatible API endpoint
          </Text>
        </Box>

        <Select
          options={anthropicOptions}
          onChange={handleAnthropicProviderSelection}
        />

        <Box marginTop={1}>
          <Text dimColor>
            Press <Text color="blue">Esc</Text> to go back to
            provider selection
          </Text>
        </Box>
      </Box>
    </ScreenContainer>
  )
}