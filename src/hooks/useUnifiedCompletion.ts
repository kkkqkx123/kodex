import { useState, useCallback, useEffect, useRef } from 'react'
import { useInput } from 'ink'
import type { Command } from '../commands'
import { getGlobalConfig } from '../utils/config'
import type { UnifiedSuggestion, CompletionContext } from './completion/types'
import { CommandCompletionUtility } from './completion/CommandCompletionUtility'
import { FileCompletionUtility } from './completion/FileCompletionUtility'
import { AgentCompletionUtility } from './completion/AgentCompletionUtility'
import { CompletionContextUtility } from './completion/CompletionContextUtility'
import { CompletionStateUtility } from './completion/CompletionStateUtility'

// Re-export the types
export type { UnifiedSuggestion, CompletionContext }

// Refactored completion state
interface CompletionState {
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
  suppressUntil: number
}

const INITIAL_STATE: CompletionState = {
  suggestions: [],
  selectedIndex: 0,
  isActive: false,
  context: null,
  preview: null,
  emptyDirMessage: '',
  suppressUntil: 0
}

interface Props {
  input: string
  cursorOffset: number
  onInputChange: (value: string) => void
  setCursorOffset: (offset: number) => void
  commands: Command[]
  onSubmit?: (value: string, isSubmittingSlashCommand?: boolean) => void
}

/**
 * Refactored unified completion system using utility classes
 * Much cleaner and more maintainable than the original 1660-line monster
 */
