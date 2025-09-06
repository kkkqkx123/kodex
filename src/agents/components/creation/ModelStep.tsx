import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { getTheme } from '../../../utils/theme'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { getModelManager } from '../../../utils/model'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { UI_ICONS } from '../../constants/ui'

interface ModelStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
}

function ModelStep({ createState, setCreateState, setModeState }: ModelStepProps) {
  const theme = getTheme()
  const manager = getModelManager()
  const profiles = manager.getActiveModelProfiles()

  // Group models by provider
  const groupedModels = profiles.reduce((acc: any, profile: any) => {
    const provider = profile.provider || 'Default'
    if (!acc[provider]) acc[provider] = []
    acc[provider].push(profile)
    return acc
  }, {})

  // Flatten with inherit option
  const modelOptions = [
    { id: null, name: '◈ Inherit from parent', provider: 'System', modelName: 'default' },
    ...Object.entries(groupedModels).flatMap(([provider, models]: any) =>
      models.map((p: any) => ({
        id: p.modelName,
        name: p.name,
        provider: provider,
        modelName: p.modelName
      }))
    )
  ]

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = modelOptions.findIndex(m => m.id === createState.selectedModel)
    return idx >= 0 ? idx : 0
  })

  const handleSelect = (modelId: string | null) => {
    setCreateState({ type: 'SET_SELECTED_MODEL', value: modelId })
    setModeState({ mode: 'create-color', location: createState.location, active: true })
  }

  useInput((input, key) => {
    if (key.return) {
      handleSelect(modelOptions[selectedIndex].id)
    } else if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : modelOptions.length - 1))
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < modelOptions.length - 1 ? prev + 1 : 0))
    }
  })

  return (
    <Box flexDirection="column">
      <Header title="🤖 Select Model" subtitle="" step={4} totalSteps={5}>
        <Box marginTop={1} flexDirection="column">
          {modelOptions.map((model, index) => {
            const isSelected = index === selectedIndex
            const isInherit = model.id === null

            return (
              <Box key={`model-${model.id || 'inherit'}-${index}`} marginBottom={0}>
                <Box flexDirection="row" gap={1}>
                  <Text color={isSelected ? theme.primary : undefined}>
                    {isSelected ? UI_ICONS.pointer : ' '}
                  </Text>
                  <Box flexDirection="column" flexGrow={1}>
                    <Box flexDirection="row" gap={1}>
                      <Text
                        bold={isInherit}
                        color={isSelected ? theme.primary : undefined}
                      >
                        {model.name}
                      </Text>
                      {!isInherit && (
                        <Text dimColor>
                          {model.provider} • {model.modelName}
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Header>
      <InstructionBar instructions="↑↓ Navigate • Enter Select" />
    </Box>
  )
}

export default ModelStep