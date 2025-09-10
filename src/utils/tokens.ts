import { Message } from '../query'
import { SYNTHETIC_ASSISTANT_MESSAGES } from './messages'
import { calculateContextStatistics } from './contextStatistics'
import type { Tool } from '../Tool'
import { getCurrentModelContextLimit } from './model'

// Simple synchronous token counting for UI purposes (fallback method)
export function countTokens(messages: Message[]): number {
  // Convert messages to JSON string and estimate based on byte length
  const messagesJson = JSON.stringify(messages)
  const byteLength = new TextEncoder().encode(messagesJson).length
  
  // Rough estimation: 4 bytes per token
  const BYTES_PER_TOKEN = 4
  return Math.round(byteLength / BYTES_PER_TOKEN)
}

// Async token counting that includes full context (system prompt, tools, etc.)
export async function countTokensWithContext(messages: Message[], tools: Tool[] = []): Promise<number> {
  // Use the new context statistics module for more robust token counting
  const contextLimit = getCurrentModelContextLimit()
  const stats = await calculateContextStatistics(messages, tools, contextLimit)
  return stats.totalTokens
}

export function countCachedTokens(messages: Message[]): number {
  // Use the simple estimation for cached token counting
  const stats = countTokens(messages)
  return Math.round(stats * 0.1) // Rough estimate of 10% cached tokens
}
