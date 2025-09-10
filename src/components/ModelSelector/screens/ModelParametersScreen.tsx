import React from 'react'
import { Box, Text } from 'ink'
import { Select } from '../../CustomSelect/select'
import { MAX_TOKENS_OPTIONS, ReasoningEffortOption } from '../ModelSelector.types'

type ModelParametersScreenProps = {
  selectedModel: string
  maxTokens: string
  setMaxTokens: (value: string) => void
  selectedMaxTokensPreset: number
  setSelectedMaxTokensPreset: (value: number) => void
  maxTokensCursorOffset: number
  setMaxTokensCursorOffset: (offset: number) => void
  reasoningEffort: ReasoningEffortOption | null
  setReasoningEffort: (value: ReasoningEffortOption | null) => void
  supportsReasoningEffort: boolean
  activeFieldIndex: number
  setActiveFieldIndex: (index: number) => void
  handleModelParamsSubmit: () => void
  exitState: { pending: boolean; keyName: string }
}

export function ModelParametersScreen({
  selectedModel,
  maxTokens,
  setMaxTokens,
  selectedMaxTokensPreset,
  setSelectedMaxTokensPreset,
  maxTokensCursorOffset,
  setMaxTokensCursorOffset,
  reasoningEffort,
  setReasoningEffort,
  supportsReasoningEffort,
  activeFieldIndex,
  setActiveFieldIndex,
  handleModelParamsSubmit,
  exitState,
}: ModelParametersScreenProps) {
  // Define form fields
  const formFields = [
    {
      name: 'maxTokens',
      label: 'Maximum Tokens',
      description: 'Select the maximum number of tokens to generate.',
      value: parseInt(maxTokens),
      component: 'select',
      options: MAX_TOKENS_OPTIONS.map(option => ({
        label: option.label,
        value: option.value.toString(),
      })),
      defaultValue: maxTokens,
    },
    ...(supportsReasoningEffort
      ? [
          {
            name: 'reasoningEffort',
            label: 'Reasoning Effort',
            description: 'Controls reasoning depth for complex problems.',
            value: reasoningEffort,
            component: 'select',
          },
        ]
      : []),
    {
      name: 'submit',
      label: 'Continue →',
      component: 'button',
    },
  ]

  const reasoningEffortOptions = [
    { label: 'Low - Faster responses, less thorough reasoning', value: 'low' },
    { label: 'Medium - Balanced speed and reasoning depth', value: 'medium' },
    {
      label: 'High - Slower responses, more thorough reasoning',
      value: 'high',
    },
  ]

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
          Model Parameters{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>Configure parameters for {selectedModel}:</Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              Use <Text color="blue">Tab</Text> to navigate
              between fields. Press{' '}
              <Text color="blue">Enter</Text> to submit.
            </Text>
          </Box>

          <Box flexDirection="column">
            {formFields.map((field, index) => (
              <Box flexDirection="column" marginY={1} key={field.name}>
                {field.component !== 'button' ? (
                  <>
                    <Text
                      bold
                      color={
                        activeFieldIndex === index ? "green" : undefined
                      }
                    >
                      {field.label}
                    </Text>
                    {field.description && (
                      <Text color="gray">
                        {field.description}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text
                    bold
                    color={
                      activeFieldIndex === index ? "green" : undefined
                    }
                  >
                    {field.label}
                  </Text>
                )}
                <Box marginY={1}>
                  {activeFieldIndex === index ? (
                    field.component === 'select' ? (
                      field.name === 'maxTokens' ? (
                        <Select
                          options={field.options || []}
                          onChange={value => {
                            const numValue = parseInt(value)
                            setMaxTokens(numValue.toString())
                            setSelectedMaxTokensPreset(numValue)
                            setMaxTokensCursorOffset(
                              numValue.toString().length,
                            )
                            // Move to next field after selection
                            setTimeout(() => {
                              setActiveFieldIndex(index + 1)
                            }, 100)
                          }}
                          defaultValue={field.defaultValue}
                        />
                      ) : (
                        <Select
                          options={reasoningEffortOptions}
                          onChange={value => {
                            setReasoningEffort(value as ReasoningEffortOption)
                            // Move to next field after selection
                            setTimeout(() => {
                              setActiveFieldIndex(index + 1)
                            }, 100)
                          }}
                          defaultValue={reasoningEffort || 'medium'}
                        />
                      )
                    ) : null
                  ) : field.name === 'maxTokens' ? (
                    <Text color="gray">
                      Current:{' '}
                      <Text color="blue">
                        {MAX_TOKENS_OPTIONS.find(
                          opt => opt.value === parseInt(maxTokens),
                        )?.label || `${maxTokens} tokens`}
                      </Text>
                    </Text>
                  ) : field.name === 'reasoningEffort' ? (
                    <Text color="gray">
                      Current:{' '}
                      <Text color="blue">{reasoningEffort}</Text>
                    </Text>
                  ) : null}
                </Box>
              </Box>
            ))}

            <Box marginTop={1}>
              <Text dimColor>
                Press <Text color="blue">Tab</Text> to navigate,{' '}
                <Text color="blue">Enter</Text> to continue, or{' '}
                <Text color="blue">Esc</Text> to go back
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}