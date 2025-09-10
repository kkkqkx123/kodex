import type { ThemeNames } from '../theme'
import type { GlobalConfig, ProjectConfig, ProviderType } from './types'

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projects: {},
  allowedTools: [],
  context: {},
  history: [],
  dontCrawlDirectory: false,
  enableArchitectTool: false,
  mcpContextUris: [],
  mcpServers: {},
  approvedMcprcServers: [],
  rejectedMcprcServers: [],
  hasTrustDialogAccepted: false,
  thinkingOrder: 'thinking_first', // 默认思考内容在前
  thinkingDisplay: 'full', // 默认完整输出think内容
}

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  numStartups: 0,
  autoUpdaterStatus: 'not_configured',
  theme: 'dark' as ThemeNames,
  preferredNotifChannel: 'iterm2',
  verbose: false,
  primaryProvider: 'anthropic' as ProviderType,
  customApiKeyResponses: {
    approved: [],
    rejected: [],
  },
  stream: true,

  // New model system defaults
  modelProfiles: [],
  modelPointers: {
    main: '',
    task: '',
    reasoning: '',
    quick: '',
  },
  
  // Completion settings defaults
  completionItemsLimit: 20, // Default completion items limit
  
  // Tool error display settings defaults
  toolErrorDisplay: 'summary', // Default to summary mode for tool errors
}

export const GLOBAL_CONFIG_KEYS = [
  'autoUpdaterStatus',
  'theme',
  'hasCompletedOnboarding',
  'lastOnboardingVersion',
  'lastReleaseNotesSeen',
  'verbose',
  'customApiKeyResponses',
  'primaryProvider',
  'preferredNotifChannel',
  'shiftEnterKeyBindingInstalled',
  'maxTokens',
  'completionItemsLimit',
  'toolErrorDisplay',
] as const

export const PROJECT_CONFIG_KEYS = [
  'dontCrawlDirectory',
  'enableArchitectTool',
  'hasTrustDialogAccepted',
  'hasCompletedProjectOnboarding',
  'thinkingOrder',
  'thinkingDisplay',
] as const