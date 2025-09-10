import { resolve } from 'path'
import { homedir } from 'os'
import type { ProjectConfig } from './types'
import { DEFAULT_PROJECT_CONFIG } from './defaults'
import { GLOBAL_CLAUDE_FILE } from '../env'
import { getCwd } from '../state'
import { safeParseJSON } from '../json'
import { getConfig, saveConfig } from './utils'
import { loadProjectConfig } from '../configLoader'

const TEST_PROJECT_CONFIG_FOR_TESTING: ProjectConfig = {
  ...DEFAULT_PROJECT_CONFIG,
}

export function defaultConfigForProject(projectPath: string): ProjectConfig {
  const config = { ...DEFAULT_PROJECT_CONFIG }
  if (projectPath === homedir()) {
    config.dontCrawlDirectory = true
  }
  return config
}

export function getCurrentProjectConfig(): ProjectConfig {
  if (process.env.NODE_ENV === 'test') {
    return TEST_PROJECT_CONFIG_FOR_TESTING
  }

  const absolutePath = resolve(getCwd())
  
  // 首先尝试加载项目级.kode配置
  const projectConfig = loadProjectConfig()
  if (projectConfig) {
    // 合并项目配置到默认配置
    const mergedConfig = { ...defaultConfigForProject(absolutePath), ...projectConfig }
    
    // 处理allowedTools字段的字符串格式兼容性
    if (typeof mergedConfig.allowedTools === 'string') {
      mergedConfig.allowedTools =
        (safeParseJSON(mergedConfig.allowedTools) as string[]) ?? []
    }
    
    return mergedConfig
  }

  // 如果没有项目级配置，回退到全局配置
  const config = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_PROJECT_CONFIG)

  if (!config.projects) {
    return defaultConfigForProject(absolutePath)
  }

  const globalProjectConfig =
    config.projects[absolutePath] ?? defaultConfigForProject(absolutePath)
  // Not sure how this became a string
  // TODO: Fix upstream
  if (typeof globalProjectConfig.allowedTools === 'string') {
    globalProjectConfig.allowedTools =
      (safeParseJSON(globalProjectConfig.allowedTools) as string[]) ?? []
  }
  return globalProjectConfig
}

export function saveCurrentProjectConfig(projectConfig: ProjectConfig): void {
  if (process.env.NODE_ENV === 'test') {
    for (const key in projectConfig) {
      TEST_PROJECT_CONFIG_FOR_TESTING[key] = projectConfig[key]
    }
    return
  }
  const config = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_PROJECT_CONFIG)
  saveConfig(
    GLOBAL_CLAUDE_FILE,
    {
      ...config,
      projects: {
        ...config.projects,
        [resolve(getCwd())]: projectConfig,
      },
    },
    DEFAULT_PROJECT_CONFIG,
  )
}

export function checkHasTrustDialogAccepted(): boolean {
  let currentPath = getCwd()
  const config = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_PROJECT_CONFIG)

  while (true) {
    const projectConfig = config.projects?.[currentPath]
    if (projectConfig?.hasTrustDialogAccepted) {
      return true
    }
    const parentPath = resolve(currentPath, '..')
    // Stop if we've reached the root (when parent is same as current)
    if (parentPath === currentPath) {
      break
    }
    currentPath = parentPath
  }

  return false
}