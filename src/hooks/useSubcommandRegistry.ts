import { useCallback } from 'react'
import { registerSubcommands, getSubcommands, hasSubcommands } from '../utils/subcommandRegistry'
import type { SubcommandDefinition } from '../utils/subcommandRegistry'

/**
 * Hook for managing command subcommands
 * Allows components to register and query subcommands
 */
export function useSubcommandRegistry() {
  /**
   * Register subcommands for a command
   */
  const register = useCallback((commandName: string, subcommands: SubcommandDefinition[]) => {
    registerSubcommands(commandName, subcommands)
  }, [])

  /**
   * Get all subcommands for a command
   */
  const get = useCallback((commandName: string) => {
    return getSubcommands(commandName)
  }, [])

  /**
   * Check if a command has subcommands
   */
  const has = useCallback((commandName: string) => {
    return hasSubcommands(commandName)
  }, [])

  /**
   * Register a single subcommand for a command
   */
  const registerOne = useCallback((commandName: string, subcommand: SubcommandDefinition) => {
    const existing = getSubcommands(commandName)
    registerSubcommands(commandName, [...existing, subcommand])
  }, [get])

  /**
   * Remove subcommands for a command
   */
  const clear = useCallback((commandName: string) => {
    registerSubcommands(commandName, [])
  }, [])

  return {
    register,
    registerOne,
    get,
    has,
    clear
  }
}