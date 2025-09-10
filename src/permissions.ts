import type { CanUseToolFn } from './hooks/useCanUseTool'
import { Tool, ToolUseContext } from './Tool'
import { BashTool, inputSchema } from './tools/BashTool/BashTool'
import { FileEditTool } from './tools/FileEditTool/FileEditTool'
import { FileWriteTool } from './tools/FileWriteTool/FileWriteTool'
import { NotebookEditTool } from './tools/NotebookEditTool/NotebookEditTool'
import { generateCommandPrefixes, getCommandSubcommandPrefix, splitCommand } from './utils/commands'
import {
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
} from './utils/config.js'
import { AbortError } from './utils/errors'
import { logError } from './utils/log'
import { grantWritePermissionForOriginalDir } from './utils/permissions/filesystem'
import { getCwd } from './utils/state'
import { PRODUCT_NAME, CONFIG_FILE } from './constants/product'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { safeParseJSON } from './utils/json'

// Commands that are known to be safe for execution
const SAFE_COMMANDS = new Set([
  'git status',
  'git diff',
  'git log',
  'git branch',
  'pwd',
  'tree',
  'date',
  'which',
])

export const bashToolCommandHasExactMatchPermission = (
  tool: Tool,
  command: string,
  allowedTools: string[],
): boolean => {
  if (SAFE_COMMANDS.has(command)) {
    return true
  }
  // Check exact match first
  if (allowedTools.includes(getPermissionKey(tool, { command }, null))) {
    return true
  }
  // Check if command is an exact match with an approved prefix
  if (allowedTools.includes(getPermissionKey(tool, { command }, command))) {
    return true
  }
  return false
}

export const bashToolCommandHasPermission = (
  tool: Tool,
  command: string,
  prefix: string | null,
  allowedTools: string[],
): boolean => {
  // Check exact match first
  if (bashToolCommandHasExactMatchPermission(tool, command, allowedTools)) {
    return true
  }
  
  // Check prefix-based permissions
  if (bashToolCommandHasPrefixPermission(tool, command, allowedTools)) {
    return true
  }
  
  return allowedTools.includes(getPermissionKey(tool, { command }, prefix))
}

export const bashToolCommandHasPrefixPermission = (
  tool: Tool,
  command: string,
  allowedTools: string[],
): boolean => {
  const prefixes = generateCommandPrefixes(command)
  
  // Check if any prefix has been granted permission
  for (const prefix of prefixes) {
    const permissionKey = getPermissionKey(tool, { command: prefix }, prefix)
    if (allowedTools.includes(permissionKey)) {
      return true
    }
  }
  
  return false
}

export const bashToolHasPermission = async (
  tool: Tool,
  command: string,
  context: ToolUseContext,
  _allowedTools: string[],
  getCommandSubcommandPrefixFn = getCommandSubcommandPrefix,
): Promise<PermissionResult> => {
  // 首先检查 bashPermissionManager 的权限配置
  const { bashPermissionManager } = await import('./utils/bashPermissions')
  const bashPermissionResult = await bashPermissionManager.isCommandAllowed(command)
  
  // 如果 bashPermissionManager 明确拒绝，返回特殊的拒绝状态，触发交互式UI
  if (!bashPermissionResult.allowed) {
    return {
      result: false,
      message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`,
      shouldShowInteractiveUI: true // 标记需要显示交互式UI
    }
  }

  // 获取项目配置和项目级权限配置
  const projectConfig = getCurrentProjectConfig()
  const projectPermConfig = getProjectPermissionConfig()
  
  // 合并权限列表，项目配置文件中的权限优先级最高
  const allowedTools = [...projectConfig.allowedTools, ...projectPermConfig.allowedTools]

  if (bashToolCommandHasExactMatchPermission(tool, command, allowedTools)) {
    // This is an exact match for a command that is allowed, so we can skip the prefix check
    return { result: true }
  }

  const subCommands = splitCommand(command).filter(_ => {
    // Denim likes to add this, we strip it out so we don't need to prompt the user each time
    if (_ === `cd ${getCwd()}`) {
      return false
    }
    return true
  })
  const commandSubcommandPrefix = await getCommandSubcommandPrefixFn(
    command,
    context.abortController.signal,
  )
  if (context.abortController.signal.aborted) {
    throw new AbortError()
  }

  if (commandSubcommandPrefix === null) {
    // Fail closed and ask for user approval if the command prefix query failed (e.g. due to network error)
    // This is NOT the same as `fullCommandPrefix.commandPrefix === null`, which means no prefix was detected
    return {
      result: false,
      message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`,
    }
  }

  if (commandSubcommandPrefix.commandInjectionDetected) {
    // Only allow exact matches for potential command injections
    if (bashToolCommandHasExactMatchPermission(tool, command, allowedTools)) {
      return { result: true }
    } else {
      return {
        result: false,
        message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`,
      }
    }
  }

  // If there is only one command, no need to process subCommands
  if (subCommands.length < 2) {
    if (
      bashToolCommandHasPermission(
        tool,
        command,
        commandSubcommandPrefix.commandPrefix,
        allowedTools,
      )
    ) {
      return { result: true }
    } else {
      return {
        result: false,
        message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`,
      }
    }
  }
  if (
    subCommands.every(subCommand => {
      const prefixResult =
        commandSubcommandPrefix.subcommandPrefixes.get(subCommand)
      if (prefixResult === undefined || prefixResult.commandInjectionDetected) {
        // If prefix result is missing or command injection is detected, always ask for permission
        return false
      }
      const hasPermission = bashToolCommandHasPermission(
        tool,
        subCommand,
        prefixResult ? prefixResult.commandPrefix : null,
        allowedTools,
      )
      return hasPermission
    })
  ) {
    return { result: true }
  }
  return {
    result: false,
    message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`,
  }
}

type PermissionResult = { result: true } | { result: false; message: string; shouldShowInteractiveUI?: boolean }

export const hasPermissionsToUseTool: CanUseToolFn = async (
  tool,
  input,
  context,
  _assistantMessage,
): Promise<PermissionResult> => {
  // If safe mode is not enabled, allow all tools (permissive by default)
  if (!context.options.safeMode) {
    return { result: true }
  }

  if (context.abortController.signal.aborted) {
    throw new AbortError()
  }

  // Check if the tool needs permissions
  try {
    if (!tool.needsPermissions(input as never)) {
      return { result: true }
    }
  } catch (e) {
    logError(`Error checking permissions: ${e}`)
    return { result: false, message: 'Error checking permissions' }
  }

  const projectConfig = getCurrentProjectConfig()
  const permissionKey = getPermissionKey(tool, input, null)

  // 工具级别权限检查 - 检查是否有权使用BashTool本身
  const projectPermConfig = getProjectPermissionConfig()
  if (tool === BashTool && projectPermConfig.allowedTools.includes(BashTool.name)) {
    // 如果有BashTool使用权，则允许进入命令级别检查
    return { result: true }
  }

  // 检查项目配置文件中的权限设置（优先级最高）
  if (projectConfig.allowedTools.includes(permissionKey)) {
    return { result: true }
  }

  // 检查项目级权限（从 .kode/permissions.json）
  if (projectPermConfig.allowedTools.includes(permissionKey)) {
    return { result: true }
  }

  // 检查会话权限
  if (projectConfig.sessionAllowedTools?.includes(permissionKey)) {
    return { result: true }
  }

  // 检查单次权限
  const onceTimestamp = projectConfig.onceAllowedTools?.[permissionKey]
  if (onceTimestamp && Date.now() - onceTimestamp < 5000) { // 5秒有效期
    return { result: true }
  }

  // 其他工具的权限检查
  switch (tool) {
    // For bash tool, delegate to bashToolHasPermission for command-level checking
    case BashTool: {
      if (input && typeof input === 'object' && 'command' in input) {
        const allowedTools = [...projectConfig.allowedTools, ...getProjectPermissionConfig().allowedTools]
        return await bashToolHasPermission(tool, input.command as string, context, allowedTools)
      }
      return { result: true }
    }
    // For file editing tools, check session-only permissions
    case FileEditTool:
    case FileWriteTool:
    case NotebookEditTool: {
      if (!tool.needsPermissions(input)) {
        return { result: true }
      }
      return {
        result: false,
        message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`,
      }
    }
    // For other tools, check persistent permissions
    default: {
      return {
        result: false,
        message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`,
      }
    }
  }
}

// 项目级权限配置文件管理
interface ProjectPermissionConfig {
  allowedTools: string[]
  sessionAllowedTools?: string[]
  onceAllowedTools?: Record<string, number>
}

function getProjectPermissionConfigPath(): string {
  const cwd = getCwd()
  return join(cwd, '.kode', 'permissions.json')
}

function getProjectPermissionConfig(): ProjectPermissionConfig {
  const configPath = getProjectPermissionConfigPath()
  
  if (!existsSync(configPath)) {
    return { allowedTools: [] }
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8')
    const config = safeParseJSON(content) as ProjectPermissionConfig | null
    
    if (!config) {
      return { allowedTools: [] }
    }
    
    // 确保 allowedTools 是数组
    if (!config.allowedTools || !Array.isArray(config.allowedTools)) {
      config.allowedTools = []
    }
    
    return config
  } catch (error) {
    logError(`Error reading project permission config: ${error}`)
    return { allowedTools: [] }
  }
}

function saveProjectPermissionConfig(config: ProjectPermissionConfig): void {
  const configPath = getProjectPermissionConfigPath()
  const configDir = dirname(configPath)
  
  // 确保目录存在
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  
  // 过滤掉默认值，只保存实际配置的值
  const defaultConfig: ProjectPermissionConfig = { allowedTools: [] }
  const filteredConfig = Object.fromEntries(
    Object.entries(config).filter(
      ([key, value]) =>
        JSON.stringify(value) !== JSON.stringify(defaultConfig[key as keyof ProjectPermissionConfig]),
    ),
  )
  
  writeFileSync(configPath, JSON.stringify(filteredConfig, null, 2), 'utf-8')
}

export async function savePermission(
  tool: Tool,
  input: { [k: string]: unknown },
  prefix: string | null,
  permissionType: 'project' | 'session' | 'once' = 'project'
): Promise<void> {
  const key = getPermissionKey(tool, input, prefix)

  // For file editing tools, store write permissions only in memory
  if (
    tool === FileEditTool ||
    tool === FileWriteTool ||
    tool === NotebookEditTool
  ) {
    grantWritePermissionForOriginalDir()
    return
  }

  switch (permissionType) {
    case 'project':
      // 项目级权限 - 写入 .kode/permissions.json 和项目配置文件
      const projectPermConfig = getProjectPermissionConfig()
      const projectConfigForProject = getCurrentProjectConfig()
      
      // 更新 .kode/permissions.json
      if (!projectPermConfig.allowedTools.includes(key)) {
        projectPermConfig.allowedTools.push(key)
        projectPermConfig.allowedTools.sort()
        saveProjectPermissionConfig(projectPermConfig)
      }
      
      // 更新项目配置文件
      if (!projectConfigForProject.allowedTools.includes(key)) {
        projectConfigForProject.allowedTools.push(key)
        projectConfigForProject.allowedTools.sort()
        saveCurrentProjectConfig(projectConfigForProject)
      }
      break
      
    case 'session':
      // 会话内权限 - 仍然保存在项目配置中
      const projectConfigForSession = getCurrentProjectConfig()
      if (!projectConfigForSession.sessionAllowedTools) {
        projectConfigForSession.sessionAllowedTools = []
      }
      if (!projectConfigForSession.sessionAllowedTools.includes(key)) {
        projectConfigForSession.sessionAllowedTools.push(key)
        saveCurrentProjectConfig(projectConfigForSession)
      }
      break
      
    case 'once':
      // 单次权限 - 仍然保存在项目配置中
      const projectConfigForOnce = getCurrentProjectConfig()
      if (!projectConfigForOnce.onceAllowedTools) {
        projectConfigForOnce.onceAllowedTools = {}
      }
      projectConfigForOnce.onceAllowedTools[key] = Date.now()
      saveCurrentProjectConfig(projectConfigForOnce)
      break
  }
}

function getPermissionKey(
  tool: Tool,
  input: { [k: string]: unknown },
  prefix: string | null,
): string {
  switch (tool) {
    case BashTool:
      if (prefix) {
        return `${BashTool.name}(${prefix}:*)`
      }
      return `${BashTool.name}(${BashTool.renderToolUseMessage(input as never)})`
    default:
      return tool.name
  }
}
