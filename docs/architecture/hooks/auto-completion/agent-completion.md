# 智能体自动完成功能

## 功能概述

智能体自动完成功能提供 @ 提及智能体和模型的智能补全，支持：
- **智能体提及补全**：`@run-agent-*` 格式的智能体选择
- **模型咨询补全**：`@ask-*` 格式的模型选择  
- **智能模糊匹配**：无需 @ 符号的直接匹配
- **混合上下文**：在文件上下文中智能匹配智能体

## 核心实现

### AgentCompletionUtility 类

#### 初始化阶段
```typescript
// 加载智能体建议
const agents = await getActiveAgents()
const suggestions = agents.map(config => ({
  value: `run-agent-${config.agentType}`,
  displayValue: `👤 run-agent-${config.agentType} :: ${shortDesc}`,
  type: 'agent',
  score: 85
}))

// 加载模型建议  
const allModels = modelManager.getAllAvailableModelNames()
const suggestions = allModels.map(modelId => ({
  value: `ask-${modelId}`,
  displayValue: `🦜 ask-${modelId} :: Consult ${modelId} for expert opinion`,
  type: 'ask', 
  score: 90 // 高于智能体优先级
}))
```

#### 智能描述算法
```typescript
// 智能描述截断算法
const findSmartBreak = (text: string, maxLength: number) => {
  // 优先按句子结束符截断
  const sentenceEndings = /[.!。!]/
  const firstSentenceMatch = text.search(sentenceEndings)
  
  // 其次按逗号截断
  const commaEndings = /[,，]/
  
  // 最后按长度截断
  return text.slice(0, maxLength) + '...'
}
```

## 匹配算法

### 生成提及建议
```typescript
generateMentionSuggestions(prefix: string): UnifiedSuggestion[] {
  const allSuggestions = [...agentSuggestions, ...modelSuggestions]
  
  if (!prefix) {
    // 空前缀时显示所有建议，ask模型优先
    return allSuggestions.sort((a, b) => {
      if (a.type === 'ask' && b.type === 'agent') return -1
      if (a.type === 'agent' && b.type === 'ask') return 1
      return b.score - a.score
    })
  }
  
  // 使用模糊匹配算法
  const candidates = allSuggestions.map(s => s.value)
  const matches = matchCommands(candidates, prefix)
  
  // 应用模糊分数并排序
  return matches.map(match => ({
    ...allSuggestions.find(s => s.value === match.command)!,
    score: match.score
  })).sort((a, b) => b.score - a.score)
}
```

### 智能匹配（无需@符号）
```typescript
generateSmartMentionSuggestions(
  prefix: string,
  sourceContext: 'file' | 'agent' = 'file',
  calculateMatchScore: (suggestion: UnifiedSuggestion, prefix: string) => number
): UnifiedSuggestion[] {
  if (!prefix || prefix.length < 2) return []
  
  return allSuggestions
    .map(suggestion => {
      const matchScore = calculateMatchScore(suggestion, prefix)
      if (matchScore === 0) return null
      
      return {
        ...suggestion,
        score: matchScore,
        isSmartMatch: true, // 标记为智能匹配
        originalContext: sourceContext,
        displayValue: `🎯 ${suggestion.displayValue}` // 特殊标识
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // 限制结果数量
}
```

## 集成工作流

### 在统一完成系统中的集成
```typescript
case 'agent': {
  // @ 提及上下文：组合提及和文件建议
  const mentionSuggestions = agentUtility.generateMentionSuggestions(context.prefix)
  const fileSuggestions = fileUtility.generateFileSuggestions(context.prefix, true)
  
  // 应用权重：提及建议权重+150，文件建议权重+100
  const weightedSuggestions = [
    ...mentionSuggestions.map(s => ({ ...s, weightedScore: s.score + 150 })),
    ...fileSuggestions.map(s => ({ ...s, weightedScore: s.score + 100 }))
  ]
  
  return weightedSuggestions
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, limit)
}

case 'file': {
  // 在文件上下文中智能匹配智能体和模型
  const mentionMatches = agentUtility.generateMentionSuggestions(context.prefix)
    .map(s => ({
      ...s,
      isSmartMatch: true, // 标记为智能匹配
      displayValue: `→ ${s.displayValue}` // 箭头标识
    }))
  
  // 应用优先级权重
  const weightedSuggestions = [
    ...mentionMatches.map(s => ({ ...s, weightedScore: s.score + 50 }))
  ]
  
  return weightedSuggestions.sort((a, b) => b.weightedScore - a.weightedScore)
}
```

## 补全执行

### 智能体补全格式
```typescript
if (context.type === 'agent') {
  if (suggestion.type === 'agent') {
    completion = `@${suggestion.value} ` // @run-agent-*
  } else if (suggestion.type === 'ask') {
    completion = `@${suggestion.value} ` // @ask-*
  } else {
    completion = `@${suggestion.value} ` // 其他情况
  }
} else {
  if (suggestion.isSmartMatch) {
    completion = `@${suggestion.value} ` // 智能匹配自动添加@
  }
}
```

## 性能特性

- **延迟加载**：智能体和模型建议按需加载
- **缓存机制**：建议列表缓存避免重复计算
- **智能过滤**：早期终止低分匹配项
- **结果限制**：默认限制15条建议

## 扩展性

- 支持动态添加新的智能体类型
- 可配置的匹配算法参数
- 易于集成新的模型提供商
- 支持自定义权重和排序规则