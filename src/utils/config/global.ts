import { randomBytes } from 'crypto'
import type { GlobalConfig } from './types'
import { DEFAULT_GLOBAL_CONFIG } from './defaults'
import { GLOBAL_CLAUDE_FILE } from '../env'
import { getConfig, saveConfig } from './utils'
import { migrateModelProfilesRemoveId } from './models'
import { checkGate } from '../../services/featureFlags'
import { GATE_USE_EXTERNAL_UPDATER } from '../../constants/betas'

// We have to put this test code here because Jest doesn't support mocking ES modules :O
const TEST_GLOBAL_CONFIG_FOR_TESTING: GlobalConfig = {
  ...DEFAULT_GLOBAL_CONFIG,
  autoUpdaterStatus: 'disabled',
}

export function saveGlobalConfig(config: GlobalConfig): void {
  if (process.env.NODE_ENV === 'test') {
    for (const key in config) {
      TEST_GLOBAL_CONFIG_FOR_TESTING[key] = config[key]
    }
    return
  }

  // 直接保存配置（无需清除缓存，因为已移除缓存）
  saveConfig(
    GLOBAL_CLAUDE_FILE,
    {
      ...config,
      projects: getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG).projects,
    },
    DEFAULT_GLOBAL_CONFIG,
  )
}

// 临时移除缓存，确保总是获取最新配置
export function getGlobalConfig(): GlobalConfig {
  if (process.env.NODE_ENV === 'test') {
    return TEST_GLOBAL_CONFIG_FOR_TESTING
  }
  const config = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
  return migrateModelProfilesRemoveId(config)
}

export function getAnthropicApiKey(): null | string {
  return process.env.ANTHROPIC_API_KEY || null
}

export function normalizeApiKeyForConfig(apiKey: string): string {
  return apiKey?.slice(-20) ?? ''
}

export function getCustomApiKeyStatus(
  truncatedApiKey: string,
): 'approved' | 'rejected' | 'new' {
  const config = getGlobalConfig()
  if (config.customApiKeyResponses?.approved?.includes(truncatedApiKey)) {
    return 'approved'
  }
  if (config.customApiKeyResponses?.rejected?.includes(truncatedApiKey)) {
    return 'rejected'
  }
  return 'new'
}

export async function isAutoUpdaterDisabled(): Promise<boolean> {
  const useExternalUpdater = await checkGate(GATE_USE_EXTERNAL_UPDATER)
  return (
    useExternalUpdater || getGlobalConfig().autoUpdaterStatus === 'disabled'
  )
}

export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY
}

export function getOrCreateUserID(): string {
  const config = getGlobalConfig()
  if (config.userID) {
    return config.userID
  }

  const userID = randomBytes(32).toString('hex')
  saveGlobalConfig({ ...config, userID })
  return userID
}