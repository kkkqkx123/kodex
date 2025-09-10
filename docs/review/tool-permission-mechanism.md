# 工具调用审批机制分析

## 概述

Kode 采用多级权限控制系统，通过安全模式、配置文件和用户交互来实现精细化的工具调用审批机制。当 AI 请求没有权限的工具时，系统会拒绝调用并向用户请求权限，同时向 AI 返回标准化的拒绝消息。

## 权限检查流程

### 1. 权限检查漏斗模型

权限检查采用分层漏斗模型：

```typescript
// 权限检查流程
async function checkPermissionsAndCallTool(
  tool: Tool,
  input: unknown,
  context: ToolUseContext
): Promise<ToolResult> {
  if (!tool.needsPermissions(input)) {
    // 无需权限的工具直接执行
    return await tool.call(input, context)
  }
  
  // 权限检查
  const permission = await requestPermission({
    tool: tool.name,
    operation: describeOperation(input)
  })
  
  if (permission.approved) {
    // 权限批准后执行工具
    if (permission.saveForSession) {
      saveSessionPermission(tool.name, input)
    }
    return await tool.call(input, context)
  } else {
    // 权限被拒绝
    throw new PermissionDeniedError()
  }
}
```

### 2. 权限类型

系统支持四种权限类型：

1. **无需权限 (No Permission Required)** - 只读操作，如文件读取、目录列表
2. **会话权限 (Session Permission)** - 当前会话临时批准的权限
3. **持久权限 (Persistent Permission)** - 跨会话保存的批准权限
4. **始终询问 (Always Ask)** - 关键操作需要明确批准

## 权限拒绝处理

### 1. 权限拒绝消息

当 AI 请求没有权限的工具时，系统返回标准化的拒绝消息：

```typescript
export const REJECT_MESSAGE =
  "The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed."
```

### 2. 拒绝消息注入机制

权限拒绝消息通过以下方式注入到提示词中：

1. **权限检查阶段**：在 `hasPermissionsToUseTool` 函数中检查权限
2. **拒绝处理阶段**：权限被拒绝时返回包含 `REJECT_MESSAGE` 的 `PermissionResult`
3. **消息生成阶段**：在 `checkPermissionsAndCallTool` 函数中生成工具结果消息
4. **AI 接收阶段**：通过 `createUserMessage` 将拒绝消息返回给 AI

```typescript
// 权限检查结果处理
if (permissionResult.result === false) {
  yield createUserMessage([
    {
      type: 'tool_result',
      content: permissionResult.message, // 包含 REJECT_MESSAGE
      is_error: true,
      tool_use_id: toolUseID,
    },
  ])
  return
}
```

### 3. 拒绝消息的特点

- **标准化格式**：所有权限拒绝使用统一的 `REJECT_MESSAGE`
- **明确指示**：明确告知 AI 工具使用被拒绝
- **行为指导**：指示 AI 停止当前操作并等待用户指令
- **无详细信息**：不透露具体的权限配置或安全细节

## 安全模式控制

### 1. 安全模式启用

当安全模式启用时 (`safeMode: true`)，所有工具使用都需要明确权限：

```typescript
// 安全模式检查
if (!context.options.safeMode) {
  return { result: true } // 宽松模式允许所有工具
}
```

### 2. 安全命令白名单

系统内置安全命令白名单，以下命令在安全模式下自动允许：

```typescript
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
```

## 配置管理

### 1. 权限配置位置

权限配置存储在项目配置文件 (`./.kode/config.json`) 中：

```json
{
  "allowedTools": [
    "FileReadTool",
    "GlobTool", 
    "GrepTool",
    "BashTool(git:*)",
    "BashTool(npm:*)"
  ],
  "enableArchitectTool": false
}
```

### 2. 权限键生成

系统为每个工具生成唯一的权限键：

```typescript
function getPermissionKey(
  tool: Tool,
  input: { [k: string]: unknown },
  prefix: string | null,
): string {
  switch (tool) {
    case BashTool:
      if (prefix) {
        return `${BashTool.name}(${prefix}:*)` // 通配符模式
      }
      return `${BashTool.name}(${BashTool.renderToolUseMessage(input as never)})` // 具体命令
    default:
      return tool.name // 其他工具使用工具名
  }
}
```

## 用户交互流程

### 1. 权限请求对话框

当需要用户权限时，系统显示权限请求对话框：

```typescript
// 显示权限对话框
setToolUseConfirm({
  assistantMessage,
  tool,
  description,
  input,
  commandPrefix,
  riskScore: null,
  onAbort() {
    // 用户取消处理
    logCancelledEvent()
    resolveWithCancelledAndAbortAllToolCalls()
  },
  onAllow(type) {
    // 用户允许处理
    logEvent('tengu_tool_use_granted_in_prompt_permanent', {
      messageID: assistantMessage.message.id,
      toolName: tool.name,
    })
    resolve({ result: true })
  },
  onReject() {
    // 用户拒绝处理
    logEvent('tengu_tool_use_rejected_in_prompt', {
      messageID: assistantMessage.message.id,
      toolName: tool.name,
    })
    resolveWithCancelledAndAbortAllToolCalls()
  },
})
```

### 2. 用户决策选项

用户可以选择：
- **允许 (Allow)** - 永久批准该工具
- **临时允许 (Temporary Allow)** - 仅当前会话有效
- **拒绝 (Reject)** - 拒绝工具使用
- **取消 (Cancel)** - 取消当前操作

## 事件日志记录

系统记录所有权限相关事件：

| 事件类型 | 描述 |
|---------|------|
| `tengu_tool_use_granted_in_config` | 配置允许的工具使用 |
| `tengu_tool_use_granted_in_prompt_permanent` | 用户永久允许 |
| `tengu_tool_use_granted_in_prompt_temporary` | 用户临时允许 |
| `tengu_tool_use_rejected_in_prompt` | 用户拒绝使用 |
| `tengu_tool_use_cancelled` | 用户取消请求 |

## 安全考虑

### 1. 信息最小化原则

权限拒绝消息设计遵循信息最小化原则：
- 不透露具体的权限配置细节
- 不暴露系统安全机制实现
- 提供足够的指导信息让 AI 正确处理

### 2. 无提示词注入风险

拒绝消息不会将具体的权限信息或工具描述注入到 AI 的提示词中，避免了潜在的安全风险。

### 3. 命令注入防护

系统对 BashTool 进行命令注入检测：

```typescript
if (commandSubcommandPrefix.commandInjectionDetected) {
  // 仅允许精确匹配，防止命令注入
  if (bashToolCommandHasExactMatchPermission(tool, command, allowedTools)) {
    return { result: true }
  } else {
    return { result: false, message: REJECT_MESSAGE }
  }
}
```

## 结论

Kode 的工具调用审批机制提供了：

1. **精细化的权限控制**：支持多级权限管理和安全模式
2. **标准化的拒绝处理**：统一的拒绝消息和处理流程
3. **安全的用户交互**：权限请求对话框和事件日志记录
4. **无信息泄露风险**：拒绝消息不暴露系统细节
5. **良好的扩展性**：支持新的工具类型和权限规则

当 AI 请求没有权限的工具时，系统会安全地拒绝调用并向 AI 返回标准化的指导信息，同时保护系统的安全配置不被泄露。