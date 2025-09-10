import { Box, Text } from 'ink'
import React, { useState, useEffect } from 'react'
import { getCurrentProjectConfig } from '../../utils/config'
import { getTheme } from '../../utils/theme'
import { Select } from '../CustomSelect/select'
import { enhancedToolUseOptions } from './toolUseOptions'
import { PermissionRequestTitle } from './PermissionRequestTitle'
import { getCommandSubcommandPrefix } from '../../utils/commands'
import { savePermission } from '../../permissions'
import { type ToolUseConfirm } from './PermissionRequest'

type EnhancedPermissionRequestProps = {
  toolUseConfirm: ToolUseConfirm
  onDone: () => void
  verbose: boolean
}

export function EnhancedPermissionRequest({
  toolUseConfirm,
  onDone,
  verbose,
}: EnhancedPermissionRequestProps): React.ReactNode {
  const theme = getTheme()
  const projectConfig = getCurrentProjectConfig()
  const permissionHandling = projectConfig.permissionHandling
  const [commandPrefix, setCommandPrefix] = useState<string | null>(null)

  // 获取工具相关信息
  const toolName = toolUseConfirm.tool.userFacingName?.() || 'Tool'
  const description = toolUseConfirm.description

  // 获取命令前缀信息（仅对Bash工具）
  useEffect(() => {
    if (toolUseConfirm.tool.name === 'BashTool' && toolUseConfirm.input.command) {
      getCommandSubcommandPrefix(
        toolUseConfirm.input.command as string,
        new AbortController().signal
      ).then(result => {
        if (result && !result.commandInjectionDetected) {
          setCommandPrefix(result.commandPrefix)
        }
      }).catch(() => {
        // 忽略错误
      })
    }
  }, [toolUseConfirm])

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.permission}
      marginTop={1}
      paddingLeft={1}
      paddingRight={1}
      paddingBottom={1}
      width="100%"
    >
      {/* 标题区域 */}
      <PermissionRequestTitle
        title={`${toolName} 权限请求`}
        riskScore={toolUseConfirm.riskScore}
      />

      {/* 描述区域 */}
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text>{description}</Text>
        {verbose && (
          <Text color={theme.secondaryText}>
            输入: {JSON.stringify(toolUseConfirm.input, null, 2)}
          </Text>
        )}
        {/* 显示命令前缀信息 */}
        {commandPrefix && (
          <Text color={theme.secondaryText}>
            检测到命令前缀: {commandPrefix}
          </Text>
        )}
      </Box>

      {/* 选项区域 */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>请选择处理方式:</Text>
        
        <Select
          options={enhancedToolUseOptions({
            toolUseConfirm,
            command: (toolUseConfirm.input.command as string) || '',
            permissionHandling,
            commandPrefix
          })}
          onChange={async (value) => {
            // 前缀匹配授权
            if (value.startsWith('grant-prefix:')) {
              const prefix = value.replace('grant-prefix:', '')
              await savePermission(
                toolUseConfirm.tool,
                { command: prefix },
                prefix,
                'project'
              )
              toolUseConfirm.onAllow('permanent')
            } else {
              switch (value) {
                case 'grant-session':
                  await savePermission(
                    toolUseConfirm.tool,
                    toolUseConfirm.input,
                    null,
                    'session'
                  )
                  toolUseConfirm.onAllow('temporary')
                  break
                  
                case 'grant-project':
                  await savePermission(
                    toolUseConfirm.tool,
                    toolUseConfirm.input,
                    null,
                    'project'
                  )
                  toolUseConfirm.onAllow('permanent')
                  break
                  
                case 'grant-once':
                  await savePermission(
                    toolUseConfirm.tool,
                    toolUseConfirm.input,
                    null,
                    'once'
                  )
                  toolUseConfirm.onAllow('temporary')
                  break
                  
                case 'reject':
                  toolUseConfirm.onReject()
                  break
                  
                case 'skip':
                  // 调用新的跳过回调
                  if (toolUseConfirm.onSkip) {
                    toolUseConfirm.onSkip()
                  } else {
                    toolUseConfirm.onReject()
                  }
                  break
                  
                case 'cancel':
                  toolUseConfirm.onAbort()
                  break
              }
            }
            onDone()
          }}
        />
      </Box>

      {/* 帮助信息 */}
      <Box marginTop={1}>
        <Text color={theme.secondaryText}>
          使用 ↑↓ 键选择，Enter 键确认，ESC 取消
        </Text>
        {commandPrefix && (
          <Text color={theme.secondaryText}>
            Tab 键: 展开/折叠前缀匹配选项
          </Text>
        )}
      </Box>
    </Box>
  )
}