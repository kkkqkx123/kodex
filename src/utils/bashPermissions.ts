import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { safeParseJSON } from './json'
import { logError } from './log'
import { getCwd } from './state'

export interface BashPermissionConfig {
  // 覆盖硬编码的banned命令列表
  overrideBannedCommands?: string[]
  
  // 基于前缀的命令授权
  prefixPermissions?: PrefixPermission[]
  
  // 全局允许的命令（忽略banned列表）
  globallyAllowedCommands?: string[]
  
  // 全局禁止的命令（即使在prefixPermissions中也被禁止）
  globallyBannedCommands?: string[]
  
  // 是否启用严格模式（默认false）
  strictMode?: boolean
}

export interface PrefixPermission {
  prefix: string
  description?: string
  allowed: boolean
  // 可选：限制该前缀只能用于特定参数模式
  allowedArgs?: string[]
  // 可选：限制该前缀的使用范围
  scope?: 'global' | 'project' | 'session'
}

// 默认的bash权限配置
const DEFAULT_BASH_PERMISSIONS: BashPermissionConfig = {
  overrideBannedCommands: [],
  prefixPermissions: [],
  globallyAllowedCommands: [],
  globallyBannedCommands: [],
  strictMode: false
}

class BashPermissionManager {
  private globalConfigPath: string
  private projectConfigPath: string
  private cache: { global: BashPermissionConfig | null; project: BashPermissionConfig | null; timestamp: number } = {
    global: null,
    project: null,
    timestamp: 0
  }
  private readonly CACHE_TTL = 5000 // 5秒缓存

  constructor() {
    this.globalConfigPath = join(homedir(), '.kode', 'bashPermissions.json')
    this.projectConfigPath = join(getCwd(), '.kode', 'bashPermissions.json')
  }

  /**
   * 获取合并后的bash权限配置
   * 优先级：项目配置 > 全局配置 > 默认配置
   */
  getMergedConfig(): BashPermissionConfig {
    const now = Date.now()
    
    // 检查缓存
    if (now - this.cache.timestamp < this.CACHE_TTL && this.cache.global && this.cache.project) {
      return this.mergeConfigs(this.cache.global, this.cache.project)
    }

    // 加载配置
    const globalConfig = this.loadConfig(this.globalConfigPath)
    const projectConfig = this.loadConfig(this.projectConfigPath)
    
    // 更新缓存
    this.cache = { global: globalConfig, project: projectConfig, timestamp: now }
    
    return this.mergeConfigs(globalConfig, projectConfig)
  }

  /**
   * 检查命令是否被允许
   */
  async isCommandAllowed(command: string): Promise<{ allowed: boolean; reason?: string }> {
    const config = this.getMergedConfig()
    const baseCommand = command.split(' ')[0].toLowerCase()

    // 1. 检查全局禁止命令（最高优先级）
    if (config.globallyBannedCommands?.includes(baseCommand)) {
      return { allowed: false, reason: `Command '${baseCommand}' is globally banned` }
    }

    // 2. 检查全局允许命令（跳过所有检查）
    if (config.globallyAllowedCommands?.includes(baseCommand)) {
      return { allowed: true }
    }

    // 3. 检查前缀权限
    const prefixPermission = this.findPrefixPermission(command, config.prefixPermissions || [])
    if (prefixPermission) {
      if (prefixPermission.allowed) {
        // 检查参数限制
        if (prefixPermission.allowedArgs && !this.checkArgsAllowed(command, prefixPermission.allowedArgs)) {
          return { allowed: false, reason: `Command arguments not allowed for prefix '${prefixPermission.prefix}'` }
        }
        return { allowed: true }
      } else {
        return { allowed: false, reason: `Command prefix '${prefixPermission.prefix}' is not allowed` }
      }
    }

    // 4. 检查是否在覆盖的banned列表中
    const effectiveBannedCommands = await this.getEffectiveBannedCommands(config)
    if (effectiveBannedCommands.includes(baseCommand)) {
      return { allowed: false, reason: `Command '${baseCommand}' is not allowed for security reasons` }
    }

    // 5. 默认允许（除非在严格模式下）
    if (config.strictMode) {
      return { allowed: false, reason: `Command '${baseCommand}' is not explicitly allowed in strict mode` }
    }

    return { allowed: true }
  }

  /**
   * 保存配置
   */
  saveConfig(config: BashPermissionConfig, scope: 'global' | 'project' = 'project'): void {
    const configPath = scope === 'global' ? this.globalConfigPath : this.projectConfigPath
    const configDir = dirname(configPath)
    
    // 确保目录存在
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }
    
    // 过滤掉默认值
    const filteredConfig = this.filterDefaultValues(config)
    
    writeFileSync(configPath, JSON.stringify(filteredConfig, null, 2), 'utf-8')
    
