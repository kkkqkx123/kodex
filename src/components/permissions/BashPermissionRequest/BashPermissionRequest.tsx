import { Box, Text } from 'ink'
import React, { useMemo } from 'react'
import { UnaryEvent } from '../../../hooks/usePermissionRequestLogging'
import { savePermission } from '../../../permissions'
import { BashTool } from '../../../tools/BashTool/BashTool'
import { getTheme } from '../../../utils/theme'
import { usePermissionRequestLogging } from '../hooks'
import {
  type ToolUseConfirm,
  toolUseConfirmGetPrefix,
} from '../PermissionRequest.js'
import { PermissionRequestTitle } from '../PermissionRequestTitle'
import { logUnaryPermissionEvent } from '../utils'
import { Select } from '../../CustomSelect/select'
import { toolUseOptions } from '../toolUseOptions'
import { generateCommandPrefixes } from '../../../utils/commands'
import { enhancedToolUseOptions } from '../toolUseOptions'
import { getCurrentProjectConfig } from '../../../utils/config'

type Props = {
  toolUseConfirm: ToolUseConfirm
  onDone(): void
}

export function BashPermissionRequest({
  toolUseConfirm,
  onDone,
}: Props): React.ReactNode {
  const theme = getTheme()

  // ok to use parse since we've already validated args earliers
  const { command } = BashTool.inputSchema.parse(toolUseConfirm.input)

  const unaryEvent = useMemo<UnaryEvent>(
    () => ({ completion_type: 'tool_use_single', language_name: 'none' }),
    [],
  )

  usePermissionRequestLogging(toolUseConfirm, unaryEvent)
  
  // 检查是否有权限处理配置
  const projectConfig = getCurrentProjectConfig()
  const permissionHandling = projectConfig.permissionHandling
  
  // 如果有权限处理配置，使用增强选项
  const options = permissionHandling 
    ? enhancedToolUseOptions({
        toolUseConfirm,
        command,
        permissionHandling,
        commandPrefix: toolUseConfirmGetPrefix(toolUseConfirm)
      })
    : toolUseOptions({ toolUseConfirm, command })

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.permission}
      marginTop={1}
      paddingLeft={1}
      paddingRight={1}
      paddingBottom={1}
    >
      <PermissionRequestTitle
        title="Bash command"
        riskScore={toolUseConfirm.riskScore}
      />
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text>{BashTool.renderToolUseMessage({ command })}</Text>
        <Text color={theme.secondaryText}>{toolUseConfirm.description}</Text>
      </Box>

      <Box flexDirection="column">
        <Text>Do you want to proceed?</Text>
        <Select
          options={options}
          onChange={newValue => {
            if (permissionHandling) {
              // 处理增强选项
              const option = options.find(opt => 'value' in opt && opt.value === newValue)
              if (option && 'handler' in option && typeof option.handler === 'function') {
                option.handler()
              } else {
                // 默认处理
                switch (newValue) {
                  case 'yes':
                    logUnaryPermissionEvent(
                      'tool_use_single',
                      toolUseConfirm,
                      'accept',
                    )
                    toolUseConfirm.onAllow('temporary')
                    onDone()
                    break
                  case 'no':
                    logUnaryPermissionEvent(
                      'tool_use_single',
                      toolUseConfirm,
                      'reject',
                    )
                    toolUseConfirm.onReject()
                    onDone()
                    break
                }
              }
            } else {
              switch (newValue) {
                case 'yes':
                  logUnaryPermissionEvent(
                    'tool_use_single',
                    toolUseConfirm,
                    'accept',
                  )
                  toolUseConfirm.onAllow('temporary')
                  onDone()
                  break
                case 'yes-dont-ask-again-prefix': {
                  const prefix = toolUseConfirmGetPrefix(toolUseConfirm)
                  if (prefix !== null) {
                    logUnaryPermissionEvent(
                      'tool_use_single',
                      toolUseConfirm,
                      'accept',
                    )
                    savePermission(
                      toolUseConfirm.tool,
                      toolUseConfirm.input,
                      prefix,
                      'project' // 项目级授权
                    ).then(() => {
                      toolUseConfirm.onAllow('permanent')
                      onDone()
                    })
                  }
                  break
                }
                case 'yes-dont-ask-again-full':
                  logUnaryPermissionEvent(
                    'tool_use_single',
                    toolUseConfirm,
                    'accept',
                  )
                  savePermission(
                    toolUseConfirm.tool,
                    toolUseConfirm.input,
                    null, // Save without prefix
                    'project' // 项目级授权
                  ).then(() => {
                    toolUseConfirm.onAllow('permanent')
                    onDone()
                  })
                  break
                
                // 处理基于前缀匹配的授权选项（项目级和会话级授权）
                default:
                  if (newValue.startsWith('yes-dont-ask-again-prefix:')) {
                    const prefix = newValue.replace('yes-dont-ask-again-prefix:', '')
                    if (prefix) {
                      logUnaryPermissionEvent(
                        'tool_use_single',
                        toolUseConfirm,
                        'accept',
                      )
                      // 项目级授权支持前缀匹配
                      savePermission(
                        toolUseConfirm.tool,
                        { command: prefix }, // 保存前缀而不是完整命令
                        prefix, // 使用前缀作为权限键
                        'project' // 项目级授权
                      ).then(() => {
                        toolUseConfirm.onAllow('permanent')
                        onDone()
                      })
                    }
                  }
                  break
                case 'no':
                  logUnaryPermissionEvent(
                    'tool_use_single',
                    toolUseConfirm,
                    'reject',
                  )
                  toolUseConfirm.onReject()
                  onDone()
                  break
              }
            }
          }}
        />
      </Box>
    </Box>
  )
}
