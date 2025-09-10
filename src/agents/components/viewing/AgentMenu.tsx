import React, { useState } from 'react'
import { Box, useInput } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { SelectList } from '../common/SelectList'

interface AgentMenuProps {
  agent: AgentConfig
  setModeState: (state: ModeState) => void
}

function AgentMenu({ agent, setModeState }: AgentMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const options = [
    { label: "View details", value: "view" },
    { label: "Edit agent", value: "edit", disabled: agent.location === 'built-in' },
    { label: "Delete agent", value: "delete", disabled: agent.location === 'built-in' }
  ]
  
  const availableOptions = options.filter(opt => !opt.disabled)
  
  const handleSelect = (value: string) => {
    switch (value) {
      case "view":
        setModeState({ mode: "view-agent", selectedAgent: agent, active: true })
        break
      case "edit":
        setModeState({ mode: "edit-agent", selectedAgent: agent, active: true })
        break
      case "delete":
        setModeState({ mode: "delete-confirm", selectedAgent: agent, active: true })
        break
    }
  }
  
  useInput((input, key) => {
    if (key.return) {
      handleSelect(availableOptions[selectedIndex].value)
    } else if (key.upArrow) {
      setSelectedIndex(prev => prev > 0 ? prev - 1 : availableOptions.length - 1)
    } else if (key.downArrow) {
      setSelectedIndex(prev => prev < availableOptions.length - 1 ? prev + 1 : 0)
    }
  })
  
  return (
    <Box flexDirection="column">
      <Header title={`Agent: ${agent.agentType}`} subtitle={`${agent.location}`}>
        <Box marginTop={1}>
          <SelectList 
            options={availableOptions}
            selectedIndex={selectedIndex}
            onChange={handleSelect}
            numbered={false}
          />
        </Box>
      </Header>
      <InstructionBar />
    </Box>
  )
}

export default AgentMenu