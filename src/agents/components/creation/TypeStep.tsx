import React from 'react'
import { Box, Text } from 'ink'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { AgentConfig } from '../../types/AgentConfig'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { validateAgentType } from '../../utils/validationUtils'
import InkTextInput from 'ink-text-input'

interface TypeStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
  existingAgents: AgentConfig[]
}

function TypeStep({ createState, setCreateState, setModeState, existingAgents }: TypeStepProps) {
  const handleSubmit = () => {
    const validation = validateAgentType(createState.agentType, existingAgents)
    if (validation.isValid) {
      setModeState({ mode: 'create-prompt', location: createState.location, active: true })
    } else {
      setCreateState({ type: 'SET_ERROR', value: validation.errors[0] })
    }
  }
  
  return (
    <Box flexDirection="column">
      <Header title="Create new agent" subtitle="Enter agent identifier" step={3} totalSteps={8}>
        <Box marginTop={1}>
          <InkTextInput
            value={createState.agentType}
            onChange={(value) => setCreateState({ type: 'SET_AGENT_TYPE', value })}
            placeholder="e.g. code-reviewer, tech-lead"
            onSubmit={handleSubmit}
          />
          {createState.error && (
            <Box marginTop={1}>
              <Text color="red">⚠ {createState.error}</Text>
            </Box>
          )}
        </Box>
      </Header>
      <InstructionBar />
    </Box>
  )
}

export default TypeStep