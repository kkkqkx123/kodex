import { Message } from '../query'
import { Tool } from '../Tool'
import { getSystemPrompt } from '../constants/prompts'
import { getContext } from '../context'
import { formatSystemPromptWithContext } from '../services/claude'
import { userMessageToMessageParam, assistantMessageToMessageParam } from '../services/claude'
import { normalizeMessagesForAPI } from './messages'
import { zodToJsonSchema } from 'zod-to-json-schema'

export interface ContextStatistics {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  percentUsed: number
  contextLimit: number
}

export interface ContextUsage {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
}

export type ContextStatus = 'safe' | 'warning' | 'critical'

/**
 * Calculate context statistics from messages and system context
 * Combines actual API usage data with fallback estimation methods
* This function estimates the total tokens that will be sent in the API request
 */
export async function calculateContextStatistics(
  messages: Message[],
  tools: Tool[] = [],
  contextLimit: number
): Promise<ContextStatistics> {
  // Calculate actual usage from API responses when available
  const usage = calculateActualUsage(messages)
  
  // If we have actual usage data, use it
  if (usage.totalTokens > 0) {
    return {
      totalTokens: usage.totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cachedTokens: usage.cacheCreationTokens + usage.cacheReadTokens,
      percentUsed: Math.round((usage.totalTokens / contextLimit) * 100),
      contextLimit
    }
  }
  
  // Fallback to estimation when no actual usage data is available
  const estimatedTokens = await estimateTokenUsageWithFullContext(messages, tools)
  
  return {
    totalTokens: estimatedTokens,
    inputTokens: Math.round(estimatedTokens * 0.7), // Estimate 70% for input
    outputTokens: Math.round(estimatedTokens * 0.3), // Estimate 30% for output
    cachedTokens: 0,
    percentUsed: Math.round((estimatedTokens / contextLimit) * 100),
    contextLimit
  }
}

/**
 * Calculate actual token usage from API responses
 */
function calculateActualUsage(messages: Message[]): ContextUsage {
  let totalTokens = 0
  let inputTokens = 0
  let outputTokens = 0
  let cacheCreationTokens = 0
  let cacheReadTokens = 0
  
  // Iterate through all messages to accumulate usage data
  for (const message of messages) {
    if (message?.type === 'assistant' && 'usage' in message.message) {
      const { usage } = message.message
      inputTokens += usage.input_tokens ?? 0
      outputTokens += usage.output_tokens ?? 0
      cacheCreationTokens += usage.cache_creation_input_tokens ?? 0
      cacheReadTokens += usage.cache_read_input_tokens ?? 0
    }
  }
  
  totalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens
  
  return {
    totalTokens,
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens
  }
}

/**
 * Estimate token usage based on message content when actual usage is not available
 * Uses a simple heuristic: ~4 bytes per token
 */
function estimateTokenUsage(messages: Message[]): number {
  // Convert messages to JSON string and estimate based on byte length
  const messagesJson = JSON.stringify(messages)
  const byteLength = new TextEncoder().encode(messagesJson).length
  
  // Rough estimation: 4 bytes per token
  const BYTES_PER_TOKEN = 4
  return Math.round(byteLength / BYTES_PER_TOKEN)
}

/**
 * Estimate token usage including system prompt, tools, and full context
* This provides a more accurate estimation of the actual API request size
 */
async function estimateTokenUsageWithFullContext(messages: Message[], tools: Tool[]): Promise<number> {
  // Get system prompt and context
  const [systemPrompt, context] = await Promise.all([
    getSystemPrompt(),
    getContext()
  ])
  
  // Format system prompt with context (same as in query.ts)
  const { systemPrompt: fullSystemPrompt } = formatSystemPromptWithContext(systemPrompt, context)
  
  // Estimate system prompt tokens
  const systemPromptText = fullSystemPrompt.join('\n')
  const systemPromptTokens = Math.round(new TextEncoder().encode(systemPromptText).length / 4)
  
  // Estimate tool schemas tokens
  let toolSchemasTokens = 0
  if (tools.length > 0) {
    const toolSchemas = await Promise.all(
      tools.map(async tool => ({
        name: tool.name,
        description: typeof tool.description === 'function'
          ? await tool.description()
          : tool.description,
        input_schema: zodToJsonSchema(tool.inputSchema),
      }))
    )
    const toolSchemasText = JSON.stringify(toolSchemas)
    toolSchemasTokens = Math.round(new TextEncoder().encode(toolSchemasText).length / 4)
  }
  
  // Estimate messages tokens (with cache breakpoints like in claude.ts)
  const apiMessages = normalizeMessagesForAPI(messages)
  const formattedMessages = apiMessages.map((msg, index) => {
    // Add cache breakpoints for recent messages (same logic as in claude.ts)
    return msg.type === 'user'
      ? userMessageToMessageParam(msg, index > apiMessages.length - 3)
      : assistantMessageToMessageParam(msg, index > apiMessages.length - 3)
  })
  const messagesText = JSON.stringify(formattedMessages)
  const messagesTokens = Math.round(new TextEncoder().encode(messagesText).length / 4)
  
  // Add some buffer for API overhead and other metadata
  const bufferTokens = 100
  
  return systemPromptTokens + toolSchemasTokens + messagesTokens + bufferTokens
}

/**
 * Get context status based on usage percentage
 */
export function getContextStatus(currentTokens: number, contextLimit: number): ContextStatus {
  const percentage = (currentTokens / contextLimit) * 100
  
  if (percentage >= 90) {
    return 'critical'
  } else if (percentage >= 75) {
    return 'warning'
  } else {
    return 'safe'
  }
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(currentTokens: number, contextLimit: number): number {
  return Math.round((currentTokens / contextLimit) * 100)
}