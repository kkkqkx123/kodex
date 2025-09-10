import { Box, Text } from 'ink'
import * as React from 'react'
import { z } from 'zod'
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage'
import { TodoItem as TodoItemComponent } from '../../components/TodoItem'
import { Tool, ValidationResult } from '../../Tool'
import { setTodos, getTodos, TodoItem } from '../../utils/todoStorage'
import { emitReminderEvent } from '../../services/systemReminder'
import { startWatchingTodoFile } from '../../services/fileFreshness'
import { DESCRIPTION, PROMPT } from './prompt'
import { getTheme } from '../../utils/theme'

// Flexible schema that accepts LLM's natural format
const FlexibleTodoItemSchema = z.object({
  // Accept both 'content' and 'description' fields
  content: z.string().min(1).optional().describe('The task description or content'),
  description: z.string().min(1).optional().describe('The task description (alternative to content)'),
  status: z
    .enum(['pending', 'in_progress', 'completed'])
    .describe('Current status of the task'),
  priority: z
    .enum(['high', 'medium', 'low'])
    .describe('Priority level of the task'),
  id: z.string().min(1).describe('Unique identifier for the task'),
})

// Accept multiple input formats that LLM might generate
const inputSchema = z.object({
  todos: z.array(FlexibleTodoItemSchema).describe('The updated todo list')
})

function normalizeTodoItem(data: z.infer<typeof FlexibleTodoItemSchema>): TodoItem {
  // Normalize the data: use content if provided, otherwise use description
  const content = data.content || data.description;
  if (!content) {
    throw new Error('Todo item must have either content or description field');
  }

  return {
    content,
    status: data.status,
    priority: data.priority,
    id: data.id
  };
}

function validateTodos(todos: TodoItem[]): ValidationResult {
  // Check for duplicate IDs
  const ids = todos.map(todo => todo.id)
  const uniqueIds = new Set(ids)
  if (ids.length !== uniqueIds.size) {
    return {
      result: false,
      errorCode: 1,
      message: 'Duplicate todo IDs found',
      meta: {
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      },
    }
  }

  // Check for multiple in_progress tasks
  const inProgressTasks = todos.filter(todo => todo.status === 'in_progress')
  if (inProgressTasks.length > 1) {
    return {
      result: false,
      errorCode: 2,
      message: 'Only one task can be in_progress at a time',
      meta: { inProgressTaskIds: inProgressTasks.map(t => t.id) },
    }
  }

  // Validate each todo
  for (const todo of todos) {
    if (!todo.content?.trim()) {
      return {
        result: false,
        errorCode: 3,
        message: `Todo with ID "${todo.id}" has empty content`,
        meta: { todoId: todo.id },
      }
    }
    if (!['pending', 'in_progress', 'completed'].includes(todo.status)) {
      return {
        result: false,
        errorCode: 4,
        message: `Invalid status "${todo.status}" for todo "${todo.id}"`,
        meta: { todoId: todo.id, invalidStatus: todo.status },
      }
    }
    if (!['high', 'medium', 'low'].includes(todo.priority)) {
      return {
        result: false,
        errorCode: 5,
        message: `Invalid priority "${todo.priority}" for todo "${todo.id}"`,
        meta: { todoId: todo.id, invalidPriority: todo.priority },
      }
    }
  }

  return { result: true }
}

function generateTodoSummary(todos: TodoItem[]): string {
  const stats = {
    total: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    completed: todos.filter(t => t.status === 'completed').length,
  }

  // Enhanced summary with statistics
  let summary = `Updated ${stats.total} todo(s)`
  if (stats.total > 0) {
    summary += ` (${stats.pending} pending, ${stats.inProgress} in progress, ${stats.completed} completed)`
  }
  summary += '. Continue tracking your progress with the todo list.'

  return summary
}

