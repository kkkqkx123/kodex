# AGENTS.md 文件读取与上下文注入机制分析

## 概述
本文档详细分析了 Kode 项目中 AGENTS.md 文件的读取机制和上下文注入流程。项目完全支持 Claude Code 标准协议，能够自动读取项目根目录的 AGENTS.md 文件并将其内容注入到 AI 模型的系统提示词中。

## 文件读取机制

### 1. 项目文档获取函数
在 `src/context.ts` 中实现了 `getProjectDocs` 函数：

```typescript
export const getProjectDocs = memoize(async (): Promise<string | null> => {
  // 搜索并读取项目中的 AGENTS.md 和 CLAUDE.md 文件
  const claudeFiles = await getClaudeFiles()
  
  if (claudeFiles.length === 0) {
    return null
  }
  
  // 读取所有文件内容并整合
  const contents = await Promise.all(
    claudeFiles.map(async (file) => {
      try {
        const content = await readFile(file, 'utf-8')
        return `# ${basename(file)}\n\n${content}`
      } catch (error) {
        console.warn(`Failed to read ${file}:`, error)
        return null
      }
    })
  )
  
  return contents.filter(Boolean).join('\n\n---\n\n')
})
```

### 2. 文件搜索功能
`getClaudeFiles` 函数负责搜索项目中的标准文档文件：

```typescript
async function getClaudeFiles(): Promise<string[]> {
  const files: string[] = []
  
  // 检查项目根目录的标准文件
  const standardFiles = ['AGENTS.md', 'CLAUDE.md']
  
  for (const filename of standardFiles) {
    const filepath = join(process.cwd(), filename)
    if (await fileExists(filepath)) {
      files.push(filepath)
    }
  }
  
  return files
}
```

## 上下文注入流程

### 1. 系统提示词格式化
在 `src/services/claude.ts` 中的 `formatSystemPromptWithContext` 函数：

```typescript
export function formatSystemPromptWithContext(
  systemPrompt: string[],
  context: { [k: string]: string },
  agentId?: string,
  skipContextReminders = false
): { systemPrompt: string[]; reminders: string } {
  const enhancedPrompt = [...systemPrompt]
  
  if (Object.entries(context).length > 0) {
    // 步骤1: 直接注入 Kode 上下文到系统提示
    if (!skipContextReminders) {
      const kodeContext = generateKodeContext()
      if (kodeContext) {
        enhancedPrompt.push('\n---\n# 项目上下文\n')
        enhancedPrompt.push(kodeContext)
        enhancedPrompt.push('\n---\n')
      }
    }
    
    // 过滤掉已处理的文档上下文（避免重复）
    const filteredContext = Object.fromEntries(
      Object.entries(context).filter(
        ([key]) => key !== 'projectDocs' && key !== 'userDocs'
      )
    )
    
    enhancedPrompt.push(
      `\nAs you answer the user's questions, you can use the following context:\n`,
      ...Object.entries(filteredContext).map(
        ([key, value]) => `<context name="${key}">${value}</context>`
      )
    )
  }
  
  return { systemPrompt: enhancedPrompt, reminders: '' }
}
```

### 2. Kode 上下文生成
`generateKodeContext` 函数调用缓存管理器：

```typescript
export const generateKodeContext = (): string => {
  return kodeContextManager.getKodeContext()
}
```

## 缓存管理机制

### 1. 上下文管理器
在 `src/services/claude.ts` 中实现了 `KodeContextManager` 类：

```typescript
class KodeContextManager {
  private projectDocsCache: string = ''
  private cacheInitialized: boolean = false
  private initPromise: Promise<void> | null = null
  
  private async loadProjectDocs(): Promise<void> {
    try {
      const projectDocs = await getProjectDocs()
      this.projectDocsCache = projectDocs || ''
      this.cacheInitialized = true
      
      // 开发模式下记录加载结果
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[KodeContext] Loaded ${this.projectDocsCache.length} characters from project docs`
        )
      }
    } catch (error) {
      console.warn('[KodeContext] Failed to load project docs:', error)
      this.projectDocsCache = ''
      this.cacheInitialized = true
    }
  }
  
  public getKodeContext(): string {
    if (!this.cacheInitialized) {
      // 异步初始化但立即返回空字符串
      this.initialize().catch(console.warn)
      return ''
    }
    return this.projectDocsCache
  }
}
```

## 使用统计

根据上下文导出数据分析：

| 组件 | Token数 | 大小 | 占比 |
|------|---------|------|------|
| System prompt | 15.3k | 59.8kb | 69% |
| 项目文档 | 3.7k | 14.4kb | 17% |

AGENTS.md 内容作为"项目文档"部分占用系统提示词总容量的 17%，是代码风格和项目配置的重要组成部分。

## 结论

1. **完整支持标准协议**: 项目完全支持 Claude Code 的 AGENTS.md 标准协议
2. **自动文件读取**: 自动搜索并读取项目根目录的 AGENTS.md 和 CLAUDE.md 文件
3. **智能上下文注入**: 通过 `formatSystemPromptWithContext` 函数将项目文档注入系统提示词
4. **缓存优化**: 使用 LRU 缓存和异步加载机制优化性能
5. **避免重复**: 智能过滤已处理的文档上下文，避免信息重复

这种设计确保了 AI 助手能够获得项目特定的架构信息、开发指南和最佳实践，从而提高代码理解和任务执行的准确性。