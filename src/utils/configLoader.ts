import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { getCwd } from './state'
import { CONFIG_FILE } from '../constants/product'

export interface ConfigSearchPath {
  path: string
  scope: 'global' | 'project'
  type: '.kode'
}

export interface CommandConfig {
  prompt?: string
  enabled?: boolean
  usesLLMApi?: boolean
  [key: string]: any
}

export interface CommandMetadata {
  name: string
  usesLLMApi: boolean
}

/**
 * 获取配置搜索路径，按优先级排序
 */
export function getConfigSearchPaths(commandName: string): ConfigSearchPath[] {
  const cwd = getCwd()
  const home = homedir()

  return [
    // Project .kode/commands (highest priority)
    { path: join(cwd, '.kode', 'commands', `${commandName}.json`), scope: 'project', type: '.kode' },
    // Global .kode/commands (lower priority)
    { path: join(home, '.kode', 'commands', `${commandName}.json`), scope: 'global', type: '.kode' },
  ]
}

/**
 * 获取项目配置搜索路径，按优先级排序
 */
export function getProjectConfigSearchPaths(): string[] {
  const cwd = getCwd()
  
  return [
    // Project .kode/config.json (highest priority)
    join(cwd, '.kode', CONFIG_FILE),
  ]
}

/**
 * 加载命令配置，按优先级合并
 */
export function loadCommandConfig(commandName: string, metadata?: CommandMetadata): CommandConfig | null {
  const searchPaths = getConfigSearchPaths(commandName)
  
  // 如果命令不需要推理，直接返回null，不扫描配置文件
  if (metadata && !metadata.usesLLMApi) {
    return null
  }

  let mergedConfig: CommandConfig = {}
  let found = false

  for (const { path } of searchPaths) {
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8')
        const config = JSON.parse(content) as CommandConfig
        
        // 合并配置，后面的覆盖前面的
        mergedConfig = { ...mergedConfig, ...config }
        found = true
      } catch (error) {
        console.warn(`Failed to load config from ${path}:`, error)
      }
    }
  }

  return found ? mergedConfig : null
}

/**
 * 加载项目配置，按优先级合并
 */
export function loadProjectConfig(): Record<string, any> | null {
  const searchPaths = getProjectConfigSearchPaths()
  
  let mergedConfig: Record<string, any> = {}
  let found = false

  for (const path of searchPaths) {
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8')
        const config = JSON.parse(content) as Record<string, any>
        
        // 合并配置，后面的覆盖前面的
        mergedConfig = { ...mergedConfig, ...config }
        found = true
      } catch (error) {
        console.warn(`Failed to load project config from ${path}:`, error)
      }
    }
  }

  return found ? mergedConfig : null
}

/**
 * 加载自定义提示词
 */
export function loadCustomPrompt(commandName: string, metadata?: CommandMetadata): string | null {
  const config = loadCommandConfig(commandName, metadata)
  return config?.prompt || null
}

/**
 * 获取命令元数据
 */
export function getCommandMetadata(commandName: string, usesLLMApi: boolean = true): CommandMetadata {
  return {
    name: commandName,
    usesLLMApi
  }
}

/**
 * 检查命令是否启用
 */
export function isCommandEnabled(commandName: string, metadata?: CommandMetadata): boolean {
  const config = loadCommandConfig(commandName, metadata)
  return config?.enabled !== false // 默认启用
}