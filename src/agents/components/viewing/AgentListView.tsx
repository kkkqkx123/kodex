import React, { useState, useMemo, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { AgentConfig } from '../../types/AgentConfig'
import { AgentLocation } from '../../types/AgentConfig'
import { ModeState } from '../../types/ModeState'
import { Header } from '../common/Header'
import { InstructionBar } from '../common/InstructionBar'
import { getTheme } from '../../../utils/theme'
import { UI_ICONS } from '../../constants/ui'
import { getDisplayModelName } from '../../utils/agentUtils'

interface AgentListProps {
  location: AgentLocation
  agents: AgentConfig[]
  allAgents: AgentConfig[]
  onBack: () => void
  onSelect: (agent: AgentConfig) => void
  onCreateNew?: () => void
  changes: string[]
}

function AgentListView({
  location,
  agents,
  allAgents,
  onBack,
  onSelect,
  onCreateNew,
  changes
}: AgentListProps) {
  const theme = getTheme()
  const allAgentsList = allAgents || agents
  const customAgents = allAgentsList.filter(a => a.location !== "built-in")
  const builtInAgents = allAgentsList.filter(a => a.location === "built-in")

  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null)
  const [onCreateOption, setOnCreateOption] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<AgentLocation>(location)
  const [inLocationTabs, setInLocationTabs] = useState(false)
  const [selectedLocationTab, setSelectedLocationTab] = useState(0)

  const locationTabs = [
    { label: "All", value: "all" as AgentLocation },
    { label: "Personal", value: "user" as AgentLocation },
    { label: "Project", value: "project" as AgentLocation }
  ]

  const activeMap = useMemo(() => {
    const map = new Map<string, AgentConfig>()
    agents.forEach(a => map.set(a.agentType, a))
    return map
  }, [agents])

  const checkOverride = (agent: AgentConfig) => {
    const active = activeMap.get(agent.agentType)
    const isOverridden = !!(active && active.location !== agent.location)
    return {
      isOverridden,
      overriddenBy: isOverridden ? active.location : null
    }
  }

  const renderCreateOption = () => (
    <Box flexDirection="row" gap={1}>
      <Text color={onCreateOption ? theme.primary : undefined}>
        {onCreateOption ? `${UI_ICONS.pointer} ` : "  "}
      </Text>
      <Text bold color={onCreateOption ? theme.primary : undefined}>
        ✨ Create new agent
      </Text>
    </Box>
  )

  const renderAgent = (agent: AgentConfig, isBuiltIn = false) => {
    const isSelected = !isBuiltIn && !onCreateOption &&
      selectedAgent?.agentType === agent.agentType &&
      selectedAgent?.location === agent.location
    const { isOverridden, overriddenBy } = checkOverride(agent)
    const dimmed = isBuiltIn || isOverridden
    const color = !isBuiltIn && isSelected ? theme.primary : undefined

    // Extract model from agent metadata
    const agentModel = (agent as any).model || null
    const modelDisplay = getDisplayModelName(agentModel)

    return (
      <Box key={`${agent.agentType}-${agent.location}`} flexDirection="row" alignItems="center">
        <Box flexDirection="row" alignItems="center" minWidth={3}>
          <Text dimColor={dimmed && !isSelected} color={color}>
            {isBuiltIn ? "" : isSelected ? `${UI_ICONS.pointer} ` : "  "}
          </Text>
        </Box>
        <Box flexDirection="row" alignItems="center" flexGrow={1}>
          <Text dimColor={dimmed && !isSelected} color={color}>
            {agent.agentType}
          </Text>
          <Text dimColor={true} color={dimmed ? undefined : 'gray'}>
            {" · "}{modelDisplay}
          </Text>
        </Box>
        {overriddenBy && (
          <Box marginLeft={1}>
            <Text dimColor={!isSelected} color={isSelected ? 'yellow' : 'gray'}>
              {UI_ICONS.warning} overridden by {overriddenBy}
            </Text>
          </Box>
        )}
      </Box>
    )
  }

  const displayAgents = useMemo(() => {
    if (currentLocation === "all") {
      return [
        ...customAgents.filter(a => a.location === "user"),
        ...customAgents.filter(a => a.location === "project")
      ]
    } else if (currentLocation === "user" || currentLocation === "project") {
      return customAgents.filter(a => a.location === currentLocation)
    }
    return customAgents
  }, [customAgents, currentLocation])

  // 更新当前选中的标签索引
  useEffect(() => {
    const tabIndex = locationTabs.findIndex(tab => tab.value === currentLocation)
    if (tabIndex !== -1) {
      setSelectedLocationTab(tabIndex)
    }
  }, [currentLocation, locationTabs])

  // 确保当有agents时，初始化选择状态
  useEffect(() => {
    if (displayAgents.length > 0 && !selectedAgent && !onCreateOption) {
      setOnCreateOption(true) // 默认选择创建选项
    }
  }, [displayAgents.length, selectedAgent, onCreateOption])

  useInput((input, key) => {
    if (key.escape) {
      if (inLocationTabs) {
        setInLocationTabs(false)
        return
      }
      onBack()
      return
    }

    if (key.return) {
      if (inLocationTabs) {
        setCurrentLocation(locationTabs[selectedLocationTab].value)
        setInLocationTabs(false)
        return
      }
      if (onCreateOption && onCreateNew) {
        onCreateNew()
      } else if (selectedAgent) {
        onSelect(selectedAgent)
      }
      return
    }

    // Tab键进入/退出标签导航
    if (key.tab) {
      setInLocationTabs(!inLocationTabs)
      return
    }

    // 在标签导航模式
    if (inLocationTabs) {
      if (key.leftArrow) {
        setSelectedLocationTab(prev => prev > 0 ? prev - 1 : locationTabs.length - 1)
      } else if (key.rightArrow) {
        setSelectedLocationTab(prev => prev < locationTabs.length - 1 ? prev + 1 : 0)
      }
      return
    }

    // 键盘导航 - 这是关键缺失的功能
    if (key.upArrow || key.downArrow) {
      const allNavigableItems = []

      // 添加创建选项
      if (onCreateNew) {
        allNavigableItems.push({ type: 'create', agent: null })
      }

      // 添加可导航的agents
      displayAgents.forEach(agent => {
        const { isOverridden } = checkOverride(agent)
        if (!isOverridden) { // 只显示未被覆盖的agents
          allNavigableItems.push({ type: 'agent', agent })
        }
      })

      if (allNavigableItems.length === 0) return

      if (key.upArrow) {
        if (onCreateOption) {
          // 从创建选项向上到最后一个agent
          const lastAgent = allNavigableItems[allNavigableItems.length - 1]
          if (lastAgent.type === 'agent') {
            setSelectedAgent(lastAgent.agent)
            setOnCreateOption(false)
          }
        } else if (selectedAgent) {
          const currentIndex = allNavigableItems.findIndex(
            item => item.type === 'agent' &&
              item.agent?.agentType === selectedAgent.agentType &&
              item.agent?.location === selectedAgent.location
          )
          if (currentIndex > 0) {
            const prevItem = allNavigableItems[currentIndex - 1]
            if (prevItem.type === 'create') {
              setOnCreateOption(true)
              setSelectedAgent(null)
            } else {
              setSelectedAgent(prevItem.agent)
            }
          } else {
            // 到达顶部，回到创建选项
            if (onCreateNew) {
              setOnCreateOption(true)
              setSelectedAgent(null)
            }
          }
        }
      } else if (key.downArrow) {
        if (onCreateOption) {
          // 从创建选项向下到第一个agent
          const firstAgent = allNavigableItems.find(item => item.type === 'agent')
          if (firstAgent) {
            setSelectedAgent(firstAgent.agent)
            setOnCreateOption(false)
          }
        } else if (selectedAgent) {
          const currentIndex = allNavigableItems.findIndex(
            item => item.type === 'agent' &&
              item.agent?.agentType === selectedAgent.agentType &&
              item.agent?.location === selectedAgent.location
          )
          if (currentIndex < allNavigableItems.length - 1) {
            const nextItem = allNavigableItems[currentIndex + 1]
            if (nextItem.type === 'agent') {
              setSelectedAgent(nextItem.agent)
            }
          } else {
            // 到达底部，回到创建选项
            if (onCreateNew) {
              setOnCreateOption(true)
              setSelectedAgent(null)
            }
          }
        }
      }
    }
  })

  // 特殊的键盘输入处理组件用于空状态
  const EmptyStateInput = () => {
    useInput((input, key) => {
      if (key.escape) {
        onBack()
        return
      }
      if (key.return && onCreateNew) {
        onCreateNew()
        return
      }
    })
    return null
  }

  if (!agents.length || (currentLocation !== "built-in" && !customAgents.length)) {
    return (
      <Box flexDirection="column">
        <EmptyStateInput />
        <Header title="🤖 Agents" subtitle="">
          {onCreateNew && (
            <Box marginY={1}>
              {renderCreateOption()}
            </Box>
          )}
          <Box marginTop={1} flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color={theme.primary}>💭 What are agents?</Text>
            </Box>
            <Text>Specialized AI assistants that Claude can delegate to for specific tasks.</Text>
            <Text>Each agent has its own context, prompt, and tools.</Text>

            <Box marginTop={1} marginBottom={1}>
              <Text bold color={theme.primary}>💡 Popular agent ideas:</Text>
            </Box>
            <Box paddingLeft={2} flexDirection="column">
              <Text>• 🔍 Code Reviewer - Reviews PRs for best practices</Text>
              <Text>• 🔒 Security Auditor - Finds vulnerabilities</Text>
              <Text>• ⚡ Performance Optimizer - Improves code speed</Text>
              <Text>• 🧑‍💼 Tech Lead - Makes architecture decisions</Text>
              <Text>• 🎨 UX Expert - Improves user experience</Text>
            </Box>
          </Box>
        </Header>
        <InstructionBar instructions="Press Enter to create new agent · Esc to go back" />
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Header title="🤖 Agents" subtitle="">
        {changes.length > 0 && (
          <Box marginTop={1}>
            <Text dimColor>{changes[changes.length - 1]}</Text>
          </Box>
        )}

        {/* Fancy location tabs */}
        <Box marginTop={1} flexDirection="column">
          <Box flexDirection="row" gap={2}>
            {locationTabs.map((tab, idx) => {
              const isActive = currentLocation === tab.value
              const isSelected = inLocationTabs && idx === selectedLocationTab
              return (
                <Box key={tab.value} flexDirection="row">
                  <Text
                    color={isSelected || isActive ? theme.primary : undefined}
                    bold={isActive}
                    dimColor={!isActive && !isSelected}
                  >
                    {isSelected ? '▶ ' : isActive ? '◉ ' : '○ '}
                    {tab.label}
                  </Text>
                  {idx < locationTabs.length - 1 && <Text dimColor> | </Text>}
                </Box>
              )
            })}
          </Box>
          <Box marginTop={0}>
            <Text dimColor>
              {currentLocation === 'all' ? 'Showing all agents' :
                currentLocation === 'user' ? 'Personal agents (~/.kode/agents)' :
      'Project agents (.kode/agents)'}
            </Text>
          </Box>
        </Box>

        <Box flexDirection="column" marginTop={1}>
          {onCreateNew && (
            <Box marginBottom={1}>
              {renderCreateOption()}
            </Box>
          )}

          {currentLocation === "all" ? (
            <>
              {customAgents.filter(a => a.location === "user").length > 0 && (
                <>
                  <Text bold color={theme.secondary}>Personal:</Text>
                  {customAgents.filter(a => a.location === "user").map(a => renderAgent(a))}
                </>
              )}

              {customAgents.filter(a => a.location === "project").length > 0 && (
                <>
                  <Box marginTop={customAgents.filter(a => a.location === "user").length > 0 ? 1 : 0}>
                    <Text bold color={theme.secondary}>Project:</Text>
                  </Box>
                  {customAgents.filter(a => a.location === "project").map(a => renderAgent(a))}
                </>
              )}

              {builtInAgents.length > 0 && (
                <>
                  <Box marginTop={customAgents.length > 0 ? 1 : 0}>
                    <Text>{UI_ICONS.separator.repeat(40)}</Text>
                  </Box>
                  <Box flexDirection="column">
                    <Text bold color={theme.secondary}>Built-in:</Text>
                    {builtInAgents.map(a => renderAgent(a, true))}
                  </Box>
                </>
              )}
            </>
          ) : (
            <>
              {displayAgents.map(a => renderAgent(a))}
              {currentLocation !== "built-in" && builtInAgents.length > 0 && (
                <>
                  <Box marginTop={1}><Text>{UI_ICONS.separator.repeat(40)}</Text></Box>
                  <Box flexDirection="column">
                    <Text bold color={theme.secondary}>Built-in:</Text>
                    {builtInAgents.map(a => renderAgent(a, true))}
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      </Header>
      <InstructionBar
        instructions={inLocationTabs ?
          "←→ Switch tabs • Enter Select • Tab Exit tabs" :
          "↑↓ Navigate • Tab Location • Enter Select"
        }
      />
    </Box>
  )
}

export default AgentListView