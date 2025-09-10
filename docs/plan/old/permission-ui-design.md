# 权限处理选项UI设计文档

## 概述

本设计文档描述权限处理选项的UI实现方案，确保新的权限处理选项能够无缝融入现有的CLI对话界面。支持基于前缀匹配的授权、分级授权机制，并通过键盘交互提供完整的用户体验。

## 现有UI分析

### 当前权限请求界面
- 使用 `ink` 组件库构建CLI界面
- 采用 `Select` 组件提供选项选择
- 支持临时授权（`temporary`）和永久授权（`permanent`）
- 使用边框、颜色和布局保持视觉一致性
- 支持键盘交互（ESC取消）

### 新增权限特性
- **基于前缀匹配的授权**: 支持命令前缀匹配（如 `bun`、`bun test`、`bun test filename`）【单次授权不需要前缀匹配，因为不需要复用】
- **分级授权机制**: 支持项目级、会话级、单次权限分级管理
- **配置驱动**: 支持通过配置文件灵活控制权限选项

### 视觉设计特点
- 圆角边框（`borderStyle: "round"`）
- 主题颜色系统（`theme.permission`）
- 分层布局（`flexDirection: "column"`）
- 适当的边距和填充
- 清晰的标题和描述文本

## 设计目标

1. **保持一致性** - 与现有权限请求界面风格一致
2. **扩展性** - 支持多种权限处理选项
3. **配置驱动** - 根据配置显示相应选项
4. **用户体验** - 提供清晰的选项说明和指引

## UI组件设计

### 选项数据结构

扩展 `toolUseOptions` 函数支持新的权限处理选项，包括前缀匹配和分级授权：

```typescript
// src/components/permissions/toolUseOptions.ts
export function enhancedToolUseOptions({
  toolUseConfirm,
  command,
  permissionHandling,
  commandPrefix,
}: {
  toolUseConfirm: ToolUseConfirm
  command: string
  permissionHandling?: PermissionHandlingOption
  commandPrefix?: string | null // 新增：命令前缀信息
}): (Option | OptionSubtree)[] {
  const theme = getTheme()
  const options: (Option | OptionSubtree)[] = []

  // 根据配置添加选项
  if (permissionHandling?.grantSession) {
    options.push({
      label: `允许（仅本次会话）`,
      value: 'grant-session',
      description: '权限在当前会话有效'
    })
  }

  if (permissionHandling?.grantProject) {
    options.push({
      label: `允许（全局）`,
      value: 'grant-project',
      description: '权限在当前项目有效'
    })
  }

  if (permissionHandling?.grantOnce) {
    options.push({
      label: `允许（单次）`,
      value: 'grant-once',
      description: '权限仅本次工具调用有效'
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
        label: `前缀匹配选项`,
        value: 'prefix-options',
        description: '基于命令前缀的授权选项',
        subtree: availablePrefixes.map(prefix => ({
          label: `允许前缀: ${prefix}`,
          value: `grant-prefix:${prefix}`,
          description: `授权 ${prefix} 开头的所有命令`
        }))
      })
    }
  }

  if (permissionHandling?.reject) {
    options.push({
      label: `拒绝`,
      value: 'reject',
      description: '明确拒绝权限请求'
    })
  }

  if (permissionHandling?.skip) {
    options.push({
      label: `跳过`,
      value: 'skip',
      description: '跳过此次权限请求'
    })
  }

  // 添加取消选项
  options.push({
    label: `取消（${chalk.bold.hex(theme.warning)('esc')}）`,
    value: 'cancel'
  })

  return options
}
```

### 增强的权限请求组件

创建新的权限请求组件，支持配置驱动的选项显示，包括前缀匹配和分级授权：

