import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { getTheme } from '../../../utils/theme'
import { AgentLocation } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { Header } from '../common'
import { InstructionBar } from '../common'

interface LocationSelectProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
}

function LocationSelect({ createState, setCreateState, setModeState }: LocationSelectProps) {
  const theme = getTheme()
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const options = [
    { label: "📁 Project", value: "project", desc: ".kode/agents/" },
    { label: "🏠 Personal", value: "user", desc: "~/.kode/agents/" }
  ]

  const handleChange = (value: string) => {
    setCreateState({ type: 'SET_LOCATION', value: value as AgentLocation })
    setCreateState({ type: 'SET_METHOD', value: 'generate' }) // Always use generate method
    setModeState({ mode: "create-generate", location: value as AgentLocation, active: true })
  }

  const handleCancel = () => {
    setModeState({ mode: "list-agents", location: "all" as AgentLocation, active: true })
  }

  useInput((input, key) => {
    if (key.escape) {
      handleCancel()
    } else if (key.return) {
      handleChange(options[selectedIndex].value)
    } else if (key.upArrow) {
      setSelectedIndex(prev => prev > 0 ? prev - 1 : options.length - 1)
    } else if (key.downArrow) {
      setSelectedIndex(prev => prev < options.length - 1 ? prev + 1 : 0)
    }
  })

  return (
    <Box flexDirection="column">
      <Header title="📦 Save Location" subtitle="" step={1} totalSteps={5} />
      <Box marginTop={1} flexDirection="column">
        {options.map((opt, idx) => (
          <Box key={opt.value} flexDirection="column" marginBottom={1}>
            <Text color={idx === selectedIndex ? theme.primary : undefined}>
              {idx === selectedIndex ? '❯ ' : '  '}{opt.label}
            </Text>
            <Box marginLeft={3}>
              <Text dimColor>{opt.desc}</Text>
            </Box>
          </Box>
        ))}
      </Box>
      <InstructionBar instructions="↑↓ Navigate • Enter Select" />
    </Box>
  )
}

export default LocationSelect