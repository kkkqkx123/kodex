import { expect, test, describe, beforeEach } from 'bun:test'
import React from 'react'
import { render } from 'ink-testing-library'
import { AgentProgressIndicator } from '../../src/components/AgentProgressIndicator'
import { getActiveTasks } from '../../src/tools/TaskTool/TaskTool'

describe('AgentProgressIndicator', () => {
  beforeEach(() => {
    // Clear active tasks before each test
    const activeTasks = getActiveTasks()
    activeTasks.clear()
  })

  test('should render null when no active tasks', async () => {
    const { lastFrame } = render(<AgentProgressIndicator />)
    
    // Wait for the component to update (polling interval is 1000ms)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Since there are no active tasks, the component should render null
    expect(lastFrame()).toBe('')
  })

  test('should render active tasks with correct information', async () => {
    // Add a mock active task directly to the TaskTool's activeTasks map
    const activeTasks = getActiveTasks()
    activeTasks.set('task-1', {
      description: 'Test Task',
      agentType: 'general-purpose',
      progress: 50,
      message: 'Processing...',
      startTime: Date.now()
    })

    const { lastFrame } = render(<AgentProgressIndicator />)
    
    // Wait for the component to update (polling interval is 1000ms)
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    const output = lastFrame()
    expect(output).toContain('Active Tasks:')
    expect(output).toContain('[general-purpose] Test Task')
    expect(output).toContain('50%')
    expect(output).toContain('Processing...')
  })

  test('should render multiple active tasks', async () => {
    // Add multiple mock active tasks
    const activeTasks = getActiveTasks()
    activeTasks.set('task-1', {
      description: 'First Task',
      agentType: 'general-purpose',
      progress: 30,
      message: 'Initializing...',
      startTime: Date.now()
    })

    activeTasks.set('task-2', {
      description: 'Second Task',
      agentType: 'code',
      progress: 75,
      message: 'Almost done...',
      startTime: Date.now()
    })

    const { lastFrame } = render(<AgentProgressIndicator />)
    
    // Wait for the component to update (polling interval is 1000ms)
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    const output = lastFrame()
    expect(output).toContain('Active Tasks:')
    expect(output).toContain('[general-purpose] First Task')
    expect(output).toContain('30%')
    expect(output).toContain('Initializing...')
    expect(output).toContain('[code] Second Task')
    expect(output).toContain('75%')
    expect(output).toContain('Almost done...')
  })

  test('should handle tasks without messages', async () => {
    // Add a mock active task without a message
    const activeTasks = getActiveTasks()
    activeTasks.set('task-1', {
      description: 'Task Without Message',
      agentType: 'test',
      progress: 25,
      startTime: Date.now()
    })

    const { lastFrame } = render(<AgentProgressIndicator />)
    
    // Wait for the component to update (polling interval is 1000ms)
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    const output = lastFrame()
    expect(output).toContain('[test] Task Without Message')
    expect(output).toContain('25%')
  })
})