export const TodoWriteTool = {
  name: 'TodoWrite',
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  inputSchema,
  userFacingName() {
    return 'Write Todos'
  },
  async isEnabled() {
    return true
  },
  isReadOnly() {
    return false
  },
  isConcurrencySafe() {
    return false // TodoWrite modifies state, not safe for concurrent execution
  },
  needsPermissions() {
    return false
  },
  renderResultForAssistant(result) {
    // Match official implementation - return static confirmation message
    return 'Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable'
  },
  renderToolUseMessage(input, { verbose }) {
    // Return empty string to match reference implementation and avoid double rendering
    // The tool result message will show the todo list
    return ''
  },
  renderToolUseRejectedMessage() {
    return <FallbackToolUseRejectedMessage />
  },
  renderToolResultMessage(output) {
    const isError = typeof output === 'string' && output.startsWith('Error')

    // If output contains todo data, render simple checkbox list
    if (typeof output === 'object' && output && 'newTodos' in output) {
      const { newTodos = [] } = output as any

      // sort: [completed, in_progress, pending]
      newTodos.sort((a, b) => {
        const order = ['completed', 'in_progress', 'pending']
        return (
          order.indexOf(a.status) - order.indexOf(b.status) ||
          a.content.localeCompare(b.content)
        )
      })

      // Render each todo item with proper styling
      return (
        <Box justifyContent="space-between" overflowX="hidden" width="100%">
          <Box flexDirection="row">
            <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
            <Box flexDirection="column">
              {newTodos.map((todo: TodoItem, index: number) => {
                const status_icon_map = {
                  completed: '🟢',
                  in_progress: '🟢',
                  pending: '🟡',
                }
                const checkbox = status_icon_map[todo.status]

                const status_color_map = {
                  completed: '#008000',
                  in_progress: '#008000',
                  pending: '#FFD700',
                }
                const text_color = status_color_map[todo.status]

                return (
                  <React.Fragment key={`todo-${todo.id || index}`}>
                    <Text
                      color={text_color}
                      bold={todo.status !== 'pending'}
                      strikethrough={todo.status === 'completed'}
                    >
                      {checkbox} {todo.content}
                    </Text>
                  </React.Fragment>
                )
              })}
            </Box>
          </Box>
        </Box>
      )
    }

    // Fallback to simple text rendering for errors or string output
    return (
      <Box justifyContent="space-between" overflowX="hidden" width="100%">
        <Box flexDirection="row">
          <Text color={isError ? getTheme().error : getTheme().success}>
            &nbsp;&nbsp;⎿ &nbsp;
            {typeof output === 'string' ? output : JSON.stringify(output)}
          </Text>
        </Box>
      </Box>
    )
  },
  async validateInput(input: z.infer<typeof inputSchema> | TodoItem[]) {
    // Handle both input formats:
    // 1. Object with todos array: { todos: [...] }
    // 2. Direct array: [...]
    let rawTodos: any[];
    if (Array.isArray(input)) {
      rawTodos = input;
    } else if (input && typeof input === 'object' && 'todos' in input) {
      rawTodos = input.todos;
    } else {
      // Handle case where input is the direct object structure
      rawTodos = [input];
    }
    
    // Normalize todo items
    const todoItems: TodoItem[] = rawTodos.map(item => normalizeTodoItem(item));
    
    const validation = validateTodos(todoItems)
    if (!validation.result) {
      return validation
    }
    return { result: true }
  },
  async *call(input: z.infer<typeof inputSchema> | TodoItem[], context) {
    try {
      // Handle both input formats:
      // 1. Object with todos array: { todos: [...] }
      // 2. Direct array: [...]
      let rawTodos: any[];
      if (Array.isArray(input)) {
        rawTodos = input;
      } else if (input && typeof input === 'object' && 'todos' in input) {
        rawTodos = input.todos;
      } else {
        // Handle case where input is the direct object structure
        rawTodos = [input];
      }
      
      // Normalize todo items
      const todoItems: TodoItem[] = rawTodos.map(item => normalizeTodoItem(item));
      
      // Get agent ID from context
      const agentId = context?.agentId

      // Start watching todo file for this agent if not already watching
      if (agentId) {
        startWatchingTodoFile(agentId)
      }

      // Store previous todos for comparison (agent-scoped)
      const previousTodos = getTodos(agentId)

      // Note: Validation already done in validateInput, no need for duplicate validation
      // This eliminates the double validation issue

      // Update the todos in storage (agent-scoped)
      setTodos(todoItems, agentId)

      // Emit todo change event for system reminders (optimized - only if todos actually changed)
      const hasChanged =
        JSON.stringify(previousTodos) !== JSON.stringify(todoItems)
      if (hasChanged) {
        emitReminderEvent('todo:changed', {
          previousTodos,
          newTodos: todoItems,
          timestamp: Date.now(),
          agentId: agentId || 'default',
          changeType:
            todoItems.length > previousTodos.length
              ? 'added'
              : todoItems.length < previousTodos.length
                ? 'removed'
                : 'modified',
        })
      }

      // Generate enhanced summary
      const summary = generateTodoSummary(todoItems)

      // Enhanced result data for rendering
      const resultData = {
        oldTodos: previousTodos,
        newTodos: todoItems,
        summary,
      }

      yield {
        type: 'result',
        data: summary, // Return string instead of object to match interface
        resultForAssistant: summary,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      const errorResult = `Error updating todos: ${errorMessage}`

      // Emit error event for system monitoring
      emitReminderEvent('todo:error', {
        error: errorMessage,
        timestamp: Date.now(),
        agentId: context?.agentId || 'default',
        context: 'TodoWriteTool.call',
      })

      yield {
        type: 'result',
        data: errorResult,
        resultForAssistant: errorResult,
      }
    }
  },
} satisfies Tool<typeof inputSchema, string>
