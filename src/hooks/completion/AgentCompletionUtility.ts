import { useCallback, useState, useEffect } from 'react'
import { getActiveAgents } from '../../utils/agentLoader'
import { getModelManager } from '../../utils/model'
import { matchCommands } from '../../utils/fuzzyMatcher'
import type { UnifiedSuggestion } from './types'

export class AgentCompletionUtility {
  private agentSuggestions: UnifiedSuggestion[] = []
  private modelSuggestions: UnifiedSuggestion[] = []

  constructor() {
    this.loadSuggestions()
  }

  private loadSuggestions = useCallback(async () => {
    // Load model suggestions
    try {
      const modelManager = getModelManager()
      const allModels = modelManager.getAllAvailableModelNames()
      
      const suggestions = allModels.map(modelId => {
        return {
          value: `%ask-${modelId}`,
          displayValue: `🦜 %ask-${modelId} :: Consult ${modelId} for expert opinion and specialized analysis`,
          type: 'ask' as const,
          score: 90, // Higher than agents - put ask-models on top
          metadata: { modelId },
        }
      })
      
      this.modelSuggestions = suggestions
    } catch (error) {
      console.warn('[AgentCompletionUtility] Failed to load models:', error)
      this.modelSuggestions = []
    }

    // Load agent suggestions
    try {
      const agents = await getActiveAgents()
      const suggestions = agents.map(config => {
        // Smart description algorithm with adaptive length control
        let shortDesc = config.whenToUse
        
        // Remove common redundant prefixes
        const prefixPatterns = [
          /^Use this agent when you need (assistance with: )?/i,
          /^Use PROACTIVELY (when|to) /i,
          /^Specialized in /i,
          /^Implementation specialist for /i,
          /^Design validation specialist\.? Use PROACTIVELY to /i,
          /^Task validation specialist\.? Use PROACTIVELY to /i,
          /^Requirements validation specialist\.? Use PROACTIVELY to /i
        ]
        
        for (const pattern of prefixPatterns) {
          shortDesc = shortDesc.replace(pattern, '')
        }
        
        // Smart sentence breaking
        const findSmartBreak = (text: string, maxLength: number) => {
          if (text.length <= maxLength) return text
          
          // First priority: Chinese/English periods and exclamation marks
          const sentenceEndings = /[.!。!]/
          const firstSentenceMatch = text.search(sentenceEndings)
          if (firstSentenceMatch !== -1) {
            const firstSentence = text.slice(0, firstSentenceMatch).trim()
            if (firstSentence.length >= 5) {
              return firstSentence
            }
          }
          
          // If first sentence is too long, find comma breaks
          if (text.length > maxLength) {
            const commaEndings = /[,，]/
            const commas = []
            let match
            const regex = new RegExp(commaEndings, 'g')
            while ((match = regex.exec(text)) !== null) {
              commas.push(match.index)
            }
            
            // Find last comma within maxLength
            for (let i = commas.length - 1; i >= 0; i--) {
              const commaPos = commas[i]
              if (commaPos < maxLength) {
                const clause = text.slice(0, commaPos).trim()
                if (clause.length >= 5) {
                  return clause
                }
              }
            }
          }
          
          // Last option: truncate with ellipsis
          return text.slice(0, maxLength) + '...'
        }
        
        shortDesc = findSmartBreak(shortDesc.trim(), 80)
        
        // If processed result is empty or too short, use original description
        if (!shortDesc || shortDesc.length < 5) {
          shortDesc = findSmartBreak(config.whenToUse, 80)
        }
        
        return {
          value: `%run-agent-${config.agentType}`,
          displayValue: `👤 %run-agent-${config.agentType} :: ${shortDesc}`,
          type: 'agent' as const,
          score: 85, // Lower than ask-models
          metadata: config,
        }
      })
      
      this.agentSuggestions = suggestions
    } catch (error) {
      console.warn('[AgentCompletionUtility] Failed to load agents:', error)
      this.agentSuggestions = []
    }
  }, [])

  // Generate agent and model suggestions using fuzzy matching
  generateMentionSuggestions = useCallback((prefix: string): UnifiedSuggestion[] => {
    const allSuggestions = [...this.agentSuggestions, ...this.modelSuggestions]
    
    if (!prefix) {
      // Show all suggestions when prefix is empty
      return allSuggestions.sort((a, b) => {
        // Ask models first, then agents
        if (a.type === 'ask' && b.type === 'agent') return -1
        if (a.type === 'agent' && b.type === 'ask') return 1
        return b.score - a.score
      })
    }
    
    // Use fuzzy matching for intelligent completion
    const candidates = allSuggestions.map(s => s.value)
    const matches = matchCommands(candidates, prefix)
    
    // Create result mapping with fuzzy scores
    const fuzzyResults = matches
      .map(match => {
        const suggestion = allSuggestions.find(s => s.value === match.command)!
        return {
          ...suggestion,
          score: match.score
        }
      })
      .sort((a, b) => {
        // Ask models first (for equal scores), then agents
        if (a.type === 'ask' && b.type === 'agent') return -1
        if (a.type === 'agent' && b.type === 'ask') return 1
        return b.score - a.score
      })
    
    return fuzzyResults
  }, [this.agentSuggestions, this.modelSuggestions])

  // Generate smart mention suggestions without data pollution
  generateSmartMentionSuggestions = useCallback((
    prefix: string, 
    sourceContext: 'file' | 'agent' = 'file',
    calculateMatchScore: (suggestion: UnifiedSuggestion, prefix: string) => number
  ): UnifiedSuggestion[] => {
    if (!prefix || prefix.length < 2) return []
    
    const allSuggestions = [...this.agentSuggestions, ...this.modelSuggestions]
    
    return allSuggestions
      .map(suggestion => {
        const matchScore = calculateMatchScore(suggestion, prefix)
        if (matchScore === 0) return null
        
        return {
          ...suggestion,
          score: matchScore,
          isSmartMatch: true,
          originalContext: sourceContext,
          displayValue: `🎯 ${suggestion.displayValue}`
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [this.agentSuggestions, this.modelSuggestions])

  // Get current suggestions status
  getSuggestionsStatus = useCallback(() => ({
    agents: this.agentSuggestions,
    models: this.modelSuggestions,
    isLoading: this.agentSuggestions.length === 0 && this.modelSuggestions.length === 0
  }), [this.agentSuggestions, this.modelSuggestions])
}