import React, { useState } from 'react'
import { Box, useInput } from 'ink'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { SelectList } from '../common'

interface MethodSelectProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
}

function MethodSelect({ createState, setCreateState, setModeState }: MethodSelectProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const options = [
    { label: "Generate with Claude (recommended)", value: "generate" },
    { label: "Manual configuration", value: "manual" }
  ]

  const handleChange = (value: string) => {
    setCreateState({ type: 'SET_METHOD', value: value as 'generate' | 'manual' })
    if (value === "generate") {
      setCreateState({ type: 'SET_IS_AI_GENERATED', value: true })
      setModeState({ mode: "create-generate", location: createState.location, active: true })
    } else {
      setCreateState({ type: 'SET_IS_AI_GENERATED', value: false })
      setModeState({ mode: "create-type", location: createState.location, active: true })
    }
  }

  const handleCancel = () => {
    setModeState({ mode: "create-location", active: true })
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
      <Header title="Create new agent" subtitle="Creation method" step={2} totalSteps={9} />
      <Box marginTop={1}>
        <SelectList 
          options={options}
          selectedIndex={selectedIndex}
          onChange={handleChange}
          onCancel={handleCancel}
        />
      </Box>
      <InstructionBar />
    </Box>
  )
}

export default MethodSelect