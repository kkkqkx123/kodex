import type { ThemeNames } from '../theme'

export type McpStdioServerConfig = {
  type?: 'stdio' // Optional for backwards compatibility
  command: string
  args: string[]
  env?: Record<string, string>
}

export type McpSSEServerConfig = {
  type: 'sse'
  url: string
}

export type McpServerConfig = McpStdioServerConfig | McpSSEServerConfig

export type ProjectConfig = {
  allowedTools: string[]
  context: Record<string, string>
  contextFiles?: string[]
  history: string[]
  dontCrawlDirectory?: boolean
  enableArchitectTool?: boolean
  mcpContextUris: string[]
  mcpServers?: Record<string, McpServerConfig>
  approvedMcprcServers?: string[]
  rejectedMcprcServers?: string[]
  lastAPIDuration?: number
  lastCost?: number
  lastDuration?: number
  lastRequests?: number
  lastSessionId?: string
  exampleFiles?: string[]
  exampleFilesGeneratedAt?: number
  hasTrustDialogAccepted?: boolean
  hasCompletedProjectOnboarding?: boolean
  thinkingOrder?: 'thinking_first' | 'tools_first' // 思考内容显示顺序：thinking_first（思考在前）或 tools_first（工具在前）
  thinkingDisplay?: 'none' | 'full' | 'head_tail' // think内容显示方式：none（不输出）、full（完整输出）、head_tail（输出头尾，中间省略）
}

export type AutoUpdaterStatus =
  | 'disabled'
  | 'enabled'
  | 'no_permissions'
  | 'not_configured'

export type NotificationChannel =
  | 'iterm2'
  | 'terminal_bell'
  | 'iterm2_with_bell'
  | 'notifications_disabled'

export type ProviderType =
  | 'anthropic'
  | 'openai'
  | 'mistral'
  | 'deepseek'
  | 'kimi'
  | 'qwen'
  | 'glm'
  | 'minimax'
  | 'baidu-qianfan'
  | 'siliconflow'
  | 'bigdream'
  | 'opendev'
  | 'xai'
  | 'groq'
  | 'gemini'
  | 'ollama'
  | 'azure'
  | 'custom'
  | 'custom-openai'

// New model system types
export type ModelProfile = {
  name: string // User-friendly name
  provider: ProviderType // Provider type
  modelName: string // Primary key - actual model identifier
  baseURL?: string // Custom endpoint
  apiKey: string
  maxTokens: number // Output token limit (for GPT-5, this maps to max_completion_tokens)
  contextLength: number // Context window size
  reasoningEffort?: 'low' | 'medium' | 'high' | 'minimal' | 'medium'
  isActive: boolean // Whether profile is enabled
  createdAt: number // Creation timestamp
  lastUsed?: number // Last usage timestamp
  // 🔥 GPT-5 specific metadata
  isGPT5?: boolean // Auto-detected GPT-5 model flag
  validationStatus?: 'valid' | 'needs_repair' | 'auto_repaired' // Configuration status
  lastValidation?: number // Last validation timestamp
  // 🔧 Model list check configuration
  skipModelListCheck?: boolean // Whether to skip model list endpoint check
  modelListEndpoint?: string // Custom model list endpoint path
}

export type ModelPointerType = 'main' | 'task' | 'reasoning' | 'quick'

export type ModelPointers = {
  main: string // Main dialog model ID
  task: string // Task tool model ID
  reasoning: string // Reasoning model ID
  quick: string // Quick model ID
}

export type AccountInfo = {
  accountUuid: string
  emailAddress: string
  organizationUuid?: string
}

export type GlobalConfig = {
  projects?: Record<string, ProjectConfig>
  numStartups: number
  autoUpdaterStatus?: AutoUpdaterStatus
  userID?: string
  theme: ThemeNames
  hasCompletedOnboarding?: boolean
  // Tracks the last version that reset onboarding, used with MIN_VERSION_REQUIRING_ONBOARDING_RESET
  lastOnboardingVersion?: string
  // Tracks the last version for which release notes were seen, used for managing release notes
  lastReleaseNotesSeen?: string
  mcpServers?: Record<string, McpServerConfig>
  preferredNotifChannel: NotificationChannel
  verbose: boolean
  customApiKeyResponses?: {
    approved?: string[]
    rejected?: string[]
  }
  primaryProvider?: ProviderType
  maxTokens?: number
  hasAcknowledgedCostThreshold?: boolean
  oauthAccount?: AccountInfo
  iterm2KeyBindingInstalled?: boolean // Legacy - keeping for backward compatibility
  shiftEnterKeyBindingInstalled?: boolean
  proxy?: string
  stream?: boolean

  // New model system
  modelProfiles?: ModelProfile[] // Model configuration list
  modelPointers?: ModelPointers // Model pointer system
  defaultModelName?: string // Default model
  
  // Completion settings
  completionItemsLimit?: number // Maximum number of items to show in completion
}