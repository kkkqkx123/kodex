import { getModelInputTokenCostUSD, getModelOutputTokenCostUSD } from '../services/claude'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  costUSD: number
  durationMs: number
  model: string
  timestamp: number
}

export interface TokenStatistics {
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalCostUSD: number
  totalDurationMs: number
  totalRequests: number
  modelBreakdown: Record<string, {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheCreationTokens: number
    costUSD: number
    durationMs: number
    requests: number
  }>
  sessionStartTime: number
}

class TokenAccumulator {
  private static instance: TokenAccumulator
  private statistics: TokenStatistics
  private usageHistory: TokenUsage[]

  private constructor() {
    this.statistics = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheCreationTokens: 0,
      totalCostUSD: 0,
      totalDurationMs: 0,
      totalRequests: 0,
      modelBreakdown: {},
      sessionStartTime: Date.now(),
    }
    this.usageHistory = []
  }

  public static getInstance(): TokenAccumulator {
    if (!TokenAccumulator.instance) {
      TokenAccumulator.instance = new TokenAccumulator()
    }
    return TokenAccumulator.instance
  }

  public addTokenUsage(usage: Omit<TokenUsage, 'timestamp'>): void {
    const timestampedUsage: TokenUsage = {
      ...usage,
      timestamp: Date.now(),
    }

    this.usageHistory.push(timestampedUsage)

    // Update total statistics
    this.statistics.totalInputTokens += usage.inputTokens
    this.statistics.totalOutputTokens += usage.outputTokens
    this.statistics.totalCacheReadTokens += usage.cacheReadInputTokens
    this.statistics.totalCacheCreationTokens += usage.cacheCreationInputTokens
    this.statistics.totalCostUSD += usage.costUSD
    this.statistics.totalDurationMs += usage.durationMs
    this.statistics.totalRequests += 1

    // Update model breakdown
    if (!this.statistics.modelBreakdown[usage.model]) {
      this.statistics.modelBreakdown[usage.model] = {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        costUSD: 0,
        durationMs: 0,
        requests: 0,
      }
    }

    const modelStats = this.statistics.modelBreakdown[usage.model]
    modelStats.inputTokens += usage.inputTokens
    modelStats.outputTokens += usage.outputTokens
    modelStats.cacheReadTokens += usage.cacheReadInputTokens
    modelStats.cacheCreationTokens += usage.cacheCreationInputTokens
    modelStats.costUSD += usage.costUSD
    modelStats.durationMs += usage.durationMs
    modelStats.requests += 1
  }

  public getStatistics(): TokenStatistics {
    return { ...this.statistics }
  }

  public getUsageHistory(): TokenUsage[] {
    return [...this.usageHistory]
  }

  public getAverageCostPerRequest(): number {
    return this.statistics.totalRequests > 0 
      ? this.statistics.totalCostUSD / this.statistics.totalRequests 
      : 0
  }

  public getAverageTokensPerRequest(): { input: number; output: number } {
    if (this.statistics.totalRequests === 0) {
      return { input: 0, output: 0 }
    }
    return {
      input: this.statistics.totalInputTokens / this.statistics.totalRequests,
      output: this.statistics.totalOutputTokens / this.statistics.totalRequests,
    }
  }

  public getAverageDurationPerRequest(): number {
    return this.statistics.totalRequests > 0 
      ? this.statistics.totalDurationMs / this.statistics.totalRequests 
      : 0
  }

  public getMostExpensiveModel(): { model: string; cost: number } | null {
    const modelEntries = Object.entries(this.statistics.modelBreakdown)
    if (modelEntries.length === 0) return null
    
    return modelEntries.reduce((max, [model, stats]) => 
      stats.costUSD > max.cost ? { model, cost: stats.costUSD } : max
    , { model: '', cost: 0 })
  }

  public getMostUsedModel(): { model: string; requests: number } | null {
    const modelEntries = Object.entries(this.statistics.modelBreakdown)
    if (modelEntries.length === 0) return null
    
    return modelEntries.reduce((max, [model, stats]) => 
      stats.requests > max.requests ? { model, requests: stats.requests } : max
    , { model: '', requests: 0 })
  }

  public reset(): void {
    this.statistics = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheCreationTokens: 0,
      totalCostUSD: 0,
      totalDurationMs: 0,
      totalRequests: 0,
      modelBreakdown: {},
      sessionStartTime: Date.now(),
    }
    this.usageHistory = []
  }

  public getSessionDuration(): number {
    return Date.now() - this.statistics.sessionStartTime
  }

  public formatStatistics(): string {
    const stats = this.statistics
    const avgCost = this.getAverageCostPerRequest()
    const avgTokens = this.getAverageTokensPerRequest()
    const avgDuration = this.getAverageDurationPerRequest()
    const mostExpensive = this.getMostExpensiveModel()
    const mostUsed = this.getMostUsedModel()
    const sessionDuration = this.getSessionDuration()

    let output = []
    
    output.push('=== Token Usage Statistics ===')
    output.push(`Session Duration: ${this.formatDuration(sessionDuration)}`)
    output.push('')
    
    output.push('📊 Overall Statistics:')
    output.push(`  Total Requests: ${stats.totalRequests}`)
    output.push(`  Total Input Tokens: ${stats.totalInputTokens.toLocaleString()}`)
    output.push(`  Total Output Tokens: ${stats.totalOutputTokens.toLocaleString()}`)
    output.push(`  Total Cache Read Tokens: ${stats.totalCacheReadTokens.toLocaleString()}`)
    output.push(`  Total Cache Creation Tokens: ${stats.totalCacheCreationTokens.toLocaleString()}`)
    output.push(`  Total Cost: $${stats.totalCostUSD.toFixed(4)}`)
    output.push(`  Total API Duration: ${this.formatDuration(stats.totalDurationMs)}`)
    output.push('')
    
    output.push('📈 Averages:')
    output.push(`  Cost per Request: $${avgCost.toFixed(4)}`)
    output.push(`  Input Tokens per Request: ${Math.round(avgTokens.input)}`)
    output.push(`  Output Tokens per Request: ${Math.round(avgTokens.output)}`)
    output.push(`  Duration per Request: ${this.formatDuration(avgDuration)}`)
    output.push('')
    
    if (mostExpensive) {
      output.push('💰 Most Expensive Model:')
      output.push(`  Model: ${mostExpensive.model}`)
      output.push(`  Cost: $${mostExpensive.cost.toFixed(4)}`)
      output.push('')
    }
    
    if (mostUsed) {
      output.push('🔥 Most Used Model:')
      output.push(`  Model: ${mostUsed.model}`)
      output.push(`  Requests: ${mostUsed.requests}`)
      output.push('')
    }
    
    if (Object.keys(stats.modelBreakdown).length > 0) {
      output.push('📋 Model Breakdown:')
      Object.entries(stats.modelBreakdown).forEach(([model, modelStats]) => {
        const percentage = ((modelStats.costUSD / stats.totalCostUSD) * 100).toFixed(1)
        output.push(`  ${model}:`)
        output.push(`    Requests: ${modelStats.requests}`)
        output.push(`    Input Tokens: ${modelStats.inputTokens.toLocaleString()}`)
        output.push(`    Output Tokens: ${modelStats.outputTokens.toLocaleString()}`)
        output.push(`    Cache Tokens: ${modelStats.cacheReadTokens.toLocaleString()} read, ${modelStats.cacheCreationTokens.toLocaleString()} creation`)
        output.push(`    Cost: $${modelStats.costUSD.toFixed(4)} (${percentage}%)`)
        output.push(`    Duration: ${this.formatDuration(modelStats.durationMs)}`)
      })
    }

    return output.join('\n')
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`
    return `${(ms / 3600000).toFixed(1)}h`
  }
}

export const tokenAccumulator = TokenAccumulator.getInstance()
export default tokenAccumulator