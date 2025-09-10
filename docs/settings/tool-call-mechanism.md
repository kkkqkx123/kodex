# 工具调用检查与处理机制

## 概述

Kode CLI 实现了多层工具调用检查和处理机制，确保在不同模型和环境下工具调用的兼容性和稳定性。系统支持自动检测和处理工具调用不支持的场景，提供优雅的降级方案。

## 错误检测机制

### 1. 错误类型检测
系统通过正则表达式匹配检测特定的API错误：

```typescript
// 检测工具调用不支持的错误
detect: errMsg => {
  const lowerMsg = errMsg.toLowerCase()
  return (
    lowerMsg.includes('tool call is not supported') ||
    lowerMsg.includes('internalerror.algo.invalidparameter') ||
    lowerMsg.includes('the tool call is not supported')
  )
}
```

### 2. 模型特性检测
系统维护模型特性映射表，识别支持工具调用的模型：

```typescript
const MODEL_FEATURES: Record<string, ModelFeatures> = {
  'gpt-5': {
    usesMaxCompletionTokens: true,
    supportsResponsesAPI: true,
    requiresTemperatureOne: true,
    supportsVerbosityControl: true,
    supportsCustomTools: true,      // 支持自定义工具
    supportsAllowedTools: true,    // 支持允许的工具列表
  },
  // 其他模型配置...
}
```

## 处理流程

### 1. 错误处理流程
当检测到工具调用不支持的错误时：

1. **移除工具参数**：自动删除 `tools` 和 `tool_choice` 参数
2. **清理工具消息**：过滤掉对话中的工具相关消息内容
3. **添加备用指令**：注入格式化输出指令到系统消息中
4. **重试请求**：重新发送清理后的API请求

### 2. 备用指令系统
对于不支持工具调用的模型，系统提供格式化输出指令：

```typescript
const fallbackInstruction = {
  role: 'system',
  content: `Since the current model does not support tool calling functionality, please provide tool usage information in the following format:

When you need to use a tool, output in the following JSON format:
{
  "tool": "tool_name",
  "input": {"parameter1": "value1", "parameter2": "value2"},
  "reasoning": "reason for using this tool"
}

When you need to return tool execution results, use the following format:
{
  "tool_result": "tool_name",
  "output": "tool_execution_result",
  "status": "success|error"
}

Please ensure the output is valid JSON format so the system can parse and execute the corresponding tool operations.`
}
```

## 验证机制

### 1. 输入验证
在工具调用前进行多层验证：

```typescript
// Zod schema 验证工具调用输入格式
const toolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any())
})

// 值验证
tool.validateInput(input)

// 权限检查
checkToolPermissions(toolName, user)
```

### 2. 错误处理器
系统维护错误处理器数组，按优先级处理不同类型的错误：

```typescript
const ERROR_HANDLERS: ErrorHandler[] = [
  {
    type: ModelErrorType.ToolCallNotSupported,
    detect: /* 错误检测逻辑 */,
    fix: /* 错误修复逻辑 */
  },
  // 其他错误处理器...
]
```

## 模型特性支持

### 支持工具调用的模型特性
- `supportsCustomTools`: 支持自定义工具定义
- `supportsAllowedTools`: 支持工具白名单机制
- `usesMaxCompletionTokens`: 使用最大完成令牌数
- `supportsVerbosityControl`: 支持详细程度控制

### 自动特性检测
系统根据模型名称自动检测特性：

```typescript
function getModelFeatures(modelName: string): ModelFeatures {
  // 精确匹配优先
  if (MODEL_FEATURES[modelName]) {
    return MODEL_FEATURES[modelName]
  }
  
  // GPT-5 系列检测
  if (modelName.toLowerCase().includes('gpt-5')) {
    return {
      usesMaxCompletionTokens: true,
      supportsResponsesAPI: true,
      requiresTemperatureOne: true,
      supportsVerbosityControl: true,
      supportsCustomTools: true,
      supportsAllowedTools: true,
    }
  }
  
  // 默认特性
  return { usesMaxCompletionTokens: false }
}
```

## 配置选项

### 错误处理配置
- **自动重试**: 检测到可修复错误时自动重试请求
- **参数转换**: 根据模型特性转换不支持的参数
- **消息清理**: 自动移除不兼容的消息内容

### 性能优化
- **错误缓存**: 缓存模型错误状态避免重复检测
- **批量处理**: 批量处理多个错误修复操作
- **异步处理**: 非阻塞的错误修复流程

## 使用示例

### 正常工具调用流程
```typescript
// 支持工具调用的模型正常流程
const response = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [...],
  tools: toolDefinitions,
  tool_choice: 'auto'
})
```

### 降级工具调用流程
```typescript
// 不支持工具调用的模型降级流程
const response = await openai.chat.completions.create({
  model: 'legacy-model',
  messages: [
    fallbackInstruction, // 格式化指令
    ...cleanedMessages   // 清理后的消息
  ]
  // tools 和 tool_choice 参数已自动移除
})
```

## 最佳实践

1. **模型选择**: 优先选择支持工具调用的模型
2. **错误处理**: 依赖系统的自动错误检测和修复机制
3. **测试验证**: 在不同模型环境下测试工具调用功能
4. **监控日志**: 关注工具调用错误日志和性能指标

## 限制与注意事项

- 某些旧模型可能完全无法使用工具调用功能
- 格式化输出需要模型具备良好的JSON生成能力
- 复杂的工具调用链可能在降级模式下受限
- 错误处理会增加额外的API调用和延迟

## 未来发展

- 增强的模型特性自动检测
- 更智能的错误修复策略
- 支持更多模型的工具调用兼容性
- 可视化工具调用监控和调试工具