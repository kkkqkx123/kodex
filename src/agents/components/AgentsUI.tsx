import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react'
import { Box, Text, useInput } from 'ink'
import InkTextInput from 'ink-text-input'
import { getActiveAgents, clearAgentCache } from '../../utils/agentLoader'
import { AgentConfig } from './../types/AgentConfig'
import { writeFileSync, unlinkSync, mkdirSync, existsSync, renameSync } from 'fs'
import { join } from 'path'
import * as path from 'path'
import { homedir } from 'os'
import * as os from 'os'
import { getCwd } from '../../utils/state'
import { getTheme } from '../../utils/theme'
import matter from 'gray-matter'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { watch, FSWatcher } from 'fs'
import { getMCPTools } from '../../services/mcpClient'
import { getModelManager } from '../../utils/model'
import { randomUUID } from 'crypto'
import { Header } from './common/Header'
import { InstructionBar } from './common/InstructionBar'
import { LoadingSpinner } from './common/LoadingSpinner'
import { MultilineTextInput } from './common/MultilineTextInput'
import { SelectList } from './common/SelectList'
import LocationSelect from './creation/LocationSelect'
import MethodSelect from './creation/MethodSelect'
import GenerateStep from './creation/GenerateStep'
import TypeStep from './creation/TypeStep'
import DescriptionStep from './creation/DescriptionStep'
import ToolsStep from './creation/ToolsStep'
import ModelStep from './creation/ModelStep'
import ColorStep from './creation/ColorStep'
import PromptStep from './creation/PromptStep'
import ConfirmStep from './creation/ConfirmStep'
import AgentMenu from './viewing/AgentMenu'
import ViewAgent from './viewing/ViewAgent'
import EditMenu from './editing/EditMenu'
import EditToolsStep from './editing/EditToolsStep'
import EditModelStep from './editing/EditModelStep'
import EditColorStep from './editing/EditColorStep'
import DeleteConfirm from './viewing/DeleteConfirm'
import AgentListView from './viewing/AgentListView'
import { CreateState } from './../types/CreateState'
import { ModeState } from './../types/ModeState'
import { Tool } from './../types/Tool'
import { getDisplayModelName } from './../utils/agentUtils'
import { generateAgentWithClaude } from './../utils/aiUtils'
import { validateAgentType, validateAgentConfig } from './../utils/validationUtils'
import { getAgentDirectory, getAgentFilePath, ensureDirectoryExists, generateAgentFileContent, saveAgent, deleteAgent, updateAgent, openInEditor } from './../utils/fileUtils'

const execAsync = promisify(exec)

// Core constants aligned with Claude Code architecture
const AGENT_LOCATIONS = {
  USER: "user",
  PROJECT: "project",
  BUILT_IN: "built-in",
  ALL: "all"
} as const

const UI_ICONS = {
  pointer: "❯",
  checkboxOn: "☑",
  checkboxOff: "☐",
  warning: "⚠",
  separator: "─",
  loading: "◐◑◒◓"
} as const

const FOLDER_CONFIG = {
  FOLDER_NAME: ".kode",
  AGENTS_DIR: "agents"
} as const

// Tool categories for sophisticated selection
const TOOL_CATEGORIES = {
  read: ['Read', 'Glob', 'Grep', 'LS'],
  edit: ['Edit', 'MultiEdit', 'Write', 'NotebookEdit'],
  execution: ['Bash', 'BashOutput', 'KillBash'],
  web: ['WebFetch', 'WebSearch'],
  other: ['TodoWrite', 'ExitPlanMode', 'Task']
} as const

type AgentLocation = typeof AGENT_LOCATIONS[keyof typeof AGENT_LOCATIONS]

// Complete agents UI with comprehensive state management
interface AgentsUIProps {
  onExit: (message?: string) => void
}

