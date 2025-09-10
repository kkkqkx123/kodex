import { Box, Text } from 'ink'
import React, { useMemo } from 'react'
import { Select } from '../CustomSelect/select'
import { getTheme } from '../../utils/theme'
import {
  PermissionRequestTitle,
  textColorForRiskScore,
} from './PermissionRequestTitle.js'
import { logUnaryEvent } from '../../utils/unaryLogging'
import { env } from '../../utils/env'
import { getCwd } from '../../utils/state'
import { savePermission } from '../../permissions'
import {
  type ToolUseConfirm,
  toolUseConfirmGetPrefix,
} from './PermissionRequest.js'
import chalk from 'chalk'
import {
  UnaryEvent,
  usePermissionRequestLogging,
} from '../../hooks/usePermissionRequestLogging.js'
import { enhancedToolUseOptions } from './toolUseOptions'
import { getCurrentProjectConfig } from '../../utils/config'

type Props = {
  toolUseConfirm: ToolUseConfirm
  onDone(): void
  verbose: boolean
}

export function FallbackPermissionRequest({
  toolUseConfirm,
  onDone,
  verbose,
}: Props): React.ReactNode {
  const theme = getTheme()

  // TODO: Avoid these special cases
  const originalUserFacingName = toolUseConfirm.tool.userFacingName()
  const userFacingName = originalUserFacingName.endsWith(' (MCP)')
    ? originalUserFacingName.slice(0, -6)
    : originalUserFacingName

  const unaryEvent = useMemo<UnaryEvent>(
    () => ({
      completion_type: 'tool_use_single',
      language_name: 'none',
    }),
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
        command: '',
        permissionHandling,
        commandPrefix: toolUseConfirmGetPrefix(toolUseConfirm)
      })
    : [
        {
          label: 'Yes',
          value: 'yes',
        },
        {
          label: `Yes, and don't ask again for ${chalk.bold(userFacingName)} commands in ${chalk.bold(getCwd())}`,
          value: 'yes-dont-ask-again',
        },
        {
          label: `No, and provide instructions (${chalk.bold.hex(getTheme().warning)('esc')})`,
          value: 'no',
        },
      ]

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={textColorForRiskScore(toolUseConfirm.riskScore)}
      marginTop={1}
      paddingLeft={1}
      paddingRight={1}
      paddingBottom={1}
    >
      <PermissionRequestTitle
        title="Tool use"
        riskScore={toolUseConfirm.riskScore}
      />
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text>
          {userFacingName}(
          {toolUseConfirm.tool.renderToolUseMessage(
            toolUseConfirm.input as never,
            { verbose },
          )}
          )
          {originalUserFacingName.endsWith(' (MCP)') ? (
            <Text color={theme.secondaryText}> (MCP)</Text>
          ) : (
            ''
          )}
        </Text>
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
                    logUnaryEvent({
                      completion_type: 'tool_use_single',
                      event: 'accept',
                      metadata: {
                        language_name: 'none',
                        message_id: toolUseConfirm.assistantMessage.message.id,
                        platform: env.platform,
                      },
                    })
                    toolUseConfirm.onAllow('temporary')
                    onDone()
                    break
                  case 'yes-dont-ask-again':
                    logUnaryEvent({
                      completion_type: 'tool_use_single',
                      event: 'accept',
                      metadata: {
                        language_name: 'none',
                        message_id: toolUseConfirm.assistantMessage.message.id,
                        platform: env.platform,
                      },
                    })
                    savePermission(
                      toolUseConfirm.tool,
                      toolUseConfirm.input,
                      toolUseConfirmGetPrefix(toolUseConfirm),
                      'project'
                    ).then(() => {
                      toolUseConfirm.onAllow('permanent')
                      onDone()
                    })
                    break
                  case 'no':
                    logUnaryEvent({
                      completion_type: 'tool_use_single',
                      event: 'reject',
                      metadata: {
                        language_name: 'none',
                        message_id: toolUseConfirm.assistantMessage.message.id,
                        platform: env.platform,
                      },
                    })
                    toolUseConfirm.onReject()
                    onDone()
                    break
                }
              }
            } else {
              // 传统处理
              switch (newValue) {
                case 'yes':
                  logUnaryEvent({
                    completion_type: 'tool_use_single',
                    event: 'accept',
                    metadata: {
                      language_name: 'none',
                      message_id: toolUseConfirm.assistantMessage.message.id,
                      platform: env.platform,
                    },
                  })
                  toolUseConfirm.onAllow('temporary')
                  onDone()
                  break
                case 'yes-dont-ask-again':
                  logUnaryEvent({
                    completion_type: 'tool_use_single',
                    event: 'accept',
                    metadata: {
                      language_name: 'none',
                      message_id: toolUseConfirm.assistantMessage.message.id,
                      platform: env.platform,
                    },
                  })
                  savePermission(
                    toolUseConfirm.tool,
                    toolUseConfirm.input,
                    toolUseConfirmGetPrefix(toolUseConfirm),
                    'project'
                  ).then(() => {
                    toolUseConfirm.onAllow('permanent')
                    onDone()
                  })
                  break
                case 'no':
                  logUnaryEvent({
                    completion_type: 'tool_use_single',
                    event: 'reject',
                    metadata: {
                      language_name: 'none',
                      message_id: toolUseConfirm.assistantMessage.message.id,
                      platform: env.platform,
                    },
                  })
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