export function useUnifiedCompletion({
  input,
  cursorOffset,
  onInputChange,
  setCursorOffset,
  commands,
  onSubmit,
}: Props) {
  // Single state for entire completion system
  const [state, setState] = useState<CompletionState>(INITIAL_STATE)

  // Initialize utility classes
  const commandUtility = useRef(new CommandCompletionUtility())
  const fileUtility = useRef(new FileCompletionUtility())
  const agentUtility = useRef(new AgentCompletionUtility())
  const contextUtility = useRef(new CompletionContextUtility())
  const stateUtility = useRef(new CompletionStateUtility())

  // Direct state access
  const { suggestions, selectedIndex, isActive, emptyDirMessage } = state

  // Generate all suggestions based on context
  const generateSuggestions = useCallback((context: CompletionContext): UnifiedSuggestion[] => {
    switch (context.type) {
      case 'command':
        return commandUtility.current.generateCommandSuggestions(context.prefix, commands)
      case 'subcommand':
        return commandUtility.current.generateSubcommandSuggestions(
          context.prefix, 
          context.parentCommand || ''
        )
      case 'agent': {
        // @ reference: combine mentions and files
        const mentionSuggestions = agentUtility.current.generateMentionSuggestions(context.prefix)
        const fileSuggestions = fileUtility.current.generateFileSuggestions(context.prefix, true)

        // Apply weights for @ context
        const weightedSuggestions = [
          ...mentionSuggestions.map(s => ({
            ...s,
            weightedScore: s.score + 150
          })),
          ...fileSuggestions.map(s => ({
            ...s,
            weightedScore: s.score + 100
          }))
        ]

        // Sort by weighted score
        const results = weightedSuggestions
          .sort((a, b) => b.weightedScore - a.weightedScore)
          .map(({ weightedScore, ...suggestion }) => suggestion)

        // Limit results
        const config = getGlobalConfig()
        const limit = config.completionItemsLimit || 15
        return results.slice(0, limit)
      }
      case 'percent-agent': {
        // % reference: only agent suggestions for ask-agent and run-agent commands
        const mentionSuggestions = agentUtility.current.generateMentionSuggestions(context.prefix)
        
        // Filter for ask-agent and run-agent commands only
        const agentCommands = mentionSuggestions.filter(suggestion => 
          suggestion.value.startsWith('%ask-') || suggestion.value.startsWith('%run-agent-')
        )

        // Limit results
        const config = getGlobalConfig()
        const limit = config.completionItemsLimit || 15
        return agentCommands.slice(0, limit)
      }
      case 'at-file': {
        // @ symbol file completion - always use deep search
        const fileSuggestions = fileUtility.current.generateFileSuggestions(context.prefix, true)
        
        // Limit results
        const config = getGlobalConfig()
        const limit = config.completionItemsLimit || 15
        return fileSuggestions.slice(0, limit)
      }
      case 'file': {
        // For normal file input
        const fileSuggestions = fileUtility.current.generateFileSuggestions(context.prefix, false)
        const unixSuggestions = commandUtility.current.generateUnixCommandSuggestions(context.prefix)

        // Try to match agents and models WITHOUT requiring @
        const mentionMatches = agentUtility.current.generateMentionSuggestions(context.prefix)
          .map(s => ({
            ...s,
            isSmartMatch: true,
            displayValue: `→ ${s.displayValue}`
          }))

        // Apply source-based priority weights
        const weightedSuggestions = [
          ...unixSuggestions.map(s => ({
            ...s,
            sourceWeight: s.score >= 10000 ? 5000 : 200,
            weightedScore: s.score >= 10000 ? s.score + 5000 : s.score + 200
          })),
          ...mentionMatches.map(s => ({
            ...s,
            sourceWeight: 50,
            weightedScore: s.score + 50
          })),
          ...fileSuggestions.map(s => ({
            ...s,
            sourceWeight: 0,
            weightedScore: s.score
          }))
        ]

        // Sort by weighted score and deduplicate
        const seen = new Set<string>()
        const deduplicatedResults = weightedSuggestions
          .sort((a, b) => b.weightedScore - a.weightedScore)
          .filter(item => {
            if (seen.has(item.value)) return false
            seen.add(item.value)
            return true
          })
          .map(({ weightedScore, sourceWeight, ...suggestion }) => suggestion)

        // Limit results
        const config = getGlobalConfig()
        const limit = config.completionItemsLimit || 15
        return deduplicatedResults.slice(0, limit)
      }
      default:
        return []
    }
  }, [commands])

  // Complete with a suggestion
  const completeWith = useCallback((suggestion: UnifiedSuggestion, context: CompletionContext) => {
    let completion: string

    if (context.type === 'command') {
      completion = `/${suggestion.value} `
    } else if (context.type === 'subcommand') {
      // For subcommands, always use /command /subcommand format
      completion = `/${suggestion.value} `
    } else if (context.type === 'agent') {
      if (suggestion.type === 'agent') {
        completion = `#${suggestion.value} `
      } else if (suggestion.type === 'ask') {
        completion = `#${suggestion.value} `
      } else {
        const isDirectory = suggestion.value.endsWith('/')
        completion = `#${suggestion.value}${isDirectory ? '' : ' '}`
      }
    } else if (context.type === 'percent-agent') {
      if (suggestion.type === 'agent' || suggestion.type === 'ask') {
        completion = `${suggestion.value} `
      } else {
        const isDirectory = suggestion.value.endsWith('/')
        completion = `${suggestion.value}${isDirectory ? '' : ' '}`
      }
    } else if (context.type === 'at-file') {
      // @ symbol file completion
      const isDirectory = suggestion.value.endsWith('/')
      completion = `@${suggestion.value}${isDirectory ? '' : ' '}`
    } else {
      // Handle normal file completion
      completion = suggestion.value + (suggestion.value.endsWith('/') ? '' : ' ')
    }

    // Special handling for absolute paths
    let actualEndPos: number

    if (context.type === 'file' && suggestion.value.startsWith('/') && !suggestion.isSmartMatch) {
      let end = context.startPos
      while (end < input.length && input[end] !== ' ' && input[end] !== '\n') {
        end++
      }
      actualEndPos = end
    } else {
      const currentWord = input.slice(context.startPos)
      const nextSpaceIndex = currentWord.indexOf(' ')
      actualEndPos = nextSpaceIndex === -1 ? input.length : context.startPos + nextSpaceIndex
    }

    const newInput = input.slice(0, context.startPos) + completion + input.slice(actualEndPos)
    onInputChange(newInput)
    setCursorOffset(context.startPos + completion.length)
  }, [input, onInputChange, setCursorOffset])

  // Create wrapped methods for state utility
  const updateState = useCallback((updates: Partial<CompletionState>) => {
    stateUtility.current.updateState(setState, updates)
  }, [setState])

  const resetCompletion = useCallback(() => {
    stateUtility.current.resetCompletion(setState)
  }, [setState])

  const activateCompletion = useCallback(async (suggestions: UnifiedSuggestion[], context: CompletionContext) => {
    // Skip terminal clearing for command completion to prevent input box disappearance
    // The Ink Static component will handle UI updates without full terminal refresh
    stateUtility.current.activateCompletion(setState, suggestions, context)
  }, [setState])

  // Handle Tab key
  useInput((input_str, key) => {
    if (!key.tab || key.shift) return false

    const context = contextUtility.current.getWordAtCursor(input, cursorOffset)
    if (!context) return false

    // Handle async operation without blocking
    stateUtility.current.handleTabKey(
      input,
      state,
      context,
      generateSuggestions,
      completeWith,
      setState,
      onInputChange,
      setCursorOffset
    ).catch(err => {
      console.error('Error handling Tab key:', err)
    })

    return true // Indicate we've handled the key
  })

  // Handle navigation keys
  useInput((input_str, key) => {
    return stateUtility.current.handleNavigationKeys(
      input,
      key,
      state,
      onInputChange,
      setCursorOffset,
      setState,
      completeWith,
      generateSuggestions,
      resetCompletion
    )
  })

  // Handle delete/backspace keys
  useInput((input_str, key) => {
    return stateUtility.current.handleDeleteKeys(
      key,
      state,
      setState,
      resetCompletion,
      input
    )
  })

  // Input tracking with ref to avoid infinite loops
  const lastInputRef = useRef('')

  // Reset completion on terminal size changes to prevent rendering issues
  useEffect(() => {
    const handleResize = () => {
      if (state.isActive) {
        resetCompletion()
      }
    }

    process.stdout.on('resize', handleResize)
    return () => {
      process.stdout.off('resize', handleResize)
    }
  }, [state.isActive, resetCompletion])

  // Smart auto-triggering
  useEffect(() => {
    const handleAutoTrigger = async () => {
      if (lastInputRef.current === input) return

      const inputLengthChange = Math.abs(input.length - lastInputRef.current.length)
      const isHistoryNavigation = (
        inputLengthChange > 10 ||
        (inputLengthChange > 5 && !input.includes(lastInputRef.current.slice(-5)))
      ) && input !== lastInputRef.current

      lastInputRef.current = input

      // Skip if in preview mode or suppressed
      if (state.preview?.isActive || Date.now() < state.suppressUntil) {
        return
      }

      // Clear suggestions on history navigation
      if (isHistoryNavigation && state.isActive) {
        resetCompletion()
        return
      }

      const context = contextUtility.current.getWordAtCursor(input, cursorOffset)

      if (context && contextUtility.current.shouldAutoTrigger(context)) {
        const newSuggestions = generateSuggestions(context)

        if (newSuggestions.length === 0) {
          resetCompletion()
        } else if (newSuggestions.length === 1 &&
          contextUtility.current.shouldAutoHideSingleMatch(newSuggestions[0], context, input)) {
          resetCompletion()
        } else {
          await activateCompletion(newSuggestions, context)
        }
      } else if (state.context) {
        const contextChanged = !context ||
          state.context.type !== context.type ||
          state.context.startPos !== context.startPos ||
          !context.prefix.startsWith(state.context.prefix)

        if (contextChanged) {
          resetCompletion()
        }
      }
    }

    handleAutoTrigger()
  }, [input, cursorOffset, generateSuggestions, resetCompletion, activateCompletion])

  return {
    suggestions,
    selectedIndex,
    isActive,
    emptyDirMessage,
  }
}