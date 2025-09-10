import { expect, test, describe } from 'bun:test'
import { hasPermissionsToUseTool } from '../../src/permissions'
import { FileEditTool } from '../../src/tools/FileEditTool/FileEditTool'
import { getCurrentProjectConfig } from '../../src/utils/config/project'
import type { ProjectConfig } from '../../src/utils/config/types'
import type { ToolUseContext } from '../../src/Tool'
import type { AssistantMessage } from '../../src/query'
import type { Tool } from '../../src/Tool'

// Create a simple mock tool for testing
const MockTool: Tool<any, any> = {
  name: 'MockTool',
  description: async () => 'Mock tool for testing',
  inputSchema: {} as any,
  prompt: async () => 'Mock prompt',
  isEnabled: async () => true,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  needsPermissions: () => true,
  renderResultForAssistant: () => '',
  renderToolUseMessage: () => 'MockTool(test)',
  renderToolUseRejectedMessage: () => null as any,
  call: async function* () {
    yield { type: 'result', data: null }
  }
}

// Mock the config functions
let mockConfig: ProjectConfig = {
  allowedTools: [],
  sessionAllowedTools: [],
  onceAllowedTools: {},
  context: {},
  history: [],
  mcpContextUris: [],
  projects: {}
}

// Override the functions
Object.defineProperty(require('../../src/utils/config/project'), 'getCurrentProjectConfig', {
  value: () => mockConfig,
  writable: true
})

describe('Permission Check Logic', () => {
  const mockContext: ToolUseContext = {
    messageId: 'test-message-id',
    agentId: 'test-agent-id',
    safeMode: true,
    abortController: new AbortController(),
    readFileTimestamps: {},
    options: {
      tools: [],
      commands: []
    }
  }

  const mockAssistantMessage: AssistantMessage = {
    type: 'assistant',
    costUSD: 0,
    durationMs: 0,
    uuid: '00000000-0000-0000-0000-000000000000',
    message: {
      id: 'test-message-id',
      model: 'test-model',
      role: 'assistant',
      stop_reason: 'stop_sequence',
      stop_sequence: '',
      type: 'message',
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation: null,
        server_tool_use: null,
        service_tier: null
      },
      content: [{ type: 'text', text: 'test content', citations: [] }]
    }
  }

  test('should allow tool when safe mode is disabled', async () => {
    const result = await hasPermissionsToUseTool(
      MockTool,
      { test: 'value' },
      { ...mockContext, safeMode: false },
      mockAssistantMessage
    )

    expect(result.result).toBe(true)
  })

  test('should allow tool when it does not need permissions', async () => {
    // Create a mock tool that doesn't need permissions
    const mockToolNoPerm = {
      ...MockTool,
      needsPermissions: () => false
    }

    const result = await hasPermissionsToUseTool(
      mockToolNoPerm,
      { test: 'value' },
      mockContext,
      mockAssistantMessage
    )

    expect(result.result).toBe(true)
  })

  test('should check project permissions', async () => {
    // Mock config with project permission
    mockConfig = {
      allowedTools: ['MockTool'],
      sessionAllowedTools: [],
      onceAllowedTools: {},
      context: {},
      history: [],
      mcpContextUris: [],
      projects: {}
    }

    const result = await hasPermissionsToUseTool(
      MockTool,
      { test: 'value' },
      mockContext,
      mockAssistantMessage
    )

    expect(result.result).toBe(true)
  })

  test('should check session permissions', async () => {
    // Mock config with session permission
    mockConfig = {
      allowedTools: [],
      sessionAllowedTools: ['MockTool'],
      onceAllowedTools: {},
      context: {},
      history: [],
      mcpContextUris: [],
      projects: {}
    }

    const result = await hasPermissionsToUseTool(
      MockTool,
      { test: 'value' },
      mockContext,
      mockAssistantMessage
    )

    expect(result.result).toBe(true)
  })

  test('should check once permissions within 5 seconds', async () => {
    // Mock config with once permission
    mockConfig = {
      allowedTools: [],
      sessionAllowedTools: [],
      onceAllowedTools: {
        'MockTool': Date.now() - 2000 // 2 seconds ago
      },
      context: {},
      history: [],
      mcpContextUris: [],
      projects: {}
    }

    const result = await hasPermissionsToUseTool(
      MockTool,
      { test: 'value' },
      mockContext,
      mockAssistantMessage
    )

    expect(result.result).toBe(true)
  })

  test('should reject once permissions after 5 seconds', async () => {
    // Mock config with expired once permission
    mockConfig = {
      allowedTools: [],
      sessionAllowedTools: [],
      onceAllowedTools: {
        'MockTool': Date.now() - 6000 // 6 seconds ago
      },
      context: {},
      history: [],
      mcpContextUris: [],
      projects: {}
    }

    const result = await hasPermissionsToUseTool(
      MockTool,
      { test: 'value' },
      mockContext,
      mockAssistantMessage
    )

    expect(result.result).toBe(false)
    if ('message' in result) {
      expect(result.message).toContain('requested permissions')
    }
  })

  test('should reject tool when no permissions granted', async () => {
    // Mock config with no permissions
    mockConfig = {
      allowedTools: [],
      sessionAllowedTools: [],
      onceAllowedTools: {},
      context: {},
      history: [],
      mcpContextUris: [],
      projects: {}
    }

    const result = await hasPermissionsToUseTool(
      MockTool,
      { test: 'value' },
      mockContext,
      mockAssistantMessage
    )

    expect(result.result).toBe(false)
    if ('message' in result) {
      expect(result.message).toContain('requested permissions')
    }
  })

  test('should handle file editing tools correctly', async () => {
    const result = await hasPermissionsToUseTool(
      { ...FileEditTool, needsPermissions: () => true } as Tool<any, any>,
      { filePath: '/test/file.txt', originalContent: 'old', newContent: 'new' },
      mockContext,
      mockAssistantMessage
    )

    expect(result.result).toBe(false)
    if ('message' in result) {
      expect(result.message).toContain('requested permissions')
    }
  })
})