    // 清除缓存
    this.cache.timestamp = 0
  }

  /**
   * 添加前缀权限
   */
  addPrefixPermission(permission: PrefixPermission, scope: 'global' | 'project' = 'project'): void {
    const config = this.getMergedConfig()
    if (!config.prefixPermissions) {
      config.prefixPermissions = []
    }
    
    // 移除已存在的相同前缀
    config.prefixPermissions = config.prefixPermissions.filter(p => p.prefix !== permission.prefix)
    
    // 添加新的权限
    config.prefixPermissions.push(permission)
    
    this.saveConfig(config, scope)
  }

  /**
   * 移除前缀权限
   */
  removePrefixPermission(prefix: string, scope: 'global' | 'project' = 'project'): void {
    const config = this.getMergedConfig()
    if (config.prefixPermissions) {
      config.prefixPermissions = config.prefixPermissions.filter(p => p.prefix !== prefix)
      this.saveConfig(config, scope)
    }
  }

  private loadConfig(configPath: string): BashPermissionConfig {
    if (!existsSync(configPath)) {
      return { ...DEFAULT_BASH_PERMISSIONS }
    }
    
    try {
      const content = readFileSync(configPath, 'utf-8')
      const config = safeParseJSON(content) as BashPermissionConfig | null
      
      if (!config) {
        return { ...DEFAULT_BASH_PERMISSIONS }
      }
      
      // 验证配置结构
      return this.validateConfig(config)
    } catch (error) {
      logError(`Error reading bash permission config from ${configPath}: ${error}`)
      return { ...DEFAULT_BASH_PERMISSIONS }
    }
  }

  private mergeConfigs(global: BashPermissionConfig, project: BashPermissionConfig): BashPermissionConfig {
    return {
      overrideBannedCommands: project.overrideBannedCommands || global.overrideBannedCommands,
      prefixPermissions: [...(global.prefixPermissions || []), ...(project.prefixPermissions || [])],
      globallyAllowedCommands: project.globallyAllowedCommands || global.globallyAllowedCommands,
      globallyBannedCommands: project.globallyBannedCommands || global.globallyBannedCommands,
      strictMode: project.strictMode !== undefined ? project.strictMode : global.strictMode
    }
  }

  private validateConfig(config: any): BashPermissionConfig {
    const result: BashPermissionConfig = { ...DEFAULT_BASH_PERMISSIONS }
    
    if (config.overrideBannedCommands && Array.isArray(config.overrideBannedCommands)) {
      result.overrideBannedCommands = config.overrideBannedCommands
    }
    
    if (config.prefixPermissions && Array.isArray(config.prefixPermissions)) {
      result.prefixPermissions = config.prefixPermissions.filter(p => 
        p && typeof p.prefix === 'string' && typeof p.allowed === 'boolean'
      )
    }
    
    if (config.globallyAllowedCommands && Array.isArray(config.globallyAllowedCommands)) {
      result.globallyAllowedCommands = config.globallyAllowedCommands
    }
    
    if (config.globallyBannedCommands && Array.isArray(config.globallyBannedCommands)) {
      result.globallyBannedCommands = config.globallyBannedCommands
    }
    
    if (typeof config.strictMode === 'boolean') {
      result.strictMode = config.strictMode
    }
    
    return result
  }

  private filterDefaultValues(config: BashPermissionConfig): Partial<BashPermissionConfig> {
    const filtered: Partial<BashPermissionConfig> = {}
    
    if (config.overrideBannedCommands && config.overrideBannedCommands.length > 0) {
      filtered.overrideBannedCommands = config.overrideBannedCommands
    }
    
    if (config.prefixPermissions && config.prefixPermissions.length > 0) {
      filtered.prefixPermissions = config.prefixPermissions
    }
    
    if (config.globallyAllowedCommands && config.globallyAllowedCommands.length > 0) {
      filtered.globallyAllowedCommands = config.globallyAllowedCommands
    }
    
    if (config.globallyBannedCommands && config.globallyBannedCommands.length > 0) {
      filtered.globallyBannedCommands = config.globallyBannedCommands
    }
    
    if (config.strictMode !== undefined && config.strictMode !== false) {
      filtered.strictMode = config.strictMode
    }
    
    return filtered
  }

  private findPrefixPermission(command: string, permissions: PrefixPermission[]): PrefixPermission | null {
    // 按前缀长度降序排列，确保更具体的前缀优先匹配
    const sortedPermissions = [...permissions].sort((a, b) => b.prefix.length - a.prefix.length)
    
    for (const permission of sortedPermissions) {
      if (command.startsWith(permission.prefix)) {
        return permission
      }
    }
    
    return null
  }

  private checkArgsAllowed(command: string, allowedArgs: string[]): boolean {
    const args = command.split(' ').slice(1)
    // If no arguments provided, check if empty arguments are allowed
    if (args.length === 0) {
      return allowedArgs.includes('') || allowedArgs.includes('*')
    }
    // Check if any argument matches any allowed pattern
    return args.some(arg => 
      allowedArgs.some(allowed => {
        if (allowed === '*') return true
        if (allowed.startsWith('*') && allowed.endsWith('*')) {
          return arg.includes(allowed.slice(1, -1))
        } else if (allowed.startsWith('*')) {
          return arg.endsWith(allowed.slice(1))
        } else if (allowed.endsWith('*')) {
          return arg.startsWith(allowed.slice(0, -1))
        } else {
          return arg === allowed || arg.includes(allowed)
        }
      })
    )
  }

  private async getEffectiveBannedCommands(config: BashPermissionConfig): Promise<string[]> {
    // 如果配置了覆盖列表，使用覆盖列表
    if (config.overrideBannedCommands && config.overrideBannedCommands.length > 0) {
      return config.overrideBannedCommands
    }
    
    // 否则使用默认的banned命令列表
    const { BANNED_COMMANDS } = await import('../tools/BashTool/prompt')
    return BANNED_COMMANDS
  }
}

// 导出单例实例
export const bashPermissionManager = new BashPermissionManager()