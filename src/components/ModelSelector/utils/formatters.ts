import { ModelInfo } from '../ModelSelector.types'

export function getModelDetails(model: ModelInfo): string {
  const details = []

  if (model.max_tokens) {
    details.push(`${formatNumber(model.max_tokens)} tokens`)
  }

  if (model.supports_vision) {
    details.push('vision')
  }

  if (model.supports_function_calling) {
    details.push('tools')
  }

  return details.length > 0 ? ` (${details.join(', ')})` : ''
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`
  }
  return num.toString()
}

export function getProviderLabel(provider: string, modelCount: number): string {
  // This would import the providers object from constants/models
  // For now, we'll return a generic label
  return `${provider} (${modelCount} models)`
}

export function sortModelsByPriority(models: ModelInfo[]) {
  const priorityKeywords = [
    'claude',
    'kimi',
    'deepseek',
    'minimax',
    'o3',
    'gpt',
    'qwen',
  ]

  return models.sort((a, b) => {
    // Add safety checks for undefined model names
    const aModelLower = a.model?.toLowerCase() || ''
    const bModelLower = b.model?.toLowerCase() || ''

    // Check if models contain priority keywords
    const aHasPriority = priorityKeywords.some(keyword =>
      aModelLower.includes(keyword),
    )
    const bHasPriority = priorityKeywords.some(keyword =>
      bModelLower.includes(keyword),
    )

    // If one has priority and the other doesn't, prioritize the one with keywords
    if (aHasPriority && !bHasPriority) return -1
    if (!aHasPriority && bHasPriority) return 1

    // If both have priority or neither has priority, sort alphabetically
    return a.model.localeCompare(b.model)
  })
}