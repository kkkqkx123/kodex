import React, { useState, useMemo } from 'react'
import { Box, Text, useInput } from 'ink'
import { ModeState } from '../../types/ModeState'
import { CreateState } from '../../types/CreateState'
import { Tool } from '../../types/Tool'
import { Header } from '../common'
import { InstructionBar } from '../common'
import { TOOL_CATEGORIES } from '../../constants/tools'
import { UI_ICONS } from '../../constants/ui'

interface ToolsStepProps {
  createState: CreateState
  setCreateState: React.Dispatch<any>
  setModeState: (state: ModeState) => void
  tools: Tool[]
}

function ToolsStep({ createState, setCreateState, setModeState, tools }: ToolsStepProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  // Default to all tools selected initially
  const initialSelection = createState.selectedTools.length > 0 ?
    new Set(createState.selectedTools) :
    new Set(tools.map(t => t.name))  // Select all tools by default
  const [selectedTools, setSelectedTools] = useState<Set<string>>(initialSelection)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof TOOL_CATEGORIES | 'mcp' | 'all'>('all')

  // Categorize tools
  const categorizedTools = useMemo(() => {
    const categories: Record<string, Tool[]> = {
      read: [],
      edit: [],
      execution: [],
      web: [],
      mcp: [],
      other: []
    }

    tools.forEach(tool => {
      let categorized = false

      // Check MCP tools first
      if (tool.name.startsWith('mcp__')) {
        categories.mcp.push(tool)
        categorized = true
      } else {
        // Check built-in categories
        for (const [category, toolNames] of Object.entries(TOOL_CATEGORIES)) {
          if (Array.isArray(toolNames) && toolNames.includes(tool.name)) {
            categories[category as keyof typeof categories]?.push(tool)
            categorized = true
            break
          }
        }
      }

      if (!categorized) {
        categories.other.push(tool)
      }
    })

    return categories
  }, [tools])

  const displayTools = useMemo(() => {
    if (selectedCategory === 'all') {
      return tools
    }
    return categorizedTools[selectedCategory] || []
  }, [selectedCategory, tools, categorizedTools])

  const allSelected = selectedTools.size === tools.length && tools.length > 0
  const categoryOptions = [
    { id: 'all', label: `All (${tools.length})` },
    { id: 'read', label: `Read (${categorizedTools.read.length})` },
    { id: 'edit', label: `Edit (${categorizedTools.edit.length})` },
    { id: 'execution', label: `Execution (${categorizedTools.execution.length})` },
    { id: 'web', label: `Web (${categorizedTools.web.length})` },
    { id: 'mcp', label: `MCP (${categorizedTools.mcp.length})` },
    { id: 'other', label: `Other (${categorizedTools.other.length})` }
  ].filter(cat => cat.id === 'all' || categorizedTools[cat.id]?.length > 0)

  // Calculate category selections
  const readSelected = categorizedTools.read.every(tool => selectedTools.has(tool.name))
  const editSelected = categorizedTools.edit.every(tool => selectedTools.has(tool.name))
  const execSelected = categorizedTools.execution.every(tool => selectedTools.has(tool.name))
  const webSelected = categorizedTools.web.every(tool => selectedTools.has(tool.name))

  const options: Array<{
    id: string
    label: string
    isContinue?: boolean
    isAll?: boolean
    isTool?: boolean
    isCategory?: boolean
    isAdvancedToggle?: boolean
    isSeparator?: boolean
  }> = [
      { id: 'continue', label: 'Save', isContinue: true },
      { id: 'separator1', label: '────────────────────────────────────', isSeparator: true },
      { id: 'all', label: `${allSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} All tools`, isAll: true },
      { id: 'read', label: `${readSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} Read-only tools`, isCategory: true },
      { id: 'edit', label: `${editSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} Edit tools`, isCategory: true },
      { id: 'execution', label: `${execSelected ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} Execution tools`, isCategory: true },
      { id: 'separator2', label: '────────────────────────────', isSeparator: true },
      { id: 'advanced', label: `[ ${showAdvanced ? 'Hide' : 'Show'} advanced options ]`, isAdvancedToggle: true },
      ...(showAdvanced ? displayTools.map(tool => ({
        id: tool.name,
        label: `${selectedTools.has(tool.name) ? UI_ICONS.checkboxOn : UI_ICONS.checkboxOff} ${tool.name}`,
        isTool: true
      })) : [])
    ]

  const handleSelect = () => {
    const option = options[selectedIndex] as any // Type assertion for union type
    if (!option) return
    if (option.isSeparator) return

    if (option.isContinue) {
      const result = allSelected ? ['*'] : Array.from(selectedTools)
      setCreateState({ type: 'SET_SELECTED_TOOLS', value: result })
      setModeState({ mode: 'create-model', location: createState.location, active: true })
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
        // Unselect all tools in this category
        categoryTools.forEach(tool => newSelected.delete(tool.name))
      } else {
        // Select all tools in this category
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
    if (key.return) {
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

  return (
    <Box flexDirection="column">
      <Header title="🔧 Tool Permissions" subtitle="" step={3} totalSteps={5}>
        <Box flexDirection="column" marginTop={1}>
          {options.map((option, idx) => {
            const isSelected = idx === selectedIndex
            const isContinue = option.isContinue
            const isAdvancedToggle = option.isAdvancedToggle
            const isSeparator = option.isSeparator

            return (
              <Box key={option.id}>
                <Text
                  color={isSelected && !isSeparator ? 'cyan' : isSeparator ? 'gray' : undefined}
                  bold={isContinue}
                  dimColor={isSeparator}
                >
                  {isSeparator ?
                    option.label :
                    `${isSelected ? `${UI_ICONS.pointer} ` : '  '}${isContinue || isAdvancedToggle ? `${option.label}` : option.label}`
                  }
                </Text>
                {option.isTool && isSelected && tools.find(t => t.name === option.id)?.description && (
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
            {selectedCategory !== 'all' && (
              <Text dimColor>Filtering: {selectedCategory} tools</Text>
            )}
          </Box>
        </Box>
      </Header>
      <InstructionBar instructions="↑↓ Navigate • Enter Toggle • Esc Back" />
    </Box>
  )
}

export default ToolsStep