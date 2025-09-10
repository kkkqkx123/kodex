import { parseEnvVars as mcpParseEnvVars } from '../../../services/mcpClient'

/**
 * Parses environment variables from command line arguments
 * @param rawEnvArgs Array of environment variable strings in the format "KEY=value"
 * @returns Record of environment variables
 */
export function parseEnvVars(rawEnvArgs: string[] | undefined): Record<string, string> {
  return mcpParseEnvVars(rawEnvArgs)
}

/**
 * Parses a string to an integer and returns its absolute value
 * @param value String value to parse
 * @returns Parsed integer or NaN if invalid
 */
export function parseIntValue(value: string): number {
  return Math.abs(parseInt(value))
}

/**
 * Checks if a parsed value is a valid number
 * @param value Parsed value to check
 * @returns True if the value is a valid number, false otherwise
 */
export function isValidNumber(value: number): boolean {
  return !isNaN(value)
}