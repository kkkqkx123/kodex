# 工具调用无权限处理配置选项设计

## 概述

本设计文档描述如何为工具调用无权限时增加配置选项，支持多种权限处理方式：会话内赋予、全局赋予、单次赋予、拒绝、跳过。

## 现有机制分析

### 当前权限检查流程
1. `hasPermissionsToUseTool` 函数检查工具权限
2. 返回 `PermissionResult` 类型结果：`{ result: true }` 或 `{ result: false; message: string }`
3. `useCanUseTool` Hook 处理权限请求和用户交互
4. 当前仅支持永久授权和拒绝两种选项

### 配置结构
当前 `ProjectConfig` 类型包含：
- `allowedTools: string[]` - 已授权的工具列表
- 其他项目相关配置

## 设计目标

1. 扩展权限处理选项
2. 保持向后兼容性
3. 提供灵活的配置机制
4. 支持多种权限授予方式

## 配置选项定义

### 权限处理选项类型
```typescript
type PermissionHandlingOption = {
  // 会话内赋予 - 当前会话有效
  grantSession?: boolean
  
  // 项目赋予 - 写入配置文件
  grantProject?: boolean
  
  // 单次赋予 - 仅本次工具调用有效
  grantOnce?: boolean
  
  // 拒绝 - 明确拒绝权限请求
  reject?: boolean
  
  // 跳过 - 与拒绝效果相同但信息不同
  skip?: boolean
  
  // 默认处理方式
  defaultAction: 'grantSession' | 'grantProject' | 'grantOnce' | 'reject' | 'skip'
}
```

### 扩展项目配置
在 `ProjectConfig` 类型中添加：
```typescript
export type ProjectConfig = {
  // 现有字段...
  allowedTools: string[]
  
  // 新增权限处理配置
  permissionHandling?: PermissionHandlingOption
  
  // 会话内权限缓存
  sessionAllowedTools?: string[]
  
  // 单次权限缓存
  onceAllowedTools?: Map<string, number> // toolKey -> timestamp
}
```

## 实现方案

### 1. 配置类型扩展

在 `src/utils/config/types.ts` 中扩展类型定义：

```typescript
// 权限处理选项
export type PermissionHandlingOption = {
  grantSession?: boolean
  grantGlobal?: boolean
  grantOnce?: boolean
  reject?: boolean
  skip?: boolean
  defaultAction: 'grantSession' | 'grantGlobal' | 'grantOnce' | 'reject' | 'skip'
}

// 扩展 ProjectConfig
export type ProjectConfig = {
  // 现有字段...
  permissionHandling?: PermissionHandlingOption
  sessionAllowedTools?: string[]
  onceAllowedTools?: Record<string, number>
}
```

### 2. 权限检查逻辑修改

修改 `src/permissions.ts` 中的权限检查逻辑：

```typescript
export const hasPermissionsToUseTool: CanUseToolFn = async (
  tool,
  input,
  context,
  _assistantMessage,
): Promise<PermissionResult> => {
  // 安全检查模式检查
  if (!context.options.safeMode) {
    return { result: true }
  }

  const projectConfig = getCurrentProjectConfig()
  const permissionKey = getPermissionKey(tool, input, null)

  // 检查全局权限
  if (projectConfig.allowedTools.includes(permissionKey)) {
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

  // 无权限，返回需要用户确认
  return {
    result: false,
    message: `${PRODUCT_NAME} requested permissions to use ${tool.name}, but you haven't granted it yet.`
  }
}
```

### 3. 权限保存逻辑扩展

扩展 `savePermission` 函数支持多种权限类型：

```typescript
export async function savePermission(
  tool: Tool,
  input: { [k: string]: unknown },
  prefix: string | null,
  permissionType: 'global' | 'session' | 'once' = 'global'
): Promise<void> {
  const key = getPermissionKey(tool, input, prefix)
  const projectConfig = getCurrentProjectConfig()

  switch (permissionType) {
    case 'global':
      // 现有逻辑 - 写入配置文件
      if (!projectConfig.allowedTools.includes(key)) {
        projectConfig.allowedTools.push(key)
        projectConfig.allowedTools.sort()
        saveCurrentProjectConfig(projectConfig)
      }
      break
      
    case 'session':
      // 会话内权限
      if (!projectConfig.sessionAllowedTools) {
        projectConfig.sessionAllowedTools = []
      }
      if (!projectConfig.sessionAllowedTools.includes(key)) {
        projectConfig.sessionAllowedTools.push(key)
      }
      break
      
    case 'once':
      // 单次权限
      if (!projectConfig.onceAllowedTools) {
        projectConfig.onceAllowedTools = {}
      }
      projectConfig.onceAllowedTools[key] = Date.now()
      break
  }
}
```

### 4. 用户界面交互组件

创建新的权限请求组件，支持多种选项：

```typescript
// src/components/permissions/EnhancedPermissionRequest.tsx
interface EnhancedPermissionRequestProps {
  assistantMessage: AssistantMessage
  tool: ToolType
  description: string
  input: any
  commandPrefix: any
  onAbort: () => void
  onAllow: (type: 'global' | 'session' | 'once') => void
  onReject: () => void
  onSkip: () => void
  options: PermissionHandlingOption
}