export function AgentsUI({ onExit }: AgentsUIProps) {
  const theme = getTheme()

  // Core state management
  const [modeState, setModeState] = useState<ModeState>({
    mode: "list-agents",
    location: "all" as AgentLocation,
    active: true
  })

  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [changes, setChanges] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tools, setTools] = useState<Tool[]>([])

  // Creation state using reducer for complex flow management
  const [createState, setCreateState] = useReducer(
    (state: CreateState, action: any) => {
      switch (action.type) {
        case 'RESET':
          return {
            location: null,
            agentType: '',
            method: null,
            generationPrompt: '',
            whenToUse: '',
            selectedTools: [],
            selectedModel: null,
            selectedColor: null,
            systemPrompt: '',
            isGenerating: false,
            wasGenerated: false,
            isAIGenerated: false,
            error: null,
            warnings: [],
            agentTypeCursor: 0,
            whenToUseCursor: 0,
            promptCursor: 0,
            generationPromptCursor: 0
          }
        case 'SET_LOCATION':
          return { ...state, location: action.value }
        case 'SET_METHOD':
          return { ...state, method: action.value }
        case 'SET_AGENT_TYPE':
          return { ...state, agentType: action.value, error: null }
        case 'SET_GENERATION_PROMPT':
          return { ...state, generationPrompt: action.value }
        case 'SET_WHEN_TO_USE':
          return { ...state, whenToUse: action.value, error: null }
        case 'SET_SELECTED_TOOLS':
          return { ...state, selectedTools: action.value }
        case 'SET_SELECTED_MODEL':
          return { ...state, selectedModel: action.value }
        case 'SET_SELECTED_COLOR':
          return { ...state, selectedColor: action.value }
        case 'SET_SYSTEM_PROMPT':
          return { ...state, systemPrompt: action.value }
        case 'SET_IS_GENERATING':
          return { ...state, isGenerating: action.value }
        case 'SET_WAS_GENERATED':
          return { ...state, wasGenerated: action.value }
        case 'SET_IS_AI_GENERATED':
          return { ...state, isAIGenerated: action.value }
        case 'SET_ERROR':
          return { ...state, error: action.value }
        case 'SET_WARNINGS':
          return { ...state, warnings: action.value }
        case 'SET_CURSOR':
          return { ...state, [action.field]: action.value }
        default:
          return state
      }
    },
    {
      location: null,
      agentType: '',
      method: null,
      generationPrompt: '',
      whenToUse: '',
      selectedTools: [],
      selectedModel: null,
      selectedColor: null,
      systemPrompt: '',
      isGenerating: false,
      wasGenerated: false,
      isAIGenerated: false,
      error: null,
      warnings: [],
      agentTypeCursor: 0,
      whenToUseCursor: 0,
      promptCursor: 0,
      generationPromptCursor: 0
    }
  )

  // Load agents and tools dynamically
  const loadAgents = useCallback(async () => {
    setLoading(true)
    clearAgentCache()

    // 创建取消令牌以防止竞态条件
    const abortController = new AbortController()
    const loadingId = Date.now() // 用于标识这次加载

    try {
      const result = await getActiveAgents()

      // 检查是否仍然是当前的加载请求
      if (abortController.signal.aborted) {
        return // 组件已卸载或新的加载已开始
      }

      setAgents(result)

      // Update selectedAgent if there's one currently selected (for live reload)
      if (modeState.selectedAgent) {
        const freshSelectedAgent = result.find(a => a.agentType === modeState.selectedAgent!.agentType)
        if (freshSelectedAgent) {
          setModeState(prev => ({ ...prev, selectedAgent: freshSelectedAgent, active: true }))
        }
      }

      // Load available tools dynamically from tool registry
      const availableTools: Tool[] = []

      // Core built-in tools
      let coreTools: Tool[] = [
        {
          name: 'Read',
          description: async () => 'Read files from filesystem',
          inputSchema: null as any,
          prompt: async () => 'Read files from filesystem',
          isEnabled: async () => true,
          isReadOnly: () => true,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'Write',
          description: async () => 'Write files to filesystem',
          inputSchema: null as any,
          prompt: async () => 'Write files to filesystem',
          isEnabled: async () => true,
          isReadOnly: () => false,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'Edit',
          description: async () => 'Edit existing files',
          inputSchema: null as any,
          prompt: async () => 'Edit existing files',
          isEnabled: async () => true,
          isReadOnly: () => false,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'MultiEdit',
          description: async () => 'Make multiple edits to files',
          inputSchema: null as any,
          prompt: async () => 'Make multiple edits to files',
          isEnabled: async () => true,
          isReadOnly: () => false,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'NotebookEdit',
          description: async () => 'Edit Jupyter notebooks',
          inputSchema: null as any,
          prompt: async () => 'Edit Jupyter notebooks',
          isEnabled: async () => true,
          isReadOnly: () => false,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'Bash',
          description: async () => 'Execute bash commands',
          inputSchema: null as any,
          prompt: async () => 'Execute bash commands',
          isEnabled: async () => true,
          isReadOnly: () => false,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'Glob',
          description: async () => 'Find files matching patterns',
          inputSchema: null as any,
          prompt: async () => 'Find files matching patterns',
          isEnabled: async () => true,
          isReadOnly: () => true,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'Grep',
          description: async () => 'Search file contents',
          inputSchema: null as any,
          prompt: async () => 'Search file contents',
          isEnabled: async () => true,
          isReadOnly: () => true,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'LS',
          description: async () => 'List directory contents',
          inputSchema: null as any,
          prompt: async () => 'List directory contents',
          isEnabled: async () => true,
          isReadOnly: () => true,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'WebFetch',
          description: async () => 'Fetch web content',
          inputSchema: null as any,
          prompt: async () => 'Fetch web content',
          isEnabled: async () => true,
          isReadOnly: () => true,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'WebSearch',
          description: async () => 'Search the web',
          inputSchema: null as any,
          prompt: async () => 'Search the web',
          isEnabled: async () => true,
          isReadOnly: () => true,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        },
        {
          name: 'TodoWrite',
          description: async () => 'Manage task lists',
          inputSchema: null as any,
          prompt: async () => 'Manage task lists',
          isEnabled: async () => true,
          isReadOnly: () => false,
          isConcurrencySafe: () => true,
          needsPermissions: () => false,
          renderResultForAssistant: () => '',
          renderToolUseMessage: () => '',
          renderToolUseRejectedMessage: () => React.createElement('div'),
          call: async function* () {}
        }
      ]
      // Hide agent orchestration/self-control tools for subagent configs
      coreTools = coreTools.filter(t => t.name !== 'Task' && t.name !== 'ExitPlanMode')

      availableTools.push(...coreTools)

      // Try to load MCP tools dynamically
      try {
        const mcpTools = await getMCPTools()
        if (Array.isArray(mcpTools) && mcpTools.length > 0) {
          availableTools.push(...mcpTools)
        }
      } catch (error) {
        console.warn('Failed to load MCP tools:', error)
      }

      if (!abortController.signal.aborted) {
        setTools(availableTools)
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error('Failed to load agents:', error)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }

    // 返回取消函数供useEffect使用
    return () => abortController.abort()
  }, [])

  // Remove mock MCP loader; real MCP tools are loaded via getMCPTools()

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const load = async () => {
      cleanup = await loadAgents()
    }

    load()

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [refreshKey, loadAgents])

  // Local file watcher removed; rely on global watcher started in CLI.

  // Global keyboard handling: ESC 逐级返回
  useInput((input, key) => {
    if (!key.escape) return

    const changesSummary = changes.length > 0 ?
      `Agent changes:\n${changes.join('\n')}` : undefined

    const current = modeState.mode

    if (current === 'list-agents') {
      onExit(changesSummary)
      return
    }

    // Hierarchical back navigation
    switch (current) {
      case 'create-location':
        setModeState({ mode: 'list-agents', location: 'all' as AgentLocation, active: true })
        break
      case 'create-method':
        setModeState({ mode: 'create-location', location: modeState.location, active: true })
        break
      case 'create-generate':
        setModeState({ mode: 'create-location', location: modeState.location, active: true })
        break
      case 'create-type':
        setModeState({ mode: 'create-generate', location: modeState.location, active: true })
        break
      case 'create-prompt':
        setModeState({ mode: 'create-type', location: modeState.location, active: true })
        break
      case 'create-description':
        setModeState({ mode: 'create-prompt', location: modeState.location, active: true })
        break
      case 'create-tools':
        setModeState({ mode: 'create-description', location: modeState.location, active: true })
        break
      case 'create-model':
        setModeState({ mode: 'create-tools', location: modeState.location, active: true })
        break
      case 'create-color':
        setModeState({ mode: 'create-model', location: modeState.location, active: true })
        break
      case 'create-confirm':
        setModeState({ mode: 'create-color', location: modeState.location, active: true })
        break
      case 'agent-menu':
        setModeState({ mode: 'list-agents', location: 'all' as AgentLocation, active: true })
        break
      case 'view-agent':
        setModeState({ mode: 'agent-menu', selectedAgent: modeState.selectedAgent, active: true })
        break
      case 'edit-agent':
        setModeState({ mode: 'agent-menu', selectedAgent: modeState.selectedAgent, active: true })
        break
      case 'edit-tools':
      case 'edit-model':
      case 'edit-color':
        setModeState({ mode: 'edit-agent', selectedAgent: modeState.selectedAgent, active: true })
        break
      case 'delete-confirm':
        setModeState({ mode: 'agent-menu', selectedAgent: modeState.selectedAgent, active: true })
        break
      default:
        setModeState({ mode: 'list-agents', location: 'all' as AgentLocation, active: true })
        break
    }
  })

  // Event handlers
  const handleAgentSelect = useCallback((agent: AgentConfig) => {
    setModeState({
      mode: "agent-menu",
      location: modeState.location,
      selectedAgent: agent,
      active: true
    })
  }, [modeState])

  const handleCreateNew = useCallback(() => {
    console.log('=== STARTING AGENT CREATION FLOW ===')
    console.log('Current mode state:', modeState)
    setCreateState({ type: 'RESET' })
    console.log('Reset create state')
    setModeState({ mode: "create-location", active: true })
    console.log('Set mode to create-location')
    console.log('=== CREATE NEW HANDLER COMPLETED ===')
  }, [modeState])

  const handleAgentCreated = useCallback((message: string) => {
    setChanges(prev => [...prev, message])
    setRefreshKey(prev => prev + 1)
    setModeState({ mode: "list-agents", location: "all" as AgentLocation, active: true })
  }, [])

  const handleAgentDeleted = useCallback((message: string) => {
    setChanges(prev => [...prev, message])
    setRefreshKey(prev => prev + 1)
    setModeState({ mode: "list-agents", location: "all" as AgentLocation, active: true })
  }, [])

  if (loading) {
    return (
      <Box flexDirection="column">
        <Header title="Agents">
          <Box marginTop={1}>
            <LoadingSpinner text="Loading agents..." />
          </Box>
        </Header>
        <InstructionBar />
      </Box>
    )
  }

  // Render based on current mode
  switch (modeState.mode) {
    case "list-agents":
      return (
        <AgentListView
          location={modeState.location || "all"}
          agents={agents}
          allAgents={agents}
          onBack={() => onExit()}
          onSelect={handleAgentSelect}
          onCreateNew={handleCreateNew}
          changes={changes}
        />
      )

    case "create-location":
      return (
        <LocationSelect
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
        />
      )

    case "create-method":
      return (
        <MethodSelect
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
        />
      )

    case "create-generate":
      return (
        <GenerateStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
          existingAgents={agents}
        />
      )

    case "create-type":
      return (
        <TypeStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
          existingAgents={agents}
        />
      )

    case "create-description":
      return (
        <DescriptionStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
        />
      )

    case "create-tools":
      return (
        <ToolsStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
          tools={tools}
        />
      )

    case "create-model":
      return (
        <ModelStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
        />
      )

    case "create-color":
      return (
        <ColorStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
        />
      )

    case "create-prompt":
      return (
        <PromptStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
        />
      )

    case "create-confirm":
      return (
        <ConfirmStep
          createState={createState}
          setCreateState={setCreateState}
          setModeState={setModeState}
          tools={tools}
          onAgentCreated={handleAgentCreated}
        />
      )

    case "agent-menu":
      return (
        <AgentMenu
          agent={modeState.selectedAgent!}
          setModeState={setModeState}
        />
      )

    case "view-agent":
      return (
        <ViewAgent
          agent={modeState.selectedAgent!}
          tools={tools}
          setModeState={setModeState}
        />
      )

    case "edit-agent":
      return (
        <EditMenu
          agent={modeState.selectedAgent!}
          setModeState={setModeState}
        />
      )

    case "edit-tools":
      return (
        <EditToolsStep
          agent={modeState.selectedAgent!}
          tools={tools}
          setModeState={setModeState}
          onAgentUpdated={(message, updated) => {
            setChanges(prev => [...prev, message])
            setRefreshKey(prev => prev + 1)
            setModeState({ mode: "agent-menu", selectedAgent: updated, active: true })
          }}
        />
      )

    case "edit-model":
      return (
        <EditModelStep
          agent={modeState.selectedAgent!}
          setModeState={setModeState}
          onAgentUpdated={(message, updated) => {
            setChanges(prev => [...prev, message])
            setRefreshKey(prev => prev + 1)
            setModeState({ mode: "agent-menu", selectedAgent: updated, active: true })
          }}
        />
      )

    case "edit-color":
      return (
        <EditColorStep
          agent={modeState.selectedAgent!}
          setModeState={setModeState}
          onAgentUpdated={(message, updated) => {
            setChanges(prev => [...prev, message])
            setRefreshKey(prev => prev + 1)
            setModeState({ mode: "agent-menu", selectedAgent: updated, active: true })
          }}
        />
      )

    case "delete-confirm":
      return (
        <DeleteConfirm
          agent={modeState.selectedAgent!}
          setModeState={setModeState}
          onAgentDeleted={handleAgentDeleted}
        />
      )

    default:
      return (
        <Box flexDirection="column">
          <Header title="Agents">
            <Text>Mode: {modeState.mode} (Not implemented yet)</Text>
            <Box marginTop={1}>
              <Text>Press Esc to go back</Text>
            </Box>
          </Header>
          <InstructionBar instructions="Esc to go back" />
        </Box>
      )
  }
}