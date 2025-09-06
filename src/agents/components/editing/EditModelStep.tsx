import React, { useState } from 'react'
import { Box, useInput } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { SelectList } from '../common/SelectList'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { getModelManager } from '../../../utils/model'
import { updateAgent } from '../../utils/fileUtils'
import { clearAgentCache } from '../../../utils/agentLoader'
import { getActiveAgents } from '../../../utils/agentLoader'

interface EditModelStepProps {
  agent: AgentConfig
  setModeState: (state: ModeState) => void
  onAgentUpdated: (message: string, updated: AgentConfig) => void
}

function EditModelStep({ agent, setModeState, onAgentUpdated }: EditModelStepProps) {
  const manager = getModelManager()
  const profiles = manager.getActiveModelProfiles()
  const currentModel = (agent as any).model || null
  
  // Build model options array
  const modelOptions = [
    { id: null, name: 'Inherit from parent', description: 'Use the model from task configuration' },
    ...profiles.map((p: any) => ({ id: p.modelName, name: p.name, description: `${p.provider || 'provider'} · ${p.modelName}` }))
  ]

  // Find the index of current model
  const defaultIndex = modelOptions.findIndex(m => m.id === currentModel)
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSave = async (modelId: string | null) => {
    setIsUpdating(true)
    try {
      const modelValue = modelId === null ? undefined : modelId
      await updateAgent(agent, agent.whenToUse, agent.tools, agent.systemPrompt, agent.color, modelValue)
      
      // Clear cache and reload fresh agent data from file system
      clearAgentCache()
      const freshAgents = await getActiveAgents()
      const updatedAgent = freshAgents.find(a => a.agentType === agent.agentType)
      
      if (updatedAgent) {
        onAgentUpdated(`Updated model for agent: ${agent.agentType}`, updatedAgent)
        setModeState({ mode: 'edit-agent', selectedAgent: updatedAgent, active: true })
      } else {
        console.error('Failed to find updated agent after save')
        // Fallback to manual update
        const fallbackAgent: AgentConfig = { ...agent }
        if (modelValue) {
          (fallbackAgent as any).model = modelValue
        } else {
          delete (fallbackAgent as any).model
        }
        onAgentUpdated(`Updated model for agent: ${agent.agentType}`, fallbackAgent)
        setModeState({ mode: 'edit-agent', selectedAgent: fallbackAgent, active: true })
      }
    } catch (error) {
      console.error('Failed to update agent model:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  useInput((input, key) => {
    if (key.escape) {
      setModeState({ mode: 'edit-agent', selectedAgent: agent, active: true })
    } else if (key.return && !isUpdating) {
      handleSave(modelOptions[selectedIndex].id)
    } else if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : modelOptions.length - 1))
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < modelOptions.length - 1 ? prev + 1 : 0))
    }
  })

  if (isUpdating) {
    return (
      <Box flexDirection="column">
        <Header title={`Edit agent: ${agent.agentType}`}>
          <Box marginTop={1}>
            <LoadingSpinner text="Updating agent model..." />
          </Box>
        </Header>
        <InstructionBar />
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Header title={`Edit agent: ${agent.agentType}`} subtitle="Model determines the agent's reasoning capabilities and speed.">
        <Box marginTop={2}>
          <SelectList
            options={modelOptions.map((m, i) => ({ label: `${i + 1}. ${m.name}${m.description ? `\n${m.description}` : ''}`, value: m.id }))}
            selectedIndex={selectedIndex}
            onChange={(val) => handleSave(val)}
            numbered={false}
          />
        </Box>
      </Header>
      <InstructionBar instructions="↑↓ navigate · Enter select · Esc back" />
    </Box>
  )
}

export default EditModelStep