const EnhancedPermissionRequest: React.FC<EnhancedPermissionRequestProps> = ({
  // ...props
}) => {
  // 根据配置选项显示相应的按钮
  return (
    <div>
      <h3>权限请求</h3>
      <p>{description}</p>
      
      {options.grantSession && (
        <button onClick={() => onAllow('session')}>
          会话内赋予
        </button>
      )}
      
      {options.grantGlobal && (
        <button onClick={() => onAllow('global')}>
          全局赋予
        </button>
      )}
      
      {options.grantOnce && (
        <button onClick={() => onAllow('once')}>
          单次赋予
        </button>
      )}
      
      {options.reject && (
        <button onClick={onReject}>
          拒绝
        </button>
      )}
      
      {options.skip && (
        <button onClick={onSkip}>
          跳过
        </button>
      )}
    </div>
  )
}
```

### 5. useCanUseTool Hook 修改

修改 `useCanUseTool` Hook 以支持新的权限处理选项：

```typescript
function useCanUseTool(
  setToolUseConfirm: SetState<ToolUseConfirm | null>,
): CanUseToolFn {
  return useCallback<CanUseToolFn>(
    async (tool, input, toolUseContext, assistantMessage) => {
      const projectConfig = getCurrentProjectConfig()
      const handlingOptions = projectConfig.permissionHandling
      
      // 检查权限
      const result = await hasPermissionsToUseTool(tool, input, toolUseContext, assistantMessage)
      
      if (result.result) {
        return { result: true }
      }

      // 根据配置选项处理无权限情况
      if (handlingOptions?.defaultAction) {
        switch (handlingOptions.defaultAction) {
          case 'grantSession':
            await savePermission(tool, input, null, 'session')
            return { result: true }
            
          case 'grantGlobal':
            await savePermission(tool, input, null, 'global')
            return { result: true }
            
          case 'grantOnce':
            await savePermission(tool, input, null, 'once')
            return { result: true }
            
          case 'reject':
            return {
              result: false,
              message: REJECT_MESSAGE
            }
            
          case 'skip':
            return {
              result: false,
              message: SKIP_MESSAGE // 新增跳过消息
            }
        }
      }

      // 显示权限请求界面
      setToolUseConfirm({
        // ...现有逻辑，使用新的EnhancedPermissionRequest组件
      })
    },
    [setToolUseConfirm]
  )
}
```

## 消息定义

在 `src/utils/messages.tsx` 中添加新的消息常量：

```typescript
export const SKIP_MESSAGE = "The user chose to skip this tool use. The tool use was not executed. Please wait for user instructions."
```

## 配置示例

### 默认配置
```json
{
  "permissionHandling": {
    "grantSession": true,
    "grantGlobal": true,
    "grantOnce": true,
    "reject": true,
    "skip": true,
    "defaultAction": "grantSession"
  }
}
```

### 仅允许全局授权
```json
{
  "permissionHandling": {
    "grantSession": false,
    "grantGlobal": true,
    "grantOnce": false,
    "reject": true,
    "skip": false,
    "defaultAction": "grantGlobal"
  }
}
```

### 自动拒绝模式
```json
{
  "permissionHandling": {
    "grantSession": false,
    "grantGlobal": false,
    "grantOnce": false,
    "reject": true,
    "skip": false,
    "defaultAction": "reject"
  }
}
```

## 实施步骤

1. **类型定义扩展** - 修改 `src/utils/config/types.ts`
2. **权限检查逻辑** - 修改 `src/permissions.ts`
3. **权限保存逻辑** - 扩展 `savePermission` 函数
4. **用户界面组件** - 创建 `EnhancedPermissionRequest` 组件
5. **Hook 修改** - 更新 `useCanUseTool` Hook
6. **消息定义** - 添加 `SKIP_MESSAGE` 常量
7. **配置管理** - 更新配置加载和保存逻辑

## 向后兼容性

- 现有配置不受影响，`permissionHandling` 字段为可选
- 默认行为与现有系统保持一致
- 现有的 `allowedTools` 机制继续有效

## 测试方案

1. 单元测试权限检查逻辑
2. 集成测试用户交互流程
3. 配置选项功能测试
4. 向后兼容性测试

## 风险与考虑

1. **性能影响** - 会话和单次权限缓存需要内存管理
2. **安全性** - 确保权限检查逻辑正确
3. **用户体验** - 过多的选项可能造成混淆
4. **配置复杂性** - 需要清晰的文档说明

## 后续优化

1. 添加权限管理界面
2. 支持权限有效期设置
3. 添加权限使用统计
4. 支持基于上下文的权限规则