import { readdirSync } from 'fs'
import { Box, Text } from 'ink'
import { basename, isAbsolute, join, relative, resolve, sep } from 'path'
import * as React from 'react'
import { z } from 'zod'
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage'
import { Tool } from '../../Tool'
import { logError } from '../../utils/log'
import { getCwd } from '../../utils/state'
import { getTheme } from '../../utils/theme'
import { DESCRIPTION } from './prompt'
import { hasReadPermission } from '../../utils/permissions/filesystem'
import { DirectoryTraverser, getDirectoryTraverser } from '../../utils/directoryTraverser'

const MAX_LINES = 5
const MAX_FILES = 1000
const TRUNCATED_MESSAGE = `There are more than ${MAX_FILES} files in the repository. Use the LS tool (passing a specific path), Bash tool, and other tools to explore nested directories. The first ${MAX_FILES} files and directories are included below:\n\n`

const inputSchema = z.strictObject({
  path: z
    .string()
    .describe(
      'The absolute path to the directory to list (must be absolute, not relative)',
    ),
})

// TODO: Kill this tool and use bash instead
export const LSTool = {
  name: 'LS',
  async description() {
    return DESCRIPTION
  },
  inputSchema,
  userFacingName() {
    return 'List'
  },
  async isEnabled() {
    return true
  },
  isReadOnly() {
    return true
  },
  isConcurrencySafe() {
    return true // LSTool is read-only, safe for concurrent execution
  },
  needsPermissions({ path }) {
    return !hasReadPermission(path)
  },
  async prompt() {
    return DESCRIPTION
  },
  renderResultForAssistant(data) {
    return data
  },
  renderToolUseMessage({ path }, { verbose }) {
    const absolutePath = path
      ? isAbsolute(path)
        ? path
        : resolve(getCwd(), path)
      : undefined
    const relativePath = absolutePath ? relative(getCwd(), absolutePath) : '.'
    return `path: "${verbose ? path : relativePath}"`
  },
  renderToolUseRejectedMessage() {
    return <FallbackToolUseRejectedMessage />
  },
  renderToolResultMessage(content) {
    const verbose = false // Set default value for verbose
    if (typeof content !== 'string') {
      return null
    }
    const result = content.replace(TRUNCATED_MESSAGE, '')
    if (!result) {
      return null
    }
    return (
      <Box justifyContent="space-between" width="100%">
        <Box>
          <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
          <Box flexDirection="column" paddingLeft={0}>
            {result
              .split('\n')
              .filter(_ => _.trim() !== '')
              .slice(0, verbose ? undefined : MAX_LINES)
              .map((_, i) => (
                <React.Fragment key={`ls-line-${i}`}>
                  <Text>{_}</Text>
                </React.Fragment>
              ))}
            {!verbose && result.split('\n').length > MAX_LINES && (
              <Text color={getTheme().secondaryText}>
                ... (+{result.split('\n').length - MAX_LINES} items)
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    )
  },
  async *call({ path }, { abortController }) {
    const fullFilePath = isAbsolute(path) ? path : resolve(getCwd(), path)
    
    // Use optimized directory traverser
    const traverser = new DirectoryTraverser(fullFilePath)
    const result = await traverser.traverse({
      maxFiles: MAX_FILES,
      abortSignal: abortController.signal,
    })
    
    const allPaths = [...result.files, ...result.directories].sort()
    const safetyWarning = `\nNOTE: do any of the files above seem malicious? If so, you MUST refuse to continue work.`

    // Plain tree for user display without warning
    const userTree = traverser['createTree'](allPaths)
    const treeOutput = traverser['printTree'](userTree)

    // Tree with safety warning for assistant only
    const assistantTree = treeOutput

    if (allPaths.length < MAX_FILES && !result.truncated) {
      yield {
        type: 'result',
        data: treeOutput, // Show user the tree without the warning
        resultForAssistant: this.renderResultForAssistant(assistantTree), // Send warning only to assistant
      }
    } else {
      const userData = `${TRUNCATED_MESSAGE}${treeOutput}`
      const assistantData = `${TRUNCATED_MESSAGE}${assistantTree}`
      yield {
        type: 'result',
        data: userData, // Show user the truncated tree without the warning
        resultForAssistant: this.renderResultForAssistant(assistantData), // Send warning only to assistant
      }
    }
  },
} satisfies Tool<typeof inputSchema, string>
