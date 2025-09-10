import React, { useState } from 'react'
import { Box, useInput } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { SelectList } from '../common/SelectList'
import { openInEditor, getAgentFilePath } from '../../utils/fileUtils'
import { getTheme } from '../../../utils/theme'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface EditMenuProps {
  agent: AgentConfig
  setModeState: (state: ModeState) => void
}

function EditMenu({ agent, setModeState }: EditMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpening, setIsOpening] = useState(false)
  const theme = getTheme()
  
  const options = [
    { label: "Open in editor", value: "open-editor" },
    { label: "Edit tools", value: "edit-tools" },
    { label: "Edit model", value: "edit-model" },
    { label: "Edit color", value: "edit-color" }
  ]
  
  const handleSelect = async (value: string) => {
    switch (value) {
      case "open-editor":
        setIsOpening(true)
        try {
          const filePath = getAgentFilePath(agent)
          await openInEditor(filePath)
          setModeState({ mode: "agent-menu", selectedAgent: agent, active: true })
        } catch (error) {
          console.error('Failed to open editor:', error)
          // TODO: Show error to user
        } finally {
          setIsOpening(false)
        }
        break
      case "edit-tools":
        setModeState({ mode: "edit-tools", selectedAgent: agent, active: true })
        break
      case "edit-model":
        setModeState({ mode: "edit-model", selectedAgent: agent, active: true })
        break
      case "edit-color":
        setModeState({ mode: "edit-color", selectedAgent: agent, active: true })
        break
    }
  }
  
  const handleBack = () => {
    setModeState({ mode: "agent-menu", selectedAgent: agent, active: true })
  }
  
  useInput((input, key) => {
    if (key.escape) {
      handleBack()
    } else if (key.return && !isOpening) {
      handleSelect(options[selectedIndex].value)
    } else if (key.upArrow) {
      setSelectedIndex(prev => prev > 0 ? prev - 1 : options.length - 1)
    } else if (key.downArrow) {
      setSelectedIndex(prev => prev < options.length - 1 ? prev + 1 : 0)
    }
  })
  
  if (isOpening) {
    return (
      <Box flexDirection="column">
        <Header title={`Edit agent: ${agent.agentType}`} subtitle="Opening in editor...">
          <Box marginTop={1}>
            <LoadingSpinner text="Opening file in editor..." />
          </Box>
        </Header>
        <InstructionBar />
      </Box>
    )
  }
  
  return (
    <Box flexDirection="column">
      <Header title={`Edit agent: ${agent.agentType}`} subtitle={`Location: ${agent.location}`}>
        <Box marginTop={1}>
          <SelectList 
            options={options}
            selectedIndex={selectedIndex}
            onChange={handleSelect}
            numbered={false}
          />
        </Box>
      </Header>
      <InstructionBar instructions="↑↓ navigate · Enter select · Esc back" />
    </Box>
  )
}

export default EditMenu