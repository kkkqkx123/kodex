import React from 'react'
import { Box, Text } from 'ink'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { AgentConfig } from '../../types/AgentConfig'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { MultilineTextInput } from '../common'
import { LoadingSpinner } from '../common'
import { generateAgentWithClaude } from '../../utils/aiUtils'
import { validateAgentType } from '../../utils/validationUtils'

interface GenerateStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
  existingAgents: AgentConfig[]
}

function GenerateStep({ createState, setCreateState, setModeState, existingAgents }: GenerateStepProps) {
  const handleSubmit = async () => {
    if (createState.generationPrompt.trim()) {
      setCreateState({ type: 'SET_IS_GENERATING', value: true })
      setCreateState({ type: 'SET_ERROR', value: null })
      
      try {
        const generated = await generateAgentWithClaude(createState.generationPrompt)
        
        // Validate the generated identifier doesn't conflict
        const validation = validateAgentType(generated.identifier, existingAgents)
        let finalIdentifier = generated.identifier
        
        if (!validation.isValid) {
          // Add a suffix to make it unique
          let counter = 1
          while (true) {
            const testId = `${generated.identifier}-${counter}`
            const testValidation = validateAgentType(testId, existingAgents)
            if (testValidation.isValid) {
              finalIdentifier = testId
              break
            }
            counter++
            if (counter > 10) {
              finalIdentifier = `custom-agent-${Date.now()}`
              break
            }
          }
        }
        
        setCreateState({ type: 'SET_AGENT_TYPE', value: finalIdentifier })
        setCreateState({ type: 'SET_WHEN_TO_USE', value: generated.whenToUse })
        setCreateState({ type: 'SET_SYSTEM_PROMPT', value: generated.systemPrompt })
        setCreateState({ type: 'SET_WAS_GENERATED', value: true })
        setCreateState({ type: 'SET_IS_GENERATING', value: false })
        setModeState({ mode: 'create-tools', location: createState.location, active: true })
      } catch (error) {
        console.error('Generation failed:', error)
        setCreateState({ type: 'SET_ERROR', value: 'Failed to generate agent. Please try again or use manual configuration.' })
        setCreateState({ type: 'SET_IS_GENERATING', value: false })
      }
    }
  }
  
  return (
    <Box flexDirection="column">
      <Header title="✨ New Agent" subtitle="What should it do?" step={2} totalSteps={8}>
        <Box marginTop={1}>
          {createState.isGenerating ? (
            <Box flexDirection="column">
              <Text dimColor>{createState.generationPrompt}</Text>
              <Box marginTop={1}>
                <LoadingSpinner text="Generating agent configuration..." />
              </Box>
            </Box>
          ) : (
            <MultilineTextInput
              value={createState.generationPrompt}
              onChange={(value) => setCreateState({ type: 'SET_GENERATION_PROMPT', value })}
              placeholder="An expert that reviews pull requests for best practices, security issues, and suggests improvements..."
              onSubmit={handleSubmit}
              error={createState.error}
              rows={3}
            />
          )}
        </Box>
      </Header>
      <InstructionBar />
    </Box>
  )
}

export default GenerateStep