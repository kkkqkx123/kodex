import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { getTheme } from '../../../utils/theme'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { Header } from '../common'
import { InstructionBar } from '../common'

interface ColorStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
}

function ColorStep({ createState, setCreateState, setModeState }: ColorStepProps) {
  const theme = getTheme()
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Color options without red/green due to display issues
  const colors = [
    { label: 'Default', value: null, displayColor: null },
    { label: 'Yellow', value: 'yellow', displayColor: 'yellow' },
    { label: 'Blue', value: 'blue', displayColor: 'blue' },
    { label: 'Magenta', value: 'magenta', displayColor: 'magenta' },
    { label: 'Cyan', value: 'cyan', displayColor: 'cyan' },
    { label: 'Gray', value: 'gray', displayColor: 'gray' },
    { label: 'White', value: 'white', displayColor: 'white' }
  ]
  
  const handleSelect = (value: string | null) => {
    setCreateState({ type: 'SET_SELECTED_COLOR', value: value })
    setModeState({ mode: 'create-confirm', location: createState.location, active: true })
  }
  
  useInput((input, key) => {
    if (key.return) {
      handleSelect(colors[selectedIndex].value)
    } else if (key.upArrow) {
      setSelectedIndex(prev => prev > 0 ? prev - 1 : colors.length - 1)
    } else if (key.downArrow) {
      setSelectedIndex(prev => prev < colors.length - 1 ? prev + 1 : 0)
    }
  })
  
  return (
    <Box flexDirection="column">
      <Header title="🎨 Color Theme" subtitle="" step={5} totalSteps={5}>
        <Box marginTop={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text dimColor>Choose how your agent appears in the list:</Text>
          </Box>
          {colors.map((color, idx) => {
            const isSelected = idx === selectedIndex
            return (
              <Box key={`color-${color}-${idx}`} flexDirection="row">
                <Text color={isSelected ? theme.primary : undefined}>
                  {isSelected ? '❯ ' : '  '}
                </Text>
                <Box minWidth={12}>
                  <Text bold={isSelected} color={color.displayColor || undefined}>
                    {color.label}
                  </Text>
                </Box>
              </Box>
            )
          })}
          <Box marginTop={1} paddingLeft={2}>
            <Text>Preview: </Text>
            <Text bold color={colors[selectedIndex].displayColor || undefined}>
              {createState.agentType || 'your-agent'}
            </Text>
          </Box>
        </Box>
      </Header>
      <InstructionBar instructions="↑↓ Navigate • Enter Select" />
    </Box>
  )
}

export default ColorStep