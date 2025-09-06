import React from 'react'
import { Box } from 'ink'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { MultilineTextInput } from '../common'

interface PromptStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
}

function PromptStep({ createState, setCreateState, setModeState }: PromptStepProps) {
  const handleSubmit = () => {
    if (createState.systemPrompt.trim()) {
      setModeState({ mode: 'create-description', location: createState.location, active: true })
    }
  }
  
  return (
    <Box flexDirection="column">
      <Header title="Create new agent" subtitle="System prompt" step={4} totalSteps={8}>
        <Box marginTop={1}>
          <MultilineTextInput
            value={createState.systemPrompt}
            onChange={(value) => setCreateState({ type: 'SET_SYSTEM_PROMPT', value })}
            placeholder="You are a helpful assistant that specializes in..."
            onSubmit={handleSubmit}
            error={createState.error}
            rows={5}
          />
        </Box>
      </Header>
      <InstructionBar />
    </Box>
  )
}

export default PromptStep