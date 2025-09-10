import { parseToolCallsFromText, containsToolCall } from '../../src/utils/toolCallParser'

// 测试工具调用解析功能
console.log('🧪 测试工具调用解析功能...')

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
console.log('包含工具调用:', containsToolCall(testContent1))
const toolCalls1 = parseToolCallsFromText(testContent1)
console.log('解析出的工具调用:', JSON.stringify(toolCalls1, null, 2))

// 测试用例2: 多个工具调用
const testContent2 = `
我需要执行多个操作：

{"name": "BashTool", "input": {"command": "ls -la"}}

{"name": "FileReadTool", "input": {"path": "package.json"}}
`

console.log('\n测试用例2:')
console.log('包含工具调用:', containsToolCall(testContent2))
const toolCalls2 = parseToolCallsFromText(testContent2)
console.log('解析出的工具调用:', JSON.stringify(toolCalls2, null, 2))

// 测试用例3: 不包含工具调用的文本
const testContent3 = `
这是一个普通的文本消息，不包含任何工具调用。
只是描述一些操作步骤。
`

console.log('\n测试用例3:')
console.log('包含工具调用:', containsToolCall(testContent3))
const toolCalls3 = parseToolCallsFromText(testContent3)
console.log('解析出的工具调用:', JSON.stringify(toolCalls3, null, 2))

console.log('\n✅ 测试完成')