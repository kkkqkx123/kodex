import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { getTheme } from '../../../utils/theme'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { Tool } from '../../types/Tool'
import { AgentConfig } from '../../types/AgentConfig'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { LoadingSpinner } from '../common'
import { saveAgent } from '../../utils/fileUtils'
import { validateAgentConfig } from '../../utils/validationUtils'
import { getDisplayModelName } from '../../utils/agentUtils'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

interface ConfirmStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
  tools: Tool[]
  onAgentCreated: (message: string) => void
}

function ConfirmStep({ createState, setCreateState, setModeState, tools, onAgentCreated }: ConfirmStepProps) {
  const [isCreating, setIsCreating] = useState(false)
  const theme = getTheme()
  
  const handleConfirm = async () => {
    setIsCreating(true)
    try {
      await saveAgent(
        createState.location!,
        createState.agentType,
        createState.whenToUse,
        createState.selectedTools,
        createState.systemPrompt,
        createState.selectedModel,
        createState.selectedColor || undefined
      )
      onAgentCreated(`Created agent: ${createState.agentType}`)
    } catch (error) {
      setCreateState({ type: 'SET_ERROR', value: (error as Error).message })
      setIsCreating(false)
    }
  }
  
  const validation = validateAgentConfig(createState)
  const toolNames = createState.selectedTools.includes('*') ? 
    'All tools' : 
    createState.selectedTools.length > 0 ? 
      createState.selectedTools.join(', ') : 
      'No tools'
  
  const handleEditInEditor = async () => {
    const filePath = createState.location === 'project' 
      ? path.join(process.cwd(), '.kode', 'agents', `${createState.agentType}.md`)
    : path.join(os.homedir(), '.kode', 'agents', `${createState.agentType}.md`)
    
    try {
      // First, save the agent file
      await saveAgent(
        createState.location!,
        createState.agentType,
        createState.whenToUse,
        createState.selectedTools,
        createState.systemPrompt,
        createState.selectedModel,
        createState.selectedColor || undefined
      )
      
      // Then open it in editor
      const command = process.platform === 'win32' ? 'start' : 
                    process.platform === 'darwin' ? 'open' : 'xdg-open'
      await execAsync(`${command} "${filePath}"`)
      onAgentCreated(`Created agent: ${createState.agentType}`)
    } catch (error) {
      setCreateState({ type: 'SET_ERROR', value: (error as Error).message })
    }
  }

  useInput((input, key) => {
    if (isCreating) return
    
    if ((key.return || input === 's') && !isCreating) {
      handleConfirm()
    } else if (input === 'e') {
      handleEditInEditor()
    } else if (key.escape) {
      setModeState({ mode: "create-color", location: createState.location!, active: true })
    }
  })
  
  return (
    <Box flexDirection="column">
      <Header title="✅ Review & Create" subtitle="">
        <Box flexDirection="column" marginTop={1}>
          <Box marginBottom={1}>
            <Text bold color={theme.primary}>📋 Configuration</Text>
          </Box>
          
          <Box flexDirection="column" gap={0}>
            <Text>• <Text bold>Agent ID:</Text> {createState.agentType}</Text>
            <Text>• <Text bold>Location:</Text> {createState.location === 'project' ? 'Project' : 'Personal'}</Text>
            <Text>• <Text bold>Tools:</Text> {toolNames.length > 50 ? toolNames.slice(0, 50) + '...' : toolNames}</Text>
            <Text>• <Text bold>Model:</Text> {getDisplayModelName(createState.selectedModel)}</Text>
            {createState.selectedColor && (
              <Text>• <Text bold>Color:</Text> <Text color={createState.selectedColor}>{createState.selectedColor}</Text></Text>
            )}
          </Box>
          
          <Box marginTop={1} marginBottom={1}>
            <Text bold color={theme.primary}>📝 Purpose</Text>
          </Box>
          <Box paddingLeft={1}>
            <Text>{createState.whenToUse}</Text>
          </Box>
          
          {validation.warnings.length > 0 && (
            <Box marginTop={1}>
              <Text><Text bold>Warnings:</Text></Text>
              {validation.warnings.map((warning, idx) => (
                <React.Fragment key={`warning-${idx}`}>
                  <Text color={theme.warning}> • {warning}</Text>
                </React.Fragment>
              ))}
            </Box>
          )}
          
          {createState.error && (
            <Box marginTop={1}>
              <Text color={theme.error}>✗ {createState.error}</Text>
            </Box>
          )}
          
          <Box marginTop={2}>
            {isCreating ? (
              <LoadingSpinner text="Creating agent..." />
            ) : null}
          </Box>
        </Box>
      </Header>
      <InstructionBar instructions="Enter Save • E Edit • Esc Back" />
    </Box>
  )
}

export default ConfirmStep