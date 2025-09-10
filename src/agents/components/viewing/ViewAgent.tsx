import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Tool } from '../../types/Tool'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { getDisplayModelName } from '../../utils/agentUtils'
import { getTheme } from '../../../utils/theme'

interface ViewAgentProps {
  agent: AgentConfig
  tools: Tool[]
  setModeState: (state: ModeState) => void
}

function ViewAgent({ agent, tools, setModeState }: ViewAgentProps) {
  const theme = getTheme()
  const agentTools = Array.isArray(agent.tools) ? agent.tools : []
  const hasAllTools = agent.tools === "*" || agentTools.includes("*")
  const locationPath = agent.location === 'user'
    ? `~/.kode/agents/${agent.agentType}.md`
    : agent.location === 'project'
      ? `.kode/agents/${agent.agentType}.md`
      : '(built-in)'
  const displayModel = getDisplayModelName((agent as any).model || null)
  
  const allowedTools = useMemo(() => {
    if (hasAllTools) return tools
    
    return tools.filter(tool => 
      agentTools.some(allowedTool => {
        if (allowedTool.includes("*")) {
          const prefix = allowedTool.replace("*", "")
          return tool.name.startsWith(prefix)
        }
        return tool.name === allowedTool
      })
    )
  }, [tools, agentTools, hasAllTools])
  
  return (
    <Box flexDirection="column">
      <Header title={`Agent: ${agent.agentType}`} subtitle="Details">
        <Box flexDirection="column" marginTop={1}>
          <Text><Text bold>Type:</Text> {agent.agentType}</Text>
          <Text><Text bold>Location:</Text> {agent.location} {locationPath !== '(built-in)' ? `· ${locationPath}` : ''}</Text>
          <Text><Text bold>Description:</Text> {agent.whenToUse}</Text>
          <Text><Text bold>Model:</Text> {displayModel}</Text>
          <Text><Text bold>Color:</Text> {agent.color || 'auto'}</Text>
          
          <Box marginTop={1}>
            <Text bold>Tools:</Text>
          </Box>
          {hasAllTools ? (
            <Text color={theme.secondary}>All tools ({tools.length} available)</Text>
          ) : (
            <Box flexDirection="column" paddingLeft={2}>
              {allowedTools.map(tool => (
                <React.Fragment key={`tool-${tool.name}`}>
                  <Text color={theme.secondary}>• {tool.name}</Text>
                </React.Fragment>
              ))}
            </Box>
          )}
          
          <Box marginTop={1}>
            <Text bold>System Prompt:</Text>
          </Box>
          <Box paddingLeft={2}>
            <Text>{agent.systemPrompt}</Text>
          </Box>
        </Box>
      </Header>
      <InstructionBar />
    </Box>
  )
}

export default ViewAgent