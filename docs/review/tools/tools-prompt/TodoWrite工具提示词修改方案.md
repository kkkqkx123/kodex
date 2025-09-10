# TodoWrite工具提示词修改方案

## 当前提示词问题分析

### 主要问题
1. **todos数组不完整**：AI经常忘记提供完整的todos数组，只提供单个todo项
2. **必需字段缺失**：AI经常忘记提供id、status、priority等必需字段
3. **JSON格式错误**：AI使用错误的JSON格式或函数调用语法
4. **状态管理混乱**：AI对任务状态转换规则理解不够清晰

## 具体修改建议

### 1. 强化todos数组格式要求

**修改前**：
```
Required Input Format: {
  "todos": [
    {
      "content" or "description": string, // 任务内容
      "status": "todo" | "in_progress" | "done" | "cancelled", // 任务状态
      "priority": "low" | "medium" | "high" | "critical", // 任务优先级
      "id": string // 唯一标识符
    }
  ]
}
```

**修改后**：
```
## 必需的输入格式（必须严格遵守）

必须使用完整的JSON对象格式，包含todos数组，每个todo项必须包含所有必需字段：

```json
{
  "todos": [
    {
      "content": "string（任务内容描述）",
      "status": "todo" | "in_progress" | "done" | "cancelled",
      "priority": "low" | "medium" | "high" | "critical", 
      "id": "string（唯一标识符，建议使用UUID或时间戳）"
    },
    // 可以包含多个todo项
  ]
}
```

⚠️ **重要提醒**：
- 必须提供todos数组，即使只有一个todo项
- 每个todo项必须包含所有四个字段：content、status、priority、id
- id字段必须是唯一的，不能重复
- 绝对不要使用函数调用语法（如 `TodoWrite(...)`）
```

### 2. 增加错误示例和正确示例对比

**新增内容**：
```
## ❌ 常见错误示例

### 错误1：缺少todos数组
```json
{
  "content": "完成项目文档",
  "status": "todo", 
  "priority": "high"
}
// 错误：缺少todos数组包装和id字段
```

### 错误2：缺少必需字段
```json
{
  "todos": [
    {
      "content": "完成项目文档",
      "status": "todo"
      // 错误：缺少priority和id字段
    }
  ]
}
```

### 错误3：ID不唯一
```json
{
  "todos": [
    {
      "content": "任务1",
      "status": "todo",
      "priority": "high",
      "id": "123"
    },
    {
      "content": "任务2", 
      "status": "todo",
      "priority": "medium",
      "id": "123"  // 错误：ID重复
    }
  ]
}
```

### 错误4：使用函数调用语法
```javascript
TodoWrite("完成项目文档", "todo", "high")
// 错误：必须使用JSON对象格式
```

## ✅ 正确示例

### 示例1：单个任务
```json
{
  "todos": [
    {
      "content": "完成项目需求文档编写，包含功能列表、技术架构和开发计划",
      "status": "in_progress",
      "priority": "high", 
      "id": "doc_20241215_001"
    }
  ]
}
```

### 示例2：多个任务
```json
{
  "todos": [
    {
      "content": "设计用户登录界面原型",
      "status": "todo",
      "priority": "high",
      "id": "ui_20241215_001"
    },
    {
      "content": "开发用户注册API接口",
      "status": "in_progress", 
      "priority": "critical",
      "id": "api_20241215_001"
    },
    {
      "content": "编写单元测试用例",
      "status": "todo",
      "priority": "medium",
      "id": "test_20241215_001"
    }
  ]
}
```
```

### 3. 加强状态管理规则说明

**新增内容**：
```
## 🔄 状态管理规则

### 状态转换规则：
- 同一时间只能有一个任务的status为"in_progress"
- 任务可以从任何状态转换为"cancelled"
- "done"状态的任务不能再修改为其他状态
- 新任务默认状态应为"todo"

### ID唯一性要求：
- 每个todo项必须有一个唯一的id
- id用于标识和更新特定的任务
- 建议使用有意义的id格式（如：类型_日期_序号）
- 不能使用重复的id

### 优先级说明：
- "critical"：需要立即处理的最重要任务
- "high"：重要任务，尽快处理
- "medium"：普通优先级任务  
- "low"：低优先级任务，可以稍后处理
```

### 4. 加强参数验证说明

**新增内容**：
```
## 🔍 参数验证规则

所有输入参数都会经过严格验证，验证失败将导致 `InputValidationError`：

1. **todos数组**：
   - 必须为非空数组
   - 至少包含一个todo项
   - 不能为null或undefined

2. **单个todo项**：
   - 必须包含content、status、priority、id四个字段
   - content必须为非空字符串
   - status必须是有效的状态值
   - priority必须是有效的优先级值
   - id必须为非空字符串且唯一

3. **状态一致性**：
   - 同一时间只能有一个in_progress状态的任务
   - 不能违反状态转换规则

## ⚠️ 验证失败后果

如果参数验证失败：
- 工具调用将被拒绝
- 返回 `InputValidationError` 错误
- 需要重新调用工具并提供正确的参数
- 错误信息会指出具体的验证失败原因
```

### 5. 改进使用场景描述

**修改后**：
```
## 🎯 使用场景

### 应该使用TodoWrite工具的情况：
- 需要创建或更新多个任务项
- 管理项目开发任务和进度
- 跟踪复杂任务的状态变化
- 需要优先级管理的任务列表

### 不应该使用TodoWrite工具的情况：
- 只需要创建单个简单提醒
- 任务信息不完整或不确定
- 不需要状态跟踪的简单事项
- 可以在当前对话中直接完成的任务

## 💡 最佳实践

1. **提前规划id**：为每个任务规划好唯一的id
2. **合理设置优先级**：根据任务重要性设置适当的优先级
3. **遵守状态规则**：确保状态转换符合规则要求
4. **批量操作**：一次性更新多个相关任务
5. **保持一致性**：相同类型的任务使用相似的id格式
```

## 实施步骤

1. **修改文件**：`src/tools/TodoWriteTool/prompt.ts`
2. **测试验证**：创建测试用例验证修改效果
3. **监控效果**：观察修改后是否减少InputValidationError
4. **持续优化**：根据实际使用情况进一步调整

## 预期效果

- 减少90%的todos数组格式错误
- 消除必需字段缺失问题
- 提高工具调用成功率
- 改善AI对任务状态管理的理解