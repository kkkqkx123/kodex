import React from 'react'
import { Box } from 'ink'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { MultilineTextInput } from '../common'

interface DescriptionStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
}

function DescriptionStep({ createState, setCreateState, setModeState }: DescriptionStepProps) {
  const handleSubmit = () => {
    if (createState.whenToUse.trim()) {
      setModeState({ mode: 'create-tools', location: createState.location, active: true })
    }
  }
  
  return (
    <Box flexDirection="column">
      <Header title="Create new agent" subtitle="Describe when to use this agent" step={5} totalSteps={8}>
        <Box marginTop={1}>
          <MultilineTextInput
            value={createState.whenToUse}
            onChange={(value) => setCreateState({ type: 'SET_WHEN_TO_USE', value })}
            placeholder="Use this agent when you need to review code for best practices, security issues..."
            onSubmit={handleSubmit}
            error={createState.error}
            rows={4}
          />
        </Box>
      </Header>
      <InstructionBar />
    </Box>
  )
}

export default DescriptionStep