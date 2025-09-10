# 自动完成工作流

## 整体工作流程

### 1. 输入监听阶段
```
用户输入 → 光标位置变化 → 触发补全分析
```

### 2. 上下文分析阶段
```typescript
// 使用 CompletionContextUtility 分析
const context = contextUtility.analyzeContext(input, cursorOffset)
// 返回: { type, prefix, startPos, endPos }
```

**支持的上下文类型**:
- `command`: 斜杠命令（/开头）
- `subcommand`: 子命令（空格后的命令）  
- `agent`: @提及（@开头）
- `file`: 文件路径（其他情况）

### 3. 建议生成阶段

#### 命令上下文
```typescript
case 'command':
  return commandUtility.generateCommandSuggestions(context.prefix, commands)

case 'subcommand':  
  return commandUtility.generateSubcommandSuggestions(
    context.prefix, 
    context.parentCommand
  )
```

#### 智能体上下文
```typescript
case 'agent':
  // 组合提及建议和文件建议
  const mentionSuggestions = agentUtility.generateMentionSuggestions(context.prefix)
  const fileSuggestions = fileUtility.generateFileSuggestions(context.prefix, true)
  
  // 应用权重排序
  return [...mentionSuggestions, ...fileSuggestions]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
```

#### 文件上下文
```typescript
case 'file':
  // 生成文件建议
  const fileSuggestions = fileUtility.generateFileSuggestions(context.prefix, false)
  
  // 生成Unix命令建议  
  const unixSuggestions = commandUtility.generateUnixCommandSuggestions(context.prefix)
  
  // 智能匹配智能体和模型（无需@）
  const mentionMatches = agentUtility.generateMentionSuggestions(context.prefix)
    .map(s => ({ ...s, isSmartMatch: true }))
  
  // 加权排序和去重
  return [...unixSuggestions, ...mentionMatches, ...fileSuggestions]
    .sort((a, b) => b.score - a.score)
    .filter(uniqueByValue)
    .slice(0, limit)
```

### 4. 状态管理阶段

#### 状态更新
```typescript
// 使用 CompletionStateUtility 管理状态
stateUtility.updateState({
  suggestions: generatedSuggestions,
  isActive: generatedSuggestions.length > 0,
  context: currentContext
})
```

#### 键盘交互处理
```typescript
useInput((input, key) => {
  if (key.tab && state.isActive) {
    // Tab 键补全
    completeWith(state.suggestions[state.selectedIndex], state.context)
  } else if (key.downArrow) {
    // 向下选择
    stateUtility.selectNext()
  } else if (key.upArrow) {
    // 向上选择
    stateUtility.selectPrevious() 
  } else if (key.escape) {
    // 取消补全
    stateUtility.deactivate()
  }
})
```

### 5. 补全执行阶段

#### 补全文本生成
```typescript
const completeWith = (suggestion, context) => {
  let completion: string
  
  switch (context.type) {
    case 'command':
    case 'subcommand':
      completion = `/${suggestion.value} `
      break
    case 'agent':
      completion = `@${suggestion.value} `
      break
    default:
      completion = suggestion.isSmartMatch 
        ? `@${suggestion.value} ` // 智能匹配自动添加@
        : suggestion.value + (suggestion.value.endsWith('/') ? '' : ' ')
  }
  
  // 替换输入内容
  const newInput = input.slice(0, context.startPos) + 
                   completion + 
                   input.slice(context.endPos)
  onInputChange(newInput)
}
```

## 数据流架构

### 正向数据流
```
用户输入 → 上下文分析 → 建议生成 → 状态更新 → 界面渲染 → 用户交互
```

### 反向数据流  
```
用户交互 → 状态更新 → 补全执行 → 输入更新 → 重新分析
```

## 性能优化策略

### 1. 延迟计算
- 建议列表按需生成
- 空前缀时返回空数组
- 短前缀时早期终止

### 2. 缓存机制  
- 工具类实例缓存
- 建议列表缓存
- 文件系统扫描结果缓存

### 3. 智能过滤
- 分数阈值过滤
- 结果数量限制（默认15条）
- 重复项去重

### 4. 异步加载
- 智能体配置异步加载
- 文件系统扫描异步执行
- 模型列表按需获取

## 错误处理

### 异常捕获
```typescript
try {
  // 加载智能体建议
  const agents = await getActiveAgents()
} catch (error) {
  console.warn('Failed to load agents:', error)
  return [] // 返回空数组避免阻塞
}
```

### 降级策略
- 智能体加载失败时降级为空列表
- 文件系统访问失败时降级为基本匹配
- 网络请求超时使用缓存数据

## 监控和调试

### 状态监控
```typescript
// 获取当前状态快照
const status = {
  isActive: state.isActive,
  suggestionCount: state.suggestions.length,
  contextType: state.context?.type,
  isLoading: agentUtility.getSuggestionsStatus().isLoading
}
```

### 调试模式
- 启用详细日志记录
- 显示匹配分数和权重
- 输出决策过程信息