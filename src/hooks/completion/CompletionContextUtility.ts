import { useCallback } from 'react'
import type { CompletionContext } from './types'
import { hasSubcommands } from '../../utils/subcommandRegistry'

export class CompletionContextUtility {
  // Clean word detection - Linus approved simplicity
  getWordAtCursor = useCallback((
    input: string,
    cursorOffset: number
  ): CompletionContext | null => {
    if (!input) return null

    // IMPORTANT: Only match the word/prefix BEFORE the cursor
    let start = cursorOffset

    // Move start backwards to find word beginning
    while (start > 0) {
      const char = input[start - 1]
      // Stop at whitespace
      if (/\s/.test(char)) break

      // For @mentions, include @ and stop
      if (char === '@' && start < cursorOffset) {
        start--
        break
      }

      // For #mentions, include # and stop
      if (char === '#' && start < cursorOffset) {
        start--
        break
      }

      // For %agent commands, include % and stop
      if (char === '%' && start < cursorOffset) {
        start--
        break
      }

      // For paths, be smarter about / handling
      if (char === '/') {
        const collectedSoFar = input.slice(start, cursorOffset)

        if (collectedSoFar.includes('/') || collectedSoFar.includes('.')) {
          start--
          continue
        }

        if (start > 1) {
          const prevChar = input[start - 2]
          if (prevChar === '.' || prevChar === '~') {
            start--
            continue
          }
        }

        if (start === 1 || (start > 1 && /\s/.test(input[start - 2]))) {
          start--
          break
        }

        start--
        continue
      }

      // Special handling for dots in paths
      if (char === '.' && start > 0) {
        const nextChar = start < input.length ? input[start] : ''
        if (nextChar === '/' || nextChar === '.') {
          start--
          continue
        }
      }

      // Handle Unicode characters (including Chinese characters)
      if (/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}\u{30000}-\u{3134f}]/u.test(char)) {
        start--
        continue
      }

      start--
    }

    // The word is from start to cursor position
    const word = input.slice(start, cursorOffset)
    if (!word) return null

    // Priority-based type detection
    if (word.startsWith('/')) {
      const beforeWord = input.slice(0, start).trim()
      const isCommand = beforeWord === '' && !word.includes('/', 1)
      
      if (isCommand) {
        return {
          type: 'command',
          prefix: word.slice(1),
          startPos: start,
          endPos: cursorOffset
        }
      }
      
      // Check if this is a subcommand context
      // Pattern: "/command/" followed by text OR "/command " followed by text (for backward compatibility)
      if (beforeWord.startsWith('/')) {
        let commandName = ''
        let isSlashFormat = false
        
        // New format: "/command/" - handle when cursor is after the slash
        // This happens when typing "/ignore/" - beforeWord is "/ignore", word is "/"
        if (word === '/' && beforeWord.length > 1) {
          commandName = beforeWord.slice(1) // Remove leading /
          isSlashFormat = true
        }
        // Alternative case: beforeWord is "/ignore/" and word is empty
        else if (beforeWord.endsWith('/') && beforeWord.length > 1) {
          commandName = beforeWord.slice(1, -1) // Remove leading / and trailing /
          isSlashFormat = true
        }
        // Old format: "/command " (for backward compatibility)
        else if (beforeWord.endsWith(' ')) {
          commandName = beforeWord.slice(1, -1) // Remove / and trailing space
        }
        
        if (commandName && hasSubcommands(commandName)) {
          return {
            type: 'subcommand',
            prefix: word === '/' ? '' : word, // If word is just "/", treat as empty prefix
            startPos: start,
            endPos: cursorOffset,
            parentCommand: commandName,
            isSlashFormat
          }
        }
      }
      
      return {
        type: 'file',
        prefix: word,
        startPos: start,
        endPos: cursorOffset
      }
    }

    if (word.startsWith('@')) {
      const content = word.slice(1)

      // Check if this looks like an email
      if (word.includes('@', 1)) {
        return null
      }

      return {
        type: 'at-file',
        prefix: content,
        startPos: start,
        endPos: cursorOffset
      }
    }

    if (word.startsWith('#')) {
      const content = word.slice(1)

      // Check if this looks like a URL fragment
      if (word.includes('#', 1)) {
        return null
      }

      return {
        type: 'agent',
        prefix: content,
        startPos: start,
        endPos: cursorOffset
      }
    }

    if (word.startsWith('%')) {
      const content = word.slice(1)

      // Check if this looks like a percentage
      if (word.includes('%', 1)) {
        return null
      }

      return {
        type: 'percent-agent',
        prefix: content,
        startPos: start,
        endPos: cursorOffset
      }
    }
    // Everything else defaults to file completion
    return {
      type: 'file',
      prefix: word,
      startPos: start,
      endPos: cursorOffset
    }
  }, [])

  // Smart triggering - only when it makes sense
  shouldAutoTrigger = useCallback((context: CompletionContext): boolean => {
    switch (context.type) {
      case 'command':
        return true
      case 'subcommand':
        return true
      case 'agent':
        return true
      case 'percent-agent':
        return true
      case 'at-file':
        return true
      case 'file':
        const prefix = context.prefix

        // Always trigger for clear path patterns
        if (prefix.startsWith('./') || prefix.startsWith('../') ||
          prefix.startsWith('/') || prefix.startsWith('~') ||
          prefix.includes('/')) {
          return true
        }

        // Trigger for single dot followed by something
        if (prefix.startsWith('.') && prefix.length >= 2) {
          return true
        }

        // Always trigger for Chinese characters
        if (/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}\u{30000}-\u{3134f}]/u.test(prefix)) {
          return true
        }

        // Skip very short prefixes that are likely code
        return false
      default:
        return false
    }
  }, [])

  // Helper function to determine if single suggestion should be auto-hidden
  shouldAutoHideSingleMatch = useCallback((
    suggestion: { value: string, type?: string },
    context: CompletionContext,
    input: string
  ): boolean => {
    const currentInput = input.slice(context.startPos, context.endPos)

    // For files: more intelligent matching
    if (context.type === 'file' || context.type === 'at-file') {
      // Special case: if suggestion is a directory, don't auto-hide
      if (suggestion.value.endsWith('/')) {
        return false
      }

      // Check exact match
      if (currentInput === suggestion.value) {
        return true
      }

      // Check if current input is a complete file path
      if (currentInput.endsWith('/' + suggestion.value) || currentInput.endsWith(suggestion.value)) {
        return true
      }

      return false
    }

    // For commands: never auto-hide
    if (context.type === 'command') {
      return false
    }

    // For subcommands: never auto-hide
    if (context.type === 'subcommand') {
      return false
    }

    // For agents: never auto-hide
    if (context.type === 'agent') {
      return false
    }

    // For percent-agents: never auto-hide
    if (context.type === 'percent-agent') {
      return false
    }

    return false
  }, [])
}