```typescript
// src/components/permissions/EnhancedPermissionRequest.tsx
import { Box, Text } from 'ink'
import React, { useState, useEffect } from 'react'
import { getCurrentProjectConfig } from '../../utils/config'
import { getTheme } from '../../utils/theme'
import { Select } from '../CustomSelect/select'
import { enhancedToolUseOptions } from './toolUseOptions'
import { PermissionRequestTitle } from './PermissionRequestTitle'
import { getCommandSubcommandPrefix } from '../../utils/commands'

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
        toolUseConfirm.commandPrefix?.abortController?.signal || new AbortController().signal
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
            command: toolUseConfirm.input.command || '',
            permissionHandling,
            commandPrefix
          })}
          onChange={async (value) => {
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
                
              case 'grant-global':
                await savePermission(
                  toolUseConfirm.tool,
                  toolUseConfirm.input,
                  null,
                  'global'
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
                
              // 前缀匹配授权
              case value.startsWith('grant-prefix:'):
                const prefix = value.replace('grant-prefix:', '')
                await savePermission(
                  toolUseConfirm.tool,
                  { command: prefix },
                  prefix,
                  'project'
                )
                toolUseConfirm.onAllow('permanent')
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
```

### 工具确认类型扩展

扩展 `ToolUseConfirm` 类型支持跳过回调：

```typescript
// src/components/permissions/PermissionRequest.tsx
export type ToolUseConfirm = {
  assistantMessage: AssistantMessage
  tool: Tool
  description: string
  input: { [key: string]: unknown }
  commandPrefix: CommandSubcommandPrefixResult | null
  riskScore: number | null
  onAbort(): void
  onAllow(type: 'permanent' | 'temporary'): void
  onReject(): void
  onSkip?(): void // 新增跳过回调
}
```

## 集成方案

### 权限请求组件集成

修改主权限请求组件，根据配置选择使用传统或增强界面：

```typescript
// src/components/permissions/PermissionRequest.tsx
export function PermissionRequest({
  toolUseConfirm,
  onDone,
  verbose,
}: PermissionRequestProps): React.ReactNode {
  const projectConfig = getCurrentProjectConfig()
  const permissionHandling = projectConfig.permissionHandling

  // 如果有权限处理配置，使用增强界面
  if (permissionHandling) {
    return (
      <EnhancedPermissionRequest
        toolUseConfirm={toolUseConfirm}
        onDone={onDone}
        verbose={verbose}
      />
    )
  }

  // 否则使用传统界面
  const PermissionComponent = permissionComponentForTool(toolUseConfirm.tool)
  return (
    <PermissionComponent
      toolUseConfirm={toolUseConfirm}
      onDone={onDone}
      verbose={verbose}
    />
  )
}
```

### useCanUseTool Hook 集成

修改 `useCanUseTool` Hook 支持跳过回调：

```typescript
// src/hooks/useCanUseTool.ts
function useCanUseTool(
  setToolUseConfirm: SetState<ToolUseConfirm | null>,
): CanUseToolFn {
  return useCallback<CanUseToolFn>(
    async (tool, input, toolUseContext, assistantMessage) => {
      return new Promise(resolve => {
        // ... 现有逻辑
        
        setToolUseConfirm({
          // ... 现有属性
          onSkip() {
            logEvent('tengu_tool_use_skipped', {
              messageID: assistantMessage.message.id,
              toolName: tool.name,
            })
            resolve({
              result: false,
              message: SKIP_MESSAGE
            })
            toolUseContext.abortController.abort()
          }
        })
      })
    },
    [setToolUseConfirm]
  )
}
```

## 视觉设计规范

### 颜色方案
- **主要颜色**: `theme.permission` (权限相关)
- **次要文本**: `theme.secondaryText` (描述信息)
- **警告颜色**: `theme.warning` (取消操作)
- **成功颜色**: `theme.success` (授权操作)

### 布局规范
- **外边距**: `marginTop: 1` (与上下内容分隔)
- **内边距**: `padding: 1` (内容与边框间距)
- **边框样式**: `borderStyle: "round"` (圆角边框)
- **宽度**: `width: "100%"` (充分利用终端宽度)

### 文本格式
- **标题**: 粗体显示工具名称
- **描述**: 正常字体显示详细说明
- **选项**: 清晰标注操作含义
- **帮助**: 小字号显示操作指引

## 交互设计

### 键盘交互
- **↑↓键**: 选项导航
- **Enter键**: 确认选择
- **ESC键**: 取消操作
- **Tab键**: 展开/折叠前缀匹配选项子树
- **→键**: 进入子树选项
- **←键**: 返回父级选项
- **空格键**: 切换选项展开状态

### 选项优先级
1. **授权选项** (grant-*)
2. **前缀匹配选项** (prefix-options)
3. **拒绝选项** (reject)
4. **跳过选项** (skip)
5. **取消选项** (cancel)

### 默认选择
- 根据配置的 `defaultAction` 设置默认选项
- 如果没有配置，默认选择第一个授权选项
- 确保安全选项（拒绝/取消）易于访问
- 前缀匹配选项默认折叠，需要用户主动展开

### 前缀匹配交互流程
1. 用户使用 Tab 键展开前缀匹配选项子树
2. 使用 → 键进入子树，浏览可用的前缀选项
3. 选择特定前缀后，系统会为该前缀创建项目级权限
4. 使用 ← 键返回主选项列表

## 配置示例UI

### 完整选项配置（支持前缀匹配）
```json
{
  "permissionHandling": {
    "grantSession": true,
    "grantGlobal": true,
    "grantOnce": true,
    "reject": true,
    "skip": true,
    "defaultAction": "grantSession",
    "enablePrefixMatching": true  // 启用前缀匹配功能
  }
}
```

对应的UI选项：
1. ✅ 允许（仅本次会话）
2. ✅ 允许（全局）
3. ✅ 允许（单次）
4. 🔍 前缀匹配选项（使用 Tab 展开）
   - ✅ 允许前缀: bun
   - ✅ 允许前缀: bun test  
   - ✅ 允许前缀: bun test filename
5. ❌ 拒绝
6. ⏭️  跳过
7. 🚫 取消

### 简化配置（仅基础选项）
```json
{
  "permissionHandling": {
    "grantGlobal": true,
    "reject": true,
    "defaultAction": "grantGlobal",
    "enablePrefixMatching": false  // 禁用前缀匹配
  }
}
```

对应的UI选项：
1. ✅ 允许（全局）
2. ❌ 拒绝
3. 🚫 取消

### 分级授权配置示例
```json
{
  "permissionHandling": {
    "grantSession": true,
    "grantGlobal": false,  // 禁用全局授权
    "grantOnce": true,
    "reject": true,
    "defaultAction": "grantOnce",
    "enablePrefixMatching": true
  },
  "permissionLevels": {
    "bash": "project",     // Bash工具使用项目级权限
    "fileEdit": "session", // 文件编辑工具使用会话级权限
    "default": "once"      // 其他工具使用单次权限
  }
}
```

## 实施步骤

1. **类型扩展** - 扩展 `ToolUseConfirm` 和配置类型
2. **选项生成** - 创建 `enhancedToolUseOptions` 函数
3. **组件开发** - 实现 `EnhancedPermissionRequest` 组件
4. **Hook 集成** - 修改 `useCanUseTool` 支持跳过回调
5. **主组件集成** - 修改 `PermissionRequest` 支持配置切换
6. **消息定义** - 添加跳过消息常量
7. **样式优化** - 确保视觉一致性

## 测试方案

1. **单元测试** - 选项生成逻辑测试
2. **集成测试** - 组件交互测试
3. **配置测试** - 不同配置下的选项显示
4. **视觉测试** - 界面布局和颜色验证
5. **交互测试** - 键盘操作和响应测试

## 兼容性考虑

1. **向后兼容** - 现有配置不受影响
2. **渐进增强** - 新功能可选启用
3. **错误处理** - 配置错误时的降级处理
4. **性能优化** - 避免不必要的重渲染

该UI设计方案确保了新的权限处理选项能够完美融入现有的CLI对话界面，提供一致的用户体验和灵活的配置选项。