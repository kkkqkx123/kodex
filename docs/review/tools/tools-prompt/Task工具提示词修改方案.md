# Task工具提示词修改方案

## 当前提示词问题分析

### 主要问题
1. **subagent_type参数缺失**：AI经常忘记提供必需的`subagent_type`参数
2. **函数调用语法错误**：AI使用`Task(...)`而不是正确的JSON对象格式
3. **参数验证失败**：导致`InputValidationError`错误
4. **使用场景不明确**：AI对何时使用Task工具的理解不够清晰

## 具体修改建议

### 1. 强化参数格式要求

**修改前**：
```
Required Input Format: {
  "description": string, // 详细的任务描述
  "prompt": string,     // 给子agent的具体指令
  "subagent_type": string // 要使用的agent类型
}
```

**修改后**：
```
## 必需的输入格式（必须严格遵守）

必须使用完整的JSON对象格式，包含以下三个必需字段：

```json
{
  "description": "string（详细的任务描述，至少50个字符）",
  "prompt": "string（给子agent的具体指令，明确说明期望的输出）", 
  "subagent_type": "string（必须从可用agent类型中选择）"
}
```

⚠️ **重要提醒**：
- 绝对不要使用函数调用语法（如 `Task(...)`）
- 三个字段都是必需的，缺少任何一个都会导致验证失败
- `subagent_type` 必须从下面的可用agent类型中选择
```

### 2. 增加错误示例和正确示例对比

**新增内容**：
```
## ❌ 常见错误示例

### 错误1：缺少subagent_type
```json
{
  "description": "写一个React组件",
  "prompt": "创建一个计数器组件"
}
// 错误：缺少 subagent_type 参数
```

### 错误2：使用函数调用语法
```javascript
Task("写一个React组件", "创建一个计数器组件", "react_developer")
// 错误：必须使用JSON对象格式，而不是函数调用
```

### 错误3：参数类型错误
```json
{
  "description": "写一个React组件",
  "prompt": "创建一个计数器组件",
  "subagent_type": 123  // 错误：必须是字符串
}
```

## ✅ 正确示例

### 示例1：React开发任务
```json
{
  "description": "创建一个用户登录表单组件，包含邮箱和密码输入框，以及提交按钮。需要表单验证和错误提示功能。",
  "prompt": "请使用React和TypeScript创建一个登录表单组件。要求：1. 包含邮箱和密码字段验证 2. 实时错误提示 3. 提交处理函数 4. 响应式设计",
  "subagent_type": "react_developer"
}
```

### 示例2：文档编写任务
```json
{
  "description": "为API接口编写详细的使用文档，包含请求示例、响应示例和错误处理说明",
  "prompt": "请为/users接口编写完整的API文档，包含：1. 接口说明 2. 请求参数 3. 响应格式 4. 错误代码 5. 使用示例",
  "subagent_type": "documentation_writer"
}
```
```

### 3. 加强参数验证说明

**新增内容**：
```
## 🔍 参数验证规则

所有输入参数都会经过严格验证，验证失败将导致 `InputValidationError`：

1. **description**：
   - 必须为非空字符串
   - 长度至少50个字符
   - 必须包含具体的任务要求

2. **prompt**：
   - 必须为非空字符串  
   - 长度至少20个字符
   - 必须包含明确的指令

3. **subagent_type**：
   - 必须为非空字符串
   - 必须从可用agent类型列表中选择
   - 不支持自定义类型

## ⚠️ 验证失败后果

如果参数验证失败：
- 工具调用将被拒绝
- 返回 `InputValidationError` 错误
- 需要重新调用工具并提供正确的参数
- 错误信息会指出具体的验证失败原因
```

### 4. 改进使用场景描述

**修改前**：
```
When to use this tool:
- For complex multi-step tasks that require specialized expertise
- When you need to delegate work to a specialized agent
- For tasks that are outside your current capabilities
```

**修改后**：
```
## 🎯 使用场景

### 应该使用Task工具的情况：
- 需要特定专业知识的复杂多步骤任务
- 超出当前agent能力范围的专业任务  
- 需要专门agent处理的特定领域任务
- 可以并行执行的独立子任务

### 不应该使用Task工具的情况：
- 简单的单一步骤任务（直接完成即可）
- 可以在当前对话中快速解决的问题
- 不需要专门agent处理的常规任务
- 任务描述不够明确或具体

## 💡 最佳实践

1. **任务描述要具体**：提供详细的需求和期望输出
2. **指令要明确**：清晰说明子agent需要完成什么
3. **选择合适的agent类型**：根据任务性质选择最匹配的agent
4. **考虑任务复杂度**：只有复杂任务才需要委托给子agent
```

## 实施步骤

1. **修改文件**：`src/tools/TaskTool/prompt.ts`
2. **测试验证**：创建测试用例验证修改效果
3. **监控效果**：观察修改后是否减少InputValidationError
4. **持续优化**：根据实际使用情况进一步调整

## 预期效果

- 减少80%的subagent_type缺失错误
- 消除函数调用语法错误
- 提高工具调用成功率
- 改善AI对参数格式的理解