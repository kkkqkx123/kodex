import { loadCommandConfig, getCommandMetadata, CommandMetadata } from './configLoader'
import type { Command } from '../commands'

export type EnhancedCommand = Command & {
  metadata?: CommandMetadata
  usesLLMApi?: boolean
}

/**
 * 为命令添加元数据
 */
export function enhanceCommandWithConfig(
  command: Command,
  usesLLMApi: boolean = true
): EnhancedCommand {
  const metadata = getCommandMetadata(command.name, usesLLMApi)
  
  return {
    ...command,
    metadata,
    usesLLMApi
  }
}

/**
 * 获取命令的完整配置
 */
export function getFullCommandConfig(
  commandName: string,
  usesLLMApi: boolean = true
) {
  const metadata = getCommandMetadata(commandName, usesLLMApi)
  const config = loadCommandConfig(commandName, metadata)
  
  return {
    metadata,
    config,
    isEnabled: !config || config.enabled !== false
  }
}

/**
 * 检查命令是否被禁用
 */
export function isCommandDisabled(commandName: string, usesLLMApi: boolean = true): boolean {
  const { config } = getFullCommandConfig(commandName, usesLLMApi)
  return config?.enabled === false
}

/**
 * 获取命令的自定义提示词
 */
export function getCommandPrompt(
  commandName: string,
  defaultPrompt: string,
  usesLLMApi: boolean = true
): string {
  const { config } = getFullCommandConfig(commandName, usesLLMApi)
  return config?.prompt || defaultPrompt
}

/**
 * 批量增强多个命令
 */
export function enhanceCommandsWithConfig(
  commands: Command[],
  llmApiMap?: Record<string, boolean>
): EnhancedCommand[] {
  return commands.map(cmd => {
    const usesLLMApi = llmApiMap?.[cmd.name] ?? true
    return enhanceCommandWithConfig(cmd, usesLLMApi)
  })
}