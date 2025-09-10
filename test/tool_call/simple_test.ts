import { parseToolCallsFromText, containsToolCall } from '../../src/utils/toolCallParser'

// 简单测试工具调用解析功能
console.log('🧪 简单测试工具调用解析功能...')

// 测试用例: 简单的JSON对象
const testContent = `{"name": "BashTool", "input": {"command": "ls -la"}}`

console.log('测试内容:', testContent)
console.log('包含工具调用:', containsToolCall(testContent))

const toolCalls = parseToolCallsFromText(testContent)
console.log('解析出的工具调用数量:', toolCalls.length)

if (toolCalls.length > 0) {
  console.log('第一个工具调用:', JSON.stringify(toolCalls[0], null, 2))
  console.log('工具名称:', toolCalls[0].name)
  console.log('输入参数:', toolCalls[0].input)
} else {
  console.log('❌ 没有解析出工具调用')
}

console.log('✅ 测试完成')