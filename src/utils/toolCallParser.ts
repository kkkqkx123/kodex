import { Tool } from '../Tool'
import { ToolUseBlock } from '@anthropic-ai/sdk/resources/index.mjs'
import { z } from 'zod'

// 工具调用JSON格式的schema定义
export const jsonToolCallSchema = z.object({
  name: z.string(),
  input: z.record(z.any(), z.any()),
  reasoning: z.string().optional()
})

// 工具结果JSON格式的schema定义
export const jsonToolResultSchema = z.object({
  tool_result: z.string(),
  output: z.any(),
  status: z.enum(['success', 'error']).optional(),
  reasoning: z.string().optional()
})

/**
 * 从文本内容中解析工具调用JSON
 * @param content 文本内容
 * @returns 解析出的工具调用数组
 */
export function parseToolCallsFromText(content: string): ToolUseBlock[] {
  const toolCalls: ToolUseBlock[] = []
  
  // 尝试查找JSON对象 - 使用简单但可靠的方法
  const jsonMatches: string[] = []
  
  // 查找所有可能包含JSON的区域
  const potentialJsonRegions = content.split(/\n\s*\n/) // 按空行分割
  
  for (const region of potentialJsonRegions) {
    const trimmed = region.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        // 尝试解析以验证是否为有效JSON
        JSON.parse(trimmed)
        jsonMatches.push(trimmed)
      } catch (error) {
        // 忽略无效JSON
      }
    }
  }
  
  for (const jsonStr of jsonMatches) {
    try {
      const parsed = JSON.parse(jsonStr)
      
      // 检查是否为工具调用格式
      const toolCallResult = jsonToolCallSchema.safeParse(parsed)
      if (toolCallResult.success) {
        const { name, input, reasoning } = toolCallResult.data
        
        toolCalls.push({
          type: 'tool_use',
          id: generateToolUseId(),
          name: name,
          input: input,
          ...(reasoning && { reasoning })
        } as ToolUseBlock)
      }
    } catch (error) {
      // 忽略JSON解析错误，继续处理其他匹配
      continue
    }
  }
  
  return toolCalls
}

/**
 * 从文本内容中解析工具结果JSON
 * @param content 文本内容
 * @returns 解析出的工具结果
 */
export function parseToolResultFromText(content: string): { tool_result: string; output: any; status?: string } | null {
  try {
    const jsonMatches = content.match(/\{[\s\S]*?\}/g) || []
    
    for (const jsonStr of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonStr)
        const toolResult = jsonToolResultSchema.safeParse(parsed)
        
        if (toolResult.success) {
          return toolResult.data
        }
      } catch (error) {
        continue
      }
    }
  } catch (error) {
    // 忽略解析错误
  }
  
  return null
}

/**
 * 检查文本内容是否包含工具调用
 * @param content 文本内容
 * @returns 是否包含工具调用
 */
export function containsToolCall(content: string): boolean {
  if (!content) return false
  
  // 简单的启发式检查
  const toolCallIndicators = [
    /"name"\s*:/,
    /"tool"\s*:/,
    /"tool_result"\s*:/,
    /tool.*{/,
    /tool.*\[/
  ]
  
  return toolCallIndicators.some(pattern => pattern.test(content))
}

/**
 * 生成唯一的工具调用ID
 * @returns 工具调用ID
 */
function generateToolUseId(): string {
  return `tooluse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 提取并清理工具调用文本
 * @param content 原始文本内容
 * @returns 清理后的文本和工具调用
 */
export function extractToolCalls(content: string): {
  cleanedContent: string
  toolCalls: ToolUseBlock[]
} {
  const toolCalls = parseToolCallsFromText(content)
  
  if (toolCalls.length === 0) {
    return { cleanedContent: content, toolCalls: [] }
  }
  
  // 从内容中移除工具调用JSON，保留其他文本
  let cleanedContent = content
  const jsonMatches = content.match(/\{[\s\S]*?\}/g) || []
  
  for (const jsonStr of jsonMatches) {
    try {
      const parsed = JSON.parse(jsonStr)
      if (jsonToolCallSchema.safeParse(parsed).success) {
        cleanedContent = cleanedContent.replace(jsonStr, '').trim()
      }
    } catch (error) {
      // 忽略解析错误
    }
  }
  
  return { cleanedContent, toolCalls }
}

/**
 * 验证工具调用是否可用
 * @param toolCall 工具调用
 * @param availableTools 可用工具列表
 * @returns 是否可用
 */
export function validateToolCall(
  toolCall: ToolUseBlock,
  availableTools: Tool[]
): boolean {
  const tool = availableTools.find(t => t.name === toolCall.name)
  if (!tool) return false
  
  try {
    // 验证输入是否符合工具schema
    tool.validateInput(toolCall.input as Record<string, unknown>)
    return true
  } catch (error) {
    return false
  }
}