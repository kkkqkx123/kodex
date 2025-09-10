import React, { useState, useMemo } from 'react'
import { Box, Text, useInput } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Tool } from '../../types/Tool'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { TOOL_CATEGORIES } from '../../constants/tools'
import { UI_ICONS } from '../../constants/ui'
import { updateAgent } from '../../utils/fileUtils'
import { clearAgentCache } from '../../../utils/agentLoader'
import { getActiveAgents } from '../../../utils/agentLoader'

interface EditToolsStepProps {
  agent: AgentConfig
  tools: Tool[]
  setModeState: (state: ModeState) => void
  onAgentUpdated: (message: string, updated: AgentConfig) => void
}

function EditToolsStep({ agent, tools, setModeState, onAgentUpdated }: EditToolsStepProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Initialize selected tools based on agent.tools
  const initialTools = Array.isArray(agent.tools) ? agent.tools :
    agent.tools === '*' ? tools.map(t => t.name) : []
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(initialTools))
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Categorize tools
  const categorizedTools = useMemo(() => {
    const categories: Record<string, Tool[]> = {
      read: [],
      edit: [],
      execution: [],
      web: [],
      other: []
    }

    tools.forEach(tool => {
      let categorized = false

      // Check built-in categories
      for (const [category, toolNames] of Object.entries(TOOL_CATEGORIES)) {
        if (Array.isArray(toolNames) && toolNames.includes(tool.name)) {
          categories[category as keyof typeof categories]?.push(tool)
          categorized = true
          break
        }
      }

      if (!categorized) {
        categories.other.push(tool)
      }
    })

    return categories
  }, [tools])

  const allSelected = selectedTools.size === tools.length && tools.length > 0
  const readSelected = categorizedTools.read.every(tool => selectedTools.has(tool.name)) && categorizedTools.read.length > 0
  const editSelected = categorizedTools.edit.every(tool => selectedTools.has(tool.name)) && categorizedTools.edit.length > 0
  const execSelected = categorizedTools.execution.every(tool => selectedTools.has(tool.name)) && categorizedTools.execution.length > 0

  const options = [
    { id: 'continue', label: 'Save', isContinue: true },
    { id: 'separator1', label: '────────────────────────────────────', isSeparator: true },
    { id: 'all', label: `${allSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} All tools`, isAll: true },
    { id: 'read', label: `${readSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} Read-only tools`, isCategory: true },
    { id: 'edit', label: `${editSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} Edit tools`, isCategory: true },
    { id: 'execution', label: `${execSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} Execution tools`, isCategory: true },
    { id: 'separator2', label: '────────────────────────────', isSeparator: true },
    { id: 'advanced', label: `[ ${showAdvanced ? 'Hide' : 'Show'} advanced options ]`, isAdvancedToggle: true },
    ...(showAdvanced ? tools.map(tool => ({
      id: tool.name,
      label: `${selectedTools.has(tool.name) ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} ${tool.name}`,
      isTool: true
    })) : [])
  ]

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      // Type-safe tools conversion for updateAgent
      const toolsArray: string[] | '*' = allSelected ? '*' : Array.from(selectedTools)
      await updateAgent(agent, agent.whenToUse, toolsArray, agent.systemPrompt, agent.color, (agent as any).model)

      // Clear cache and reload fresh agent data from file system
      clearAgentCache()
      const freshAgents = await getActiveAgents()
      const updatedAgent = freshAgents.find(a => a.agentType === agent.agentType)

      if (updatedAgent) {
        onAgentUpdated(`Updated tools for agent: ${agent.agentType}`, updatedAgent)
        setModeState({ mode: "edit-agent", selectedAgent: updatedAgent, active: true })
      } else {
        console.error('Failed to find updated agent after save')
        // Fallback to manual update
        const fallbackAgent: AgentConfig = {
          ...agent,
          tools: toolsArray.length === 1 && toolsArray[0] === '*' ? '*' : toolsArray,
        }
        onAgentUpdated(`Updated tools for agent: ${agent.agentType}`, fallbackAgent)
        setModeState({ mode: "edit-agent", selectedAgent: fallbackAgent, active: true })
      }
    } catch (error) {
      console.error('Failed to update agent tools:', error)
      // TODO: Show error to user
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSelect = () => {
    const option = options[selectedIndex] as any // Type assertion for union type
    if (!option) return
    if (option.isSeparator) return

    if (option.isContinue) {
      handleSave()
    } else if (option.isAdvancedToggle) {
      setShowAdvanced(!showAdvanced)
    } else if (option.isAll) {
      if (allSelected) {
        setSelectedTools(new Set())
      } else {
        setSelectedTools(new Set(tools.map(t => t.name)))
      }
    } else if (option.isCategory) {
      const categoryName = option.id as keyof typeof categorizedTools
      const categoryTools = categorizedTools[categoryName] || []
      const newSelected = new Set(selectedTools)

      const categorySelected = categoryTools.every(tool => selectedTools.has(tool.name))
      if (categorySelected) {
        categoryTools.forEach(tool => newSelected.delete(tool.name))
      } else {
        categoryTools.forEach(tool => newSelected.add(tool.name))
      }
      setSelectedTools(newSelected)
    } else if (option.isTool) {
      const newSelected = new Set(selectedTools)
      if (newSelected.has(option.id)) {
        newSelected.delete(option.id)
      } else {
        newSelected.add(option.id)
      }
      setSelectedTools(newSelected)
    }
  }

  useInput((input, key) => {
    if (key.escape) {
      setModeState({ mode: "edit-agent", selectedAgent: agent, active: true })
    } else if (key.return && !isUpdating) {
      handleSelect()
    } else if (key.upArrow) {
      setSelectedIndex(prev => {
        let newIndex = prev > 0 ? prev - 1 : options.length - 1
        // Skip separators when going up
        while (options[newIndex] && (options[newIndex] as any).isSeparator) {
          newIndex = newIndex > 0 ? newIndex - 1 : options.length - 1
        }
        return newIndex
      })
    } else if (key.downArrow) {
      setSelectedIndex(prev => {
        let newIndex = prev < options.length - 1 ? prev + 1 : 0
        // Skip separators when going down
        while (options[newIndex] && (options[newIndex] as any).isSeparator) {
          newIndex = newIndex < options.length - 1 ? newIndex + 1 : 0
        }
        return newIndex
      })
    }
  })

  if (isUpdating) {
    return (
      <Box flexDirection="column">
        <Header title={`Edit agent: ${agent.agentType}`}>
          <Box marginTop={1}>
            <LoadingSpinner text="Updating agent tools..." />
          </Box>
        </Header>
        <InstructionBar />
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Header title={`Edit agent: ${agent.agentType}`}>
        <Box flexDirection="column" marginTop={1}>
          {options.map((option, idx) => {
            const isSelected = idx === selectedIndex
            const isContinue = 'isContinue' in option ? option.isContinue : false
            const isAdvancedToggle = (option as any).isAdvancedToggle
            const isSeparator = (option as any).isSeparator

            return (
              <Box key={option.id}>
                <Text
                  color={isSelected && !isSeparator ? 'cyan' : isSeparator ? 'gray' : undefined}
                  bold={isContinue}
                  dimColor={isSeparator}
                >
                  {isSeparator ?
                    option.label :
                    `${isSelected ? `${UI_ICONS.pointer} ` : '  '}${isContinue || isAdvancedToggle ? option.label : option.label}`
                  }
                </Text>
                {(option as any).isTool && isSelected && tools.find(t => t.name === option.id)?.description && (
                  <Box marginLeft={4}>
                    <Text dimColor>{tools.find(t => t.name === option.id)?.description}</Text>
                  </Box>
                )}
              </Box>
            )
          })}

          <Box marginTop={1}>
            <Text dimColor>
              {allSelected ?
                'All tools selected' :
                `${selectedTools.size} of ${tools.length} tools selected`}
            </Text>
          </Box>
        </Box>
      </Header>
      <InstructionBar instructions="Enter toggle selection · ↑↓ navigate · Esc back" />
    </Box>
  )
}

export default EditToolsStep