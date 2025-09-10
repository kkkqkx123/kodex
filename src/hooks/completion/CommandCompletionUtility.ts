import { useCallback, useState, useEffect } from 'react'
import { readdirSync, statSync } from 'fs'
import { getCommonSystemCommands, getCommandPriority, getEssentialCommands, getMinimalFallbackCommands } from '../../utils/commonUnixCommands'
import { matchCommands } from '../../utils/fuzzyMatcher'
import { getGlobalConfig } from '../../utils/config'
import type { Command } from '../../commands'
import type { UnifiedSuggestion } from './types'
import { getSubcommands } from '../../utils/subcommandRegistry'

export class CommandCompletionUtility {
  private systemCommands: string[] = []
  private isLoadingCommands: boolean = false

  constructor() {
    this.loadSystemCommands()
  }

  // Load system commands from PATH
  private async loadSystemCommands() {
    if (this.systemCommands.length > 0 || this.isLoadingCommands) return
    
    this.isLoadingCommands = true
    try {
      const pathDirs = (process.env.PATH || '').split(':').filter(Boolean)
      const commandSet = new Set<string>()
      
      // Get essential commands from utils
      const essentialCommands = getEssentialCommands()
      
      // Add essential commands first
      essentialCommands.forEach(cmd => commandSet.add(cmd))
      
      // Scan PATH directories for executables
      for (const dir of pathDirs) {
        try {
          const entries = readdirSync(dir)
          for (const entry of entries) {
            try {
              const fullPath = `${dir}/${entry}`
              const stats = statSync(fullPath)
              // Check if it's executable (rough check)
              if (stats.isFile() && (stats.mode & 0o111) !== 0) {
                commandSet.add(entry)
              }
            } catch {
              // Skip files we can't stat
            }
          }
        } catch {
          // Skip directories we can't read
        }
      }
      
      this.systemCommands = Array.from(commandSet).sort()
    } catch (error) {
      console.warn('Failed to load system commands, using fallback:', error)
      // Use minimal fallback commands from utils if system scan fails
      this.systemCommands = getMinimalFallbackCommands()
    } finally {
      this.isLoadingCommands = false
    }
  }

  // Dynamic command classification based on intrinsic features
  private classifyCommand(cmd: string): 'core' | 'common' | 'dev' | 'system' {
    const lowerCmd = cmd.toLowerCase()
    let score = 0
    
    // === FEATURE 1: Name Length & Complexity ===
    if (cmd.length <= 4) score += 40
    else if (cmd.length <= 6) score += 20
    else if (cmd.length <= 8) score += 10
    else if (cmd.length > 15) score -= 30
    
    // === FEATURE 2: Character Patterns ===
    if (/^[a-z]+$/.test(lowerCmd)) score += 30
    
    // Mixed case, numbers, dots suggest specialized tools
    if (/[A-Z]/.test(cmd)) score -= 15
    if (/\d/.test(cmd)) score -= 20
    if (cmd.includes('.')) score -= 25
    if (cmd.includes('-')) score -= 10
    if (cmd.includes('_')) score -= 15
    
    // === FEATURE 3: Linguistic Patterns ===
    const commonWords = ['list', 'copy', 'move', 'find', 'print', 'show', 'edit', 'view']
    if (commonWords.some(word => lowerCmd.includes(word.slice(0, 3)))) score += 25
    
    const devPrefixes = ['git', 'npm', 'node', 'py', 'docker', 'kubectl']
    if (devPrefixes.some(prefix => lowerCmd.startsWith(prefix))) score += 15
    
    const systemIndicators = ['daemon', 'helper', 'responder', 'service', 'd$', 'ctl$']
    if (systemIndicators.some(indicator =>
      indicator.endsWith('$') ? lowerCmd.endsWith(indicator.slice(0, -1)) : lowerCmd.includes(indicator)
    )) score -= 40
    
    // === FEATURE 4: File Extension Indicators ===
    if (/\.(pl|py|sh|rb|js)$/.test(lowerCmd)) score -= 35
    
    // === FEATURE 5: Path Location Heuristics ===
    const buildToolPatterns = ['bindep', 'render', 'mako', 'webpack', 'babel', 'eslint']
    if (buildToolPatterns.some(pattern => lowerCmd.includes(pattern))) score -= 25
    
    // === FEATURE 6: Vowel/Consonant Patterns ===
    const vowelRatio = (lowerCmd.match(/[aeiou]/g) || []).length / lowerCmd.length
    if (vowelRatio < 0.2) score += 15
    if (vowelRatio > 0.5) score -= 10
    
    // === CLASSIFICATION BASED ON SCORE ===
    if (score >= 50) return 'core'
    if (score >= 20) return 'common'
    if (score >= -10) return 'dev'
    return 'system'
  }

  // Generate subcommand suggestions
  generateSubcommandSuggestions(prefix: string, parentCommand: string): UnifiedSuggestion[] {
    const subcommands = getSubcommands(parentCommand)
    
    if (!prefix) {
      // Show all subcommands when prefix is empty
      return subcommands.map(sub => ({
        value: sub.name,
        displayValue: `${sub.name} :: ${sub.description}`,
        type: 'command' as const,
        score: 100,
        metadata: { isSubcommand: true, parentCommand }
      }))
    }
    
    return subcommands
      .filter(sub => {
        const names = [sub.name, ...(sub.aliases || [])]
        return names.some(name => name.toLowerCase().startsWith(prefix.toLowerCase()))
      })
      .map(sub => ({
        value: sub.name,
        displayValue: `${sub.name} :: ${sub.description}`,
        type: 'command' as const,
        score: 100 - prefix.length + (sub.name.startsWith(prefix) ? 10 : 0),
        metadata: { isSubcommand: true, parentCommand }
      }))
  }

  // Generate command suggestions (slash commands)
  generateCommandSuggestions(prefix: string, commands: Command[]): UnifiedSuggestion[] {
    const filteredCommands = commands.filter(cmd => !cmd.isHidden)
    
    if (!prefix) {
      // Show all commands when prefix is empty
      const config = getGlobalConfig()
      const limit = config.completionItemsLimit || 15
      return filteredCommands
        .slice(0, limit)
        .map(cmd => ({
          value: cmd.userFacingName(),
          displayValue: `/${cmd.userFacingName()} :: ${cmd.description}`,
          type: 'command' as const,
          score: 100,
        }))
    }
    
    return filteredCommands
      .filter(cmd => {
        const names = [cmd.userFacingName(), ...(cmd.aliases || [])]
        return names.some(name => name.toLowerCase().startsWith(prefix.toLowerCase()))
      })
      .map(cmd => ({
        value: cmd.userFacingName(),
        displayValue: `/${cmd.userFacingName()} :: ${cmd.description}`,
        type: 'command' as const,
        score: 100 - prefix.length + (cmd.userFacingName().startsWith(prefix) ? 10 : 0),
      }))
  }

  // Generate Unix command suggestions using fuzzy matcher
  generateUnixCommandSuggestions(prefix: string): UnifiedSuggestion[] {
    if (!prefix) return []
    
    // Loading state
    if (this.isLoadingCommands) {
      return [{
        value: 'loading...',
        displayValue: `⏳ Loading system commands...`,
        type: 'file' as const,
        score: 0,
        metadata: { isLoading: true }
      }]
    }
    
    // Only use commands that exist on the system
    const commonCommands = getCommonSystemCommands(this.systemCommands)
    
    // Deduplicate commands
    const uniqueCommands = Array.from(new Set(commonCommands))
    
    // Use fuzzy matcher
    const matches = matchCommands(uniqueCommands, prefix)
    
    // Boost common commands
    const boostedMatches = matches.map(match => {
      const priority = getCommandPriority(match.command)
      return {
        ...match,
        score: match.score + priority * 0.5
      }
    }).sort((a, b) => b.score - a.score)
    // Get the configured limit
    const config = getGlobalConfig()
    const limit = config.completionItemsLimit || 20
    
    // Limit results intelligently
    let results = boostedMatches.slice(0, limit)
    
    // If we have very high scores (900+), show fewer
    const perfectMatches = boostedMatches.filter(m => m.score >= 900)
    if (perfectMatches.length > 0 && perfectMatches.length <= 3) {
      results = perfectMatches
    }
    // If we have good scores (100+), prefer them
    else if (boostedMatches.length > 8) {
      const goodMatches = boostedMatches.filter(m => m.score >= 100)
      if (goodMatches.length <= 5) {
        results = goodMatches
      }
    }
    
    return results.map(item => ({
      value: item.command,
      displayValue: `$ ${item.command}`,
      type: 'command' as const,
      score: item.score,
      metadata: { isUnixCommand: true }
    }))
  }

  // Find common prefix among suggestions
  findCommonPrefix(suggestions: UnifiedSuggestion[]): string {
    if (suggestions.length === 0) return ''
    if (suggestions.length === 1) return suggestions[0].value
    
    let prefix = suggestions[0].value
    
    for (let i = 1; i < suggestions.length; i++) {
      const str = suggestions[i].value
      let j = 0
      while (j < prefix.length && j < str.length && prefix[j] === str[j]) {
        j++
      }
      prefix = prefix.slice(0, j)
      
      if (prefix.length === 0) return ''
    }
    
    return prefix
  }

  // Get system commands status
  getSystemCommandsStatus() {
    return {
      commands: this.systemCommands,
      isLoading: this.isLoadingCommands
    }
  }
}