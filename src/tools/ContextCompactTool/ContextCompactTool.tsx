import * as React from 'react'
import { z } from 'zod'
import type { Tool, ToolUseContext } from '../../Tool'
import { DESCRIPTION, PROMPT } from './prompt'

const inputSchema = z.strictObject({
  reason: z.string().describe('AI决定压缩上下文的原因'),
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
    return <div>上下文压缩工具调用被拒绝</div>
  },
  renderToolResultMessage() {
    return (
      <div>
        <p>上下文已压缩</p>
      </div>
    )
  },
  renderResultForAssistant(output) {
    return `上下文压缩完成: ${output.message}`
  },
  async *call(input, context: ToolUseContext) {
    // 模拟上下文压缩逻辑
    // 在实际实现中，这里会与AI系统集成，执行真正的上下文压缩
    const result = {
      success: true,
      message: `基于原因"${input.reason}"成功压缩上下文`,
      // 在实际实现中，这里可能会返回压缩后的上下文大小等信息
      compressedSize: 0,
      originalSize: 0,
    }
    
    yield {
      type: 'result' as const,
      data: result,
      resultForAssistant: `上下文压缩完成: ${result.message}`,
    }
  },
}