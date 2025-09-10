import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { deleteAgent } from '../../utils/fileUtils'
import { clearAgentCache } from '../../../utils/agentLoader'

interface DeleteConfirmProps {
 agent: AgentConfig
  setModeState: (state: ModeState) => void
  onAgentDeleted: (message: string) => void
}

function DeleteConfirm({ agent, setModeState, onAgentDeleted }: DeleteConfirmProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [selected, setSelected] = useState(false) // false = No, true = Yes
  
  const handleConfirm = async () => {
    if (selected) {
      setIsDeleting(true)
      try {
        await deleteAgent(agent)
        clearAgentCache()
        onAgentDeleted(`Deleted agent: ${agent.agentType}`)
      } catch (error) {
        console.error('Failed to delete agent:', error)
        setIsDeleting(false)
        // TODO: Show error to user
      }
    } else {
      setModeState({ mode: "agent-menu", selectedAgent: agent, active: true })
    }
  }
  
  useInput((input, key) => {
    if (key.return) {
      handleConfirm()
    } else if (key.leftArrow || key.rightArrow || key.tab) {
      setSelected(!selected)
    }
  })
  
  if (isDeleting) {
    return (
      <Box flexDirection="column">
        <Header title="Delete agent" subtitle="Deleting...">
          <Box marginTop={1}>
            <LoadingSpinner text="Deleting agent..." />
          </Box>
        </Header>
        <InstructionBar />
      </Box>
    )
  }
  
  return (
    <Box flexDirection="column">
      <Header title="Delete agent" subtitle={`Delete "${agent.agentType}"?`}>
        <Box marginTop={1}>
          <Text>This action cannot be undone. The agent file will be permanently deleted.</Text>
          <Box marginTop={2} gap={3}>
            <Text color={!selected ? 'cyan' : undefined}>
              {!selected ? `❯ ` : '  '}No
            </Text>
            <Text color={selected ? 'red' : undefined}>
              {selected ? `❯ ` : '  '}Yes, delete
            </Text>
          </Box>
        </Box>
      </Header>
      <InstructionBar />
    </Box>
  )
}

export default DeleteConfirm