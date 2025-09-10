import React from 'react'
import { Box, Text, useInput } from 'ink'
import InkTextInput from 'ink-text-input'
import { getActiveAgents, clearAgentCache } from '../utils/agentLoader'
import { AgentConfig } from '../utils/agentLoader'
import { writeFileSync, unlinkSync, mkdirSync, existsSync, readFileSync, renameSync } from 'fs'
import { join } from 'path'
import * as path from 'path'
import { homedir } from 'os'
import * as os from 'os'
import { getCwd } from '../utils/state'
import { getTheme } from '../utils/theme'
import matter from 'gray-matter'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { watch, FSWatcher } from 'fs'
import { getMCPTools } from '../services/mcpClient'
import { getModelManager } from '../utils/model'
import { randomUUID } from 'crypto'
import { Command } from '../commands'

// Import components from src/agents
import { Header } from '../agents/components/common/Header'
import { InstructionBar } from '../agents/components/common/InstructionBar'
import { SelectList } from '../agents/components/common/SelectList'
import { MultilineTextInput } from '../agents/components/common/MultilineTextInput'
import { LoadingSpinner } from '../agents/components/common/LoadingSpinner'
import { AgentsUI } from '../agents/components/AgentsUI'

// Import utilities from src/agents
import {
  getDisplayModelName,
  generateAgentWithClaude,
  validateAgentType,
  validateAgentConfig,
  getAgentDirectory,
  getAgentFilePath,
  ensureDirectoryExists,
  generateAgentFileContent,
  saveAgent,
  deleteAgent,
  openInEditor,
  updateAgent
} from '../agents/utils'

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

// Models will be listed dynamically from ModelManager

// Comprehensive mode state for complete UI flow
type ModeState = {
  mode: 'list-agents' | 'create-location' | 'create-method' | 'create-generate' | 'create-type' |
        'create-description' | 'create-tools' | 'create-model' | 'create-color' | 'create-prompt' | 'create-confirm' |
        'agent-menu' | 'view-agent' | 'edit-agent' | 'edit-tools' | 'edit-model' | 'edit-color' | 'delete-confirm'
  location?: AgentLocation
  selectedAgent?: AgentConfig
  previousMode?: ModeState
  [key: string]: any
}

// State for agent creation flow
type CreateState = {
  location: AgentLocation | null
  agentType: string
  method: 'generate' | 'manual' | null
  generationPrompt: string
  whenToUse: string
  selectedTools: string[]
  selectedModel: string | null // null for inherit, or model profile modelName
  selectedColor: string | null
  systemPrompt: string
  isGenerating: boolean
  wasGenerated: boolean
  isAIGenerated: boolean
  error: string | null
  warnings: string[]
  // Cursor positions for text inputs
  agentTypeCursor: number
  whenToUseCursor: number
  promptCursor: number
  generationPromptCursor: number
}

type Tool = {
  name: string
  description?: string | (() => Promise<string>)
}

// Create the command object that conforms to the Command type
const agents = {
  type: 'local-jsx',
  name: 'agents',
  description: 'Manage AI agents',
  isEnabled: true,
  isHidden: false,
  async call(onDone) {
    return <AgentsUI onExit={onDone} />;
  },
  userFacingName() {
    return 'agents';
  },
} satisfies Command;

export default agents;
