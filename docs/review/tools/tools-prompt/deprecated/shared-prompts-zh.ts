/**
 * 工具响应格式公共提示词
 */

export const TOOL_RESPONSE_PROMPTS = {
  // 基础响应格式
  base: `以简洁、一致的格式展示工具结果。`,

  // 文件操作类
  fileOperations: `文件操作结果格式：
- 开头用✅表示成功，❌表示失败
- 包含完整的文件路径
- 内容超过5行时只显示前5行，并提示"... (+N行)"
- 代码内容使用行号格式化`,

  // 搜索类
  search: `搜索结果格式：
- 开头用🔍表示搜索操作
- 显示找到的条目数量
- 每个结果单独一行
- 超过10个结果时截断并提示`,

  // 命令执行类
  command: `命令执行结果格式：
- 开头用$表示执行的命令
- 直接显示标准输出
- 错误信息用[ERROR]前缀标识
- 不添加额外解释文字`,

  // 统一工具
  sharedUtils: {
    // 行号格式化工具
    lineNumbers: (content: string, startLine = 1) => {
      return content
        .split('\n')
        .map((line, i) => `${(i + startLine).toString().padStart(4)}: ${line}`)
        .join('\n')
    },

    // 结果截断提示
    truncation: (total: number, shown: number) => 
      shown < total ? `... (+${total - shown}更多)` : '',

    // 文件大小格式化
    fileSize: (bytes: number) => {
      if (bytes < 1024) return `${bytes}B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`
    }
  }
} as const