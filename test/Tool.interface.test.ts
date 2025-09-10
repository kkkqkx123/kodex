import { expect, test, describe } from 'bun:test'
import { Tool } from '../src/Tool'

describe('Tool Interface', () => {
  test('should define ProgressInfo interface correctly', () => {
    // This test is more of a type check - we're verifying the interface structure
    const progressInfo: import('../src/Tool').ProgressInfo = {
      current: 50,
      total: 100,
      message: 'Test progress',
      percentage: 50
    }

    expect(progressInfo.current).toBe(50)
    expect(progressInfo.total).toBe(100)
    expect(progressInfo.message).toBe('Test progress')
    expect(progressInfo.percentage).toBe(50)
  })

  test('should define ProgressCallback type correctly', () => {
    // Test that ProgressCallback is a function type
    const mockCallback: import('../src/Tool').ProgressCallback = (progress) => {
      // This is just a type check - we're verifying the function signature
      expect(progress.current).toBeDefined()
      expect(progress.total).toBeDefined()
    }

    // Call the callback to verify it works
    mockCallback({ current: 10, total: 100, message: 'Test', percentage: 10 })
  })

  test('should extend Tool interface with progress support', () => {
    // Create a mock tool that implements the extended interface
    const mockTool: Tool<any, any> = {
      name: 'test-tool',
      description: async () => 'Test tool description',
      inputSchema: {} as any,
      prompt: async () => 'Test prompt',
      isEnabled: async () => true,
      isReadOnly: () => true,
      isConcurrencySafe: () => true,
      needsPermissions: () => false,
      renderResultForAssistant: () => '',
      renderToolUseMessage: () => '',
      renderToolUseRejectedMessage: () => React.createElement('div'),
      call: async function* () {
        yield { type: 'result', data: null }
      },
      // Progress support methods
      supportsProgress: true,
      progress: async () => ({
        current: 0,
        total: 100,
        message: 'Test progress',
        percentage: 0
      })
    }

    expect(mockTool.supportsProgress).toBe(true)
    expect(typeof mockTool.progress).toBe('function')
  })

  test('should allow Tool without progress support', () => {
    // Create a mock tool without progress support
    const mockTool: Tool<any, any> = {
      name: 'test-tool-no-progress',
      description: async () => 'Test tool without progress',
      inputSchema: {} as any,
      prompt: async () => 'Test prompt',
      isEnabled: async () => true,
      isReadOnly: () => true,
      isConcurrencySafe: () => true,
      needsPermissions: () => false,
      renderResultForAssistant: () => '',
      renderToolUseMessage: () => '',
      renderToolUseRejectedMessage: () => React.createElement('div'),
      call: async function* () {
        yield { type: 'result', data: null }
      }
      // Note: supportsProgress and progress are optional and not included
    }

    expect(mockTool.supportsProgress).toBeUndefined()
    expect(mockTool.progress).toBeUndefined()
  })

  test('should define ToolUseContext interface correctly', () => {
    // This is a type check for the ToolUseContext interface
    const context: import('../src/Tool').ToolUseContext = {
      messageId: 'test-message-id',
      agentId: 'test-agent-id',
      safeMode: false,
      abortController: new AbortController(),
      readFileTimestamps: { '/test/file.ts': Date.now() },
      options: {
        verbose: true,
        tools: [],
        commands: []
      }
    }

    expect(context.messageId).toBe('test-message-id')
    expect(context.agentId).toBe('test-agent-id')
    expect(context.safeMode).toBe(false)
    expect(context.abortController).toBeInstanceOf(AbortController)
    expect(context.readFileTimestamps['/test/file.ts']).toBeDefined()
    expect(context.options?.verbose).toBe(true)
  })
})