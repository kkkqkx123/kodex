import { expect, test, describe, beforeEach, afterEach } from 'bun:test'
import { TaskTool, getActiveTasks } from '../../src/tools/TaskTool/TaskTool'

describe('TaskTool', () => {
  beforeEach(() => {
    // Clean up any active tasks before each test
    const activeTasks = getActiveTasks()
    activeTasks.clear()
  })

  afterEach(() => {
    // Clean up any active tasks after each test
    const activeTasks = getActiveTasks()
    activeTasks.clear()
  })

  test('TaskTool should be defined and have correct properties', () => {
    expect(TaskTool).toBeDefined()
    expect(TaskTool.name).toBe('Task')
    expect(TaskTool.description).toBeDefined()
    expect(TaskTool.prompt).toBeDefined()
    expect(TaskTool.inputSchema).toBeDefined()
    expect(TaskTool.supportsProgress).toBe(true)
    expect(TaskTool.progress).toBeDefined()
    expect(TaskTool.isReadOnly()).toBe(true)
    expect(TaskTool.isConcurrencySafe()).toBe(true)
  })

  test('TaskTool should have progress method', () => {
    expect(typeof TaskTool.progress).toBe('function')
  })

  test('TaskTool progress method should return correct structure', async () => {
    const mockContext: any = {
      messageId: 'test-message-id',
      abortController: new AbortController(),
      readFileTimestamps: {}
    }

    const progressInfo = await TaskTool.progress!(mockContext)
    
    expect(progressInfo).toBeDefined()
    expect(progressInfo).toHaveProperty('current')
    expect(progressInfo).toHaveProperty('total')
    expect(progressInfo).toHaveProperty('message')
    expect(progressInfo).toHaveProperty('percentage')
    expect(typeof progressInfo.current).toBe('number')
    expect(typeof progressInfo.total).toBe('number')
    expect(progressInfo.total).toBe(100)
  })

  test('TaskTool progress method should return default values when no active tasks', async () => {
    const mockContext: any = {
      messageId: 'test-message-id',
      abortController: new AbortController(),
      readFileTimestamps: {}
    }

    const progressInfo = await TaskTool.progress!(mockContext)
    
    expect(progressInfo.current).toBe(0)
    expect(progressInfo.total).toBe(100)
    expect(progressInfo.percentage).toBe(0)
    expect(progressInfo.message).toBe('No active tasks')
  })

  test('TaskTool should track active tasks', () => {
    const activeTasks = getActiveTasks()
    expect(activeTasks).toBeInstanceOf(Map)
  })

  test('TaskTool should validate input correctly', async () => {
    const mockContext: any = {
      messageId: 'test-message-id',
      abortController: new AbortController(),
      readFileTimestamps: {}
    }

    // Test missing description
    const input1 = {
      prompt: 'Test prompt'
    } as any

    const validation1 = await TaskTool.validateInput!(input1, mockContext)
    expect(validation1.result).toBe(false)
    expect(validation1.message).toContain('Description is required')

    // Test missing prompt
    const input2 = {
      description: 'Test description'
    } as any

    const validation2 = await TaskTool.validateInput!(input2, mockContext)
    expect(validation2.result).toBe(false)
    expect(validation2.message).toContain('Prompt is required')

    // Test valid input
    const input3 = {
      description: 'Test description',
      prompt: 'Test prompt'
    }

    const validation3 = await TaskTool.validateInput!(input3, mockContext)
    expect(validation3.result).toBe(true)
  })
})