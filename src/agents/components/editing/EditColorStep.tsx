import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { updateAgent } from '../../utils/fileUtils'
import { clearAgentCache } from '../../../utils/agentLoader'
import { getActiveAgents } from '../../../utils/agentLoader'

interface EditColorStepProps {
  agent: AgentConfig
  setModeState: (state: ModeState) => void
  onAgentUpdated: (message: string, updated: AgentConfig) => void
}

function EditColorStep({ agent, setModeState, onAgentUpdated }: EditColorStepProps) {
  const currentColor = agent.color || null
  
  // Define color options (removed red/green due to display issues)
  const colors = [
    { label: 'Automatic color', value: null },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Blue', value: 'blue' },
    { label: 'Magenta', value: 'magenta' },
    { label: 'Cyan', value: 'cyan' },
    { label: 'Gray', value: 'gray' },
    { label: 'White', value: 'white' }
  ]
  
  // Find current color index
  const defaultIndex = colors.findIndex(color => color.value === currentColor)
 const [selectedIndex, setSelectedIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const handleSave = async (color: string | null) => {
    setIsUpdating(true)
    try {
      const colorValue = color === null ? undefined : color
      await updateAgent(agent, agent.whenToUse, agent.tools, agent.systemPrompt, colorValue, (agent as any).model)
      
      // Clear cache and reload fresh agent data from file system
      clearAgentCache()
      const freshAgents = await getActiveAgents()
      const updatedAgent = freshAgents.find(a => a.agentType === agent.agentType)
      
      if (updatedAgent) {
        onAgentUpdated(`Updated color for agent: ${agent.agentType}`, updatedAgent)
        setModeState({ mode: "edit-agent", selectedAgent: updatedAgent, active: true })
      } else {
        console.error('Failed to find updated agent after save')
        // Fallback to manual update
        const fallbackAgent: AgentConfig = { ...agent, ...(colorValue ? { color: colorValue } : { color: undefined }) }
        onAgentUpdated(`Updated color for agent: ${agent.agentType}`, fallbackAgent)
        setModeState({ mode: "edit-agent", selectedAgent: fallbackAgent, active: true })
      }
    } catch (error) {
      console.error('Failed to update agent color:', error)
      // TODO: Show error to user
    } finally {
      setIsUpdating(false)
    }
  }
  
  useInput((input, key) => {
    if (key.escape) {
      setModeState({ mode: "edit-agent", selectedAgent: agent, active: true })
    } else if (key.return && !isUpdating) {
      handleSave(colors[selectedIndex].value)
    } else if (key.upArrow) {
      setSelectedIndex(prev => prev > 0 ? prev - 1 : colors.length - 1)
    } else if (key.downArrow) {
      setSelectedIndex(prev => prev < colors.length - 1 ? prev + 1 : 0)
    }
  })
  
  if (isUpdating) {
    return (
      <Box flexDirection="column">
        <Header title={`Edit agent: ${agent.agentType}`}>
          <Box marginTop={1}>
            <LoadingSpinner text="Updating agent color..." />
          </Box>
        </Header>
        <InstructionBar />
      </Box>
    )
  }
  
  const selectedColor = colors[selectedIndex]
  const previewColor = selectedColor.value || undefined
  
  return (
    <Box flexDirection="column">
      <Header title={`Edit agent: ${agent.agentType}`} subtitle="Choose background color">
        <Box flexDirection="column" marginTop={1}>
          {colors.map((color, index) => {
            const isSelected = index === selectedIndex
            const isCurrent = color.value === currentColor
            
            return (
              <Box key={color.value || 'automatic'}>
                <Text color={isSelected ? 'cyan' : undefined}>
                  {isSelected ? '❯ ' : '  '}
                </Text>
                <Text color={color.value || undefined}>●</Text>
                <Text>
                  {' '}{color.label}
                  {isCurrent && (
                    <Text color="green"> ✔</Text>
                  )}
                </Text>
              </Box>
            )
          })}
          
          <Box marginTop={2}>
            <Text>Preview: </Text>
            <Text color={previewColor}>{agent.agentType}</Text>
          </Box>
        </Box>
      </Header>
      <InstructionBar instructions="↑↓ navigate · Enter select · Esc back" />
    </Box>
  )
}

export default EditColorStep