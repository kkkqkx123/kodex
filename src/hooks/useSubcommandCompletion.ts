import { useCallback, useEffect } from 'react'
import type { CompletionContext } from './completion/types'

export interface SubcommandCompletionHookOptions {
  /**
   * Called when a subcommand completion should be triggered
   * @param commandName The command that has subcommands
   * @param input The current input value
   * @param cursorOffset The current cursor position
   * @returns true if the hook handled the completion, false otherwise
   */
  onTrigger?: (
    commandName: string,
    input: string,
    cursorOffset: number
  ) => boolean

  /**
   * Called to check if a command has subcommands available
   * @param commandName The command name to check
   * @returns true if the command has subcommands
   */
  hasSubcommands?: (commandName: string) => boolean
}

/**
 * Hook for handling subcommand completion triggers
 * This allows external systems to hook into the subcommand completion system
 */
export function useSubcommandCompletion(options: SubcommandCompletionHookOptions = {}) {
  const { onTrigger, hasSubcommands: checkHasSubcommands } = options

  /**
   * Check if the current input should trigger subcommand completion
   */
  const shouldTriggerSubcommandCompletion = useCallback((
    input: string,
    cursorOffset: number
  ): { shouldTrigger: boolean; commandName?: string } => {
    // Find the word before the cursor
    let start = cursorOffset
    while (start > 0 && !/\s/.test(input[start - 1])) {
      start--
    }

    const wordBeforeCursor = input.slice(start, cursorOffset)
    
    // Check if we have "/command " pattern
    if (wordBeforeCursor.startsWith('/') && wordBeforeCursor.endsWith(' ')) {
      const commandName = wordBeforeCursor.slice(1, -1)
      
      // Check if this command has subcommands
      if (checkHasSubcommands?.(commandName)) {
        return { shouldTrigger: true, commandName }
      }
    }

    return { shouldTrigger: false }
  }, [checkHasSubcommands])

  /**
   * Handle input changes for subcommand completion
   */
  const handleInputChange = useCallback((
    input: string,
    cursorOffset: number
  ): boolean => {
    const { shouldTrigger, commandName } = shouldTriggerSubcommandCompletion(input, cursorOffset)
    
    if (shouldTrigger && commandName && onTrigger) {
      return onTrigger(commandName, input, cursorOffset)
    }
    
    return false
  }, [shouldTriggerSubcommandCompletion, onTrigger])

  return {
    shouldTriggerSubcommandCompletion,
    handleInputChange
  }
}