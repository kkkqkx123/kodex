import type { Command } from '../../commands'

// Unified suggestion type for all completion types
export interface UnifiedSuggestion {
  value: string
  displayValue: string
  type: 'command' | 'agent' | 'file' | 'ask'
  icon?: string
  score: number
  metadata?: any
  // Clean type system for smart matching
  isSmartMatch?: boolean  // Instead of magic string checking
  originalContext?: 'mention' | 'file' | 'command' | 'agent'  // Track source context
}

export interface CompletionContext {
  type: 'command' | 'agent' | 'percent-agent' | 'file' | 'subcommand' | 'at-file' | null
  prefix: string
  startPos: number
  endPos: number
  // For subcommand context, track the parent command
  parentCommand?: string
  // For subcommand context, indicate if using slash format
  isSlashFormat?: boolean
}

export interface CompletionState {
  suggestions: UnifiedSuggestion[]
  selectedIndex: number
  isActive: boolean
  context: CompletionContext | null
  preview: {
    isActive: boolean
    originalInput: string
    wordRange: [number, number]
  } | null
  emptyDirMessage: string
  suppressUntil: number // timestamp for suppression
}