import { parseToolCallsFromText, containsToolCall } from '../../src/utils/toolCallParser'

// 调试工具调用解析功能
console.log('🐛 调试工具调用解析功能...')

// 测试用例1: 标准的工具调用JSON
const testContent1 = `
我需要使用文件读取工具来查看文件内容。

{
  "name": "FileReadTool",
  "input": {
    "path": "/path/to/file.txt"
  },
  "reasoning": "需要读取文件内容来了解项目结构"
}

请执行这个工具调用。
`

console.log('测试用例1:')
console.log('原始内容:', testContent1)

// 手动检查JSON匹配
const jsonMatches = testContent1.match(/\{[\s\S]*?\}/g) || []
console.log('找到的JSON匹配:', jsonMatches)

for (const jsonStr of jsonMatches) {
  console.log('尝试解析JSON:', jsonStr)
  try {
    const parsed = JSON.parse(jsonStr)
    console.log('解析成功:', parsed)
  } catch (error) {
    console.log('解析失败:', error.message)
  }
}

console.log('包含工具调用:', containsToolCall(testContent1))
const toolCalls1 = parseToolCallsFromText(testContent1)
console.log('解析出的工具调用:', JSON.stringify(toolCalls1, null, 2))

// 测试用例2: 简单的JSON对象
const testContent2 = `{"name": "BashTool", "input": {"command": "ls -la"}}`

console.log('\n测试用例2:')
console.log('原始内容:', testContent2)
console.log('包含工具调用:', containsToolCall(testContent2))
const toolCalls2 = parseToolCallsFromText(testContent2)
console.log('解析出的工具调用:', JSON.stringify(toolCalls2, null, 2))