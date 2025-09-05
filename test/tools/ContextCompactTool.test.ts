import { expect, test } from 'bun:test'
import { ContextCompactTool } from '../../src/tools/ContextCompactTool/ContextCompactTool'

test('ContextCompactTool should be defined', () => {
  expect(ContextCompactTool).toBeDefined()
  expect(ContextCompactTool.name).toBe('ContextCompact')
})

test('ContextCompactTool should have correct properties', () => {
  expect(ContextCompactTool.description).toBeDefined()
  expect(ContextCompactTool.prompt).toBeDefined()
  expect(ContextCompactTool.inputSchema).toBeDefined()
  expect(ContextCompactTool.isReadOnly()).toBe(true)
  expect(ContextCompactTool.isConcurrencySafe()).toBe(true)
})

test('ContextCompactTool should execute correctly', async () => {
  const mockContext: any = {
    messageId: 'test-message-id',
    abortController: new AbortController(),
    readFileTimestamps: {},
  }
  
  const input = {
    reason: '测试压缩原因'
  }
  
  const results: any[] = []
  for await (const result of ContextCompactTool.call(input, mockContext)) {
    results.push(result)
  }
  
  expect(results.length).toBe(1)
  expect(results[0].type).toBe('result')
  expect(results[0].data.success).toBe(true)
  expect(results[0].data.message).toContain('测试压缩原因')
})