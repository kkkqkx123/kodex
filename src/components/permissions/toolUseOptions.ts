import { type Option } from '@inkjs/ui'
import chalk from 'chalk'
import {
  type ToolUseConfirm,
  toolUseConfirmGetPrefix,
} from './PermissionRequest.js'
import { generateCommandPrefixes, isUnsafeCompoundCommand } from '../../utils/commands'
import { getCwd } from '../../utils/state'
import { getTheme } from '../../utils/theme'
import { type OptionSubtree } from '../CustomSelect/select'
import { getCurrentProjectConfig } from '../../utils/config'

/**
 * Generates options for the tool use confirmation dialog
 */
export function toolUseOptions({
  toolUseConfirm,
  command,
}: {
  toolUseConfirm: ToolUseConfirm
  command: string
}): (Option | OptionSubtree)[] {
  // 检查是否有权限处理配置
  const projectConfig = getCurrentProjectConfig()
  const permissionHandling = projectConfig.permissionHandling
  
  // 如果有权限处理配置，使用增强选项
  if (permissionHandling) {
    return enhancedToolUseOptions({
      toolUseConfirm,
      command,
      permissionHandling,
      commandPrefix: toolUseConfirmGetPrefix(toolUseConfirm)
    })
  }
  
  // Hide "don't ask again" options if the command is an unsafe compound command, or a potential command injection
  const showDontAskAgainOption =
    !isUnsafeCompoundCommand(command) &&
    toolUseConfirm.commandPrefix &&
    !toolUseConfirm.commandPrefix.commandInjectionDetected
  const prefix = toolUseConfirmGetPrefix(toolUseConfirm)
  const showDontAskAgainPrefixOption = showDontAskAgainOption && prefix !== null

  let dontShowAgainOptions: (Option | OptionSubtree)[] = []
  
  // 生成命令的所有可能前缀
  const commandPrefixes = generateCommandPrefixes(command)
  
  if (showDontAskAgainPrefixOption) {
    // Prefix option takes precedence over full command option
    dontShowAgainOptions = [
      {
        label: `Yes, and don't ask again for ${chalk.bold(prefix)} commands in ${chalk.bold(getCwd())}`,
        value: 'yes-dont-ask-again-prefix',
      },
    ]
    
    // 添加基于前缀匹配的选项（仅用于项目级和会话级授权）
    const prefixMatchOptions = commandPrefixes
      .filter(p => p !== command && p !== prefix) // 排除完整命令和当前前缀
      .map(prefix => ({
        label: `Yes, and don't ask again for ${chalk.bold(prefix)}:* commands in ${chalk.bold(getCwd())}`,
        value: `yes-dont-ask-again-prefix:${prefix}`,
      }))
    
    dontShowAgainOptions = [...dontShowAgainOptions, ...prefixMatchOptions]
  } else if (showDontAskAgainOption) {
    dontShowAgainOptions = [
      {
        label: `Yes, and don't ask again for ${chalk.bold(command)} commands in ${chalk.bold(getCwd())}`,
        value: 'yes-dont-ask-again-full',
      },
    ]
    
    // 添加基于前缀匹配的选项（仅用于项目级和会话级授权）
    const prefixMatchOptions = commandPrefixes
      .filter(p => p !== command) // 排除完整命令
      .map(prefix => ({
        label: `Yes, and don't ask again for ${chalk.bold(prefix)}:* commands in ${chalk.bold(getCwd())}`,
        value: `yes-dont-ask-again-prefix:${prefix}`,
      }))
    
    dontShowAgainOptions = [...dontShowAgainOptions, ...prefixMatchOptions]
  }

  return [
    {
      label: 'Yes', // 单次授权只支持完整命令
      value: 'yes',
    },
    ...dontShowAgainOptions,
    {
      label: `No, and provide instructions (${chalk.bold.hex(getTheme().warning)('esc')})`,
      value: 'no',
    },
  ]
}

/**
 * Generates enhanced options for the tool use confirmation dialog with prefix matching and分级 authorization
 */
export function enhancedToolUseOptions({
  toolUseConfirm,
  command,
  permissionHandling,
  commandPrefix,
}: {
  toolUseConfirm: ToolUseConfirm
  command: string
  permissionHandling?: any
  commandPrefix?: string | null
}): (Option | OptionSubtree)[] {
  const theme = getTheme()
  const options: (Option | OptionSubtree)[] = []

  // 根据配置添加选项
  if (permissionHandling?.grantSession) {
    options.push({
      label: `允许（仅本次会话）`,
      value: 'grant-session'
    })
  }

  if (permissionHandling?.grantProject) {
    options.push({
      label: `允许（全局）`,
      value: 'grant-project'
    })
  }

  if (permissionHandling?.grantOnce) {
    options.push({
      label: `允许（单次）`,
      value: 'grant-once'
    })
  }

  // 前缀匹配选项 - 仅对Bash工具显示
  if (toolUseConfirm.tool.name === 'BashTool' && commandPrefix) {
    const prefixes = generateCommandPrefixes(command)
    const availablePrefixes = prefixes.filter(prefix => 
      prefix !== command && prefix.length > 0
    )
    
    if (availablePrefixes.length > 0) {
      options.push({
        header: `前缀匹配选项`,
        options: availablePrefixes.map(prefix => ({
          label: `允许前缀: ${prefix}`,
          value: `grant-prefix:${prefix}`
        }))
      })
    }
  }

  if (permissionHandling?.reject) {
    options.push({
      label: `拒绝`,
      value: 'reject'
    })
  }

  if (permissionHandling?.skip) {
    options.push({
      label: `跳过`,
      value: 'skip'
    })
  }

  // 添加取消选项
  options.push({
    label: `取消（${chalk.bold.hex(theme.warning)('esc')}）`,
    value: 'cancel'
  })

  return options
}
