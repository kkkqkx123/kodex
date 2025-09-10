/**
 * Subcommand registry system for Kode CLI
 * Maps commands to their available subcommands for autocompletion
 */

export interface SubcommandDefinition {
  name: string
  description: string
  aliases?: string[]
}

export interface CommandSubcommands {
  [commandName: string]: SubcommandDefinition[]
}

/**
 * Global registry of command subcommands
 * Commands can register their subcommands here for autocompletion
 */
export const SUBCOMMAND_REGISTRY: CommandSubcommands = {
  // Built-in command subcommands
  ignore: [
    { name: 'refresh', description: 'Refresh all ignore rules in the project' },
    { name: 'list', description: 'List all current ignore rules', aliases: ['ls'] },
  ],
  
  // Todo command subcommands
  todo: [
    { name: 'update', description: 'Update todo list status and continue tasks' },
    { name: 'show', description: 'Display current todo list content' },
    { name: 'rollback', description: 'Rollback todo list and recheck completion status' },
    { name: 'new', description: 'Replace todo list with content from file', aliases: ['create'] },
  ],
  
  // Add more commands with subcommands as needed
  // Example:
  // config: [
  //   { name: 'set', description: 'Set a configuration value' },
  //   { name: 'get', description: 'Get a configuration value' },
  //   { name: 'reset', description: 'Reset configuration to defaults' },
  // ],
}

/**
 * Register subcommands for a command
 */
export function registerSubcommands(
  commandName: string,
  subcommands: SubcommandDefinition[]
): void {
  SUBCOMMAND_REGISTRY[commandName] = subcommands
}

/**
 * Get subcommands for a specific command
 */
export function getSubcommands(commandName: string): SubcommandDefinition[] {
  return SUBCOMMAND_REGISTRY[commandName] || []
}

/**
 * Check if a command has registered subcommands
 */
export function hasSubcommands(commandName: string): boolean {
  return commandName in SUBCOMMAND_REGISTRY && SUBCOMMAND_REGISTRY[commandName].length > 0
}

/**
 * Find a subcommand by name or alias
 */
export function findSubcommand(
  commandName: string,
  subcommandName: string
): SubcommandDefinition | null {
  const subcommands = getSubcommands(commandName)
  return (
    subcommands.find(
      sub =>
        sub.name === subcommandName || sub.aliases?.includes(subcommandName)
    ) || null
  )
}