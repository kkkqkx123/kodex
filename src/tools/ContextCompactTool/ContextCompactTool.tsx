import * as React from 'react'
import { z } from 'zod'
import type { Tool, ToolUseContext } from '../../Tool'
import { DESCRIPTION, PROMPT } from './prompt'

const inputSchema = z.strictObject({
  reason: z.string().describe('The reason AI decides to compress the context'),
})

export const ContextCompactTool = {
  name: 'ContextCompact',
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  inputSchema,
  isReadOnly() {
    return true
  },
  isConcurrencySafe() {
    return true
  },
  userFacingName() {
    return 'Context Compact'
  },
  async isEnabled() {
    return true
  },
  needsPermissions() {
    return false
  },
  renderToolUseMessage(input) {
    return `reason: ${input.reason}`
  },
  renderToolUseRejectedMessage() {
    return <div>Context compression tool call rejected</div>
  },
  renderToolResultMessage() {
    return (
      <div>
        <p>Context has been compressed</p>
      </div>
    )
  },
  renderResultForAssistant(output) {
    return `Context compression completed: ${output.message}`
  },
  async *call(input, context: ToolUseContext) {
    // 模拟上下文压缩逻辑
    // 在实际实现中，这里会与AI系统集成，执行真正的上下文压缩
    const result = {
      success: true,
      message: `Successfully compressed context based on reason "${input.reason}"`,
      // 在实际实现中，这里可能会返回压缩后的上下文大小等信息
      compressedSize: 0,
      originalSize: 0,
    }
    
    yield {
      type: 'result' as const,
      data: result,
      resultForAssistant: `Context compression completed: ${result.message}`,
    }
  },
}