// Type exports
export type {
  McpStdioServerConfig,
  McpSSEServerConfig,
  McpServerConfig,
  ProjectConfig,
  AutoUpdaterStatus,
  NotificationChannel,
  ProviderType,
  ModelProfile,
  ModelPointerType,
  ModelPointers,
  AccountInfo,
  GlobalConfig,
} from './types'

// Default config exports
export {
  DEFAULT_PROJECT_CONFIG,
  DEFAULT_GLOBAL_CONFIG,
  GLOBAL_CONFIG_KEYS,
  PROJECT_CONFIG_KEYS,
} from './defaults'

// MCP exports
export {
  TEST_MCPRC_CONFIG_FOR_TESTING,
  clearMcprcConfigForTesting,
  addMcprcServerForTesting,
  removeMcprcServerForTesting,
  getMcprcConfig,
} from './mcp'

// Models exports
export {
  migrateModelProfilesRemoveId,
  setAllPointersToModel,
  setModelPointer,
  isGPT5ModelName,
  validateAndRepairGPT5Profile,
  validateAndRepairAllGPT5Profiles,
  getGPT5ConfigRecommendations,
  createGPT5ModelProfile,
} from './models'

// Project exports
export {
  defaultConfigForProject,
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
  checkHasTrustDialogAccepted,
} from './project'

// Global exports
export {
  saveGlobalConfig,
  getGlobalConfig,
  getAnthropicApiKey,
  normalizeApiKeyForConfig,
  getCustomApiKeyStatus,
  isAutoUpdaterDisabled,
  getOpenAIApiKey,
  getOrCreateUserID,
} from './global'

// Utils exports
export {
  enableConfigs,
  getConfig,
  saveConfig,
  isAutoUpdaterStatus,
  isGlobalConfigKey,
  isProjectConfigKey,
  getConfigForCLI,
  setConfigForCLI,
  deleteConfigForCLI,
  listConfigForCLI,
} from './utils'