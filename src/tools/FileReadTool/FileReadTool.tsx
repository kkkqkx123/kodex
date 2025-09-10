import { ImageBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { statSync, readdirSync } from 'node:fs'
import { Box, Text } from 'ink'
import * as path from 'node:path'
import { extname, relative } from 'node:path'
import * as React from 'react'
import { z } from 'zod'
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage'
import { HighlightedCode } from '../../components/HighlightedCode'
import type { Tool } from '../../Tool'
import { getCwd } from '../../utils/state'
import {
  addLineNumbers,
  findSimilarFile,
  normalizeFilePath,
  readTextContent,
} from '../../utils/file.js'
import { logError } from '../../utils/log'
import { getTheme } from '../../utils/theme'
import { emitReminderEvent } from '../../services/systemReminder'
import {
  recordFileRead,
  generateFileModificationReminder,
} from '../../services/fileFreshness'
import { DESCRIPTION, PROMPT } from './prompt'
import { hasReadPermission } from '../../utils/permissions/filesystem'
import { secureFileService } from '../../utils/secureFile'

const MAX_LINES_TO_RENDER = 5
const MAX_OUTPUT_SIZE = 0.25 * 1024 * 1024 // 0.25MB in bytes

// Common image extensions
const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.webp',
])

async function validateSingleFile(file_path: string, offset: number | undefined, limit: number | undefined) {
  const fullFilePath = normalizeFilePath(file_path)

  // Use secure file service to check if file exists and get file info
  const fileCheck = secureFileService.safeGetFileInfo(fullFilePath)
  if (!fileCheck.success) {
    // Try to find a similar file with a different extension
    const similarFilename = findSimilarFile(fullFilePath)
    let message = 'File does not exist.'

    // If we found a similar file, suggest it to the assistant
    if (similarFilename) {
      message += ` Did you mean ${similarFilename}?`
    }

    return {
      result: false,
      message,
    }
  }

  const stats = fileCheck.stats!
  const fileSize = stats.size
  const ext = path.extname(fullFilePath).toLowerCase()

  // Skip size check for image files - they have their own size limits
  if (!IMAGE_EXTENSIONS.has(ext)) {
    // If file is too large and no offset/limit provided
    if (fileSize > MAX_OUTPUT_SIZE && !offset && !limit) {
      return {
        result: false,
        message: formatFileSizeError(fileSize),
        meta: { fileSize },
      }
    }
  }

  return { result: true }
}

// Maximum dimensions for images
const MAX_WIDTH = 2000
const MAX_HEIGHT = 2000
const MAX_IMAGE_SIZE = 3.75 * 1024 * 1024 // 5MB in bytes, with base64 encoding

const inputSchema = z.strictObject({
  file_path: z.union([
    z.string().describe('The absolute path to the file to read'),
    z.array(z.string()).describe('Array of absolute paths to read multiple files at once')
  ]),
  offset: z
    .number()
    .optional()
    .describe(
      'The line number to start reading from. Only provide if the file is too large to read at once',
    ),
  limit: z
    .number()
    .optional()
    .describe(
      'The number of lines to read. Only provide if the file is too large to read at once.',
    ),
})

export const FileReadTool = {
  name: 'View',
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  inputSchema,
  isReadOnly() {
    return true
  },
  isConcurrencySafe() {
    return true // FileRead is read-only, safe for concurrent execution
  },
  userFacingName() {
    return 'Read'
  },
  async isEnabled() {
    return true
  },
  needsPermissions({ file_path }) {
    // Handle JSON string representation of array
    let filePaths: string | string[]
    if (typeof file_path === 'string' && file_path.startsWith('[') && file_path.endsWith(']')) {
      try {
        filePaths = JSON.parse(file_path)
      } catch (e) {
        // If parsing fails, treat as single file path
        filePaths = file_path
      }
    } else {
      filePaths = file_path
    }
    
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths]
    return paths.some(path => !hasReadPermission(path || getCwd()))
  },
  renderToolUseMessage(input, { verbose }) {
    const { file_path, ...rest } = input
    const formatFilePath = (path: string | string[]) => {
      // Handle JSON string representation of array
      let filePaths: string | string[]
      if (typeof path === 'string' && path.startsWith('[') && path.endsWith(']')) {
        try {
          filePaths = JSON.parse(path)
        } catch (e) {
          // If parsing fails, treat as single file path
          filePaths = path
        }
      } else {
        filePaths = path
      }
      
      if (Array.isArray(filePaths)) {
        return filePaths.map(p => verbose ? p : relative(getCwd(), p))
      }
      return verbose ? filePaths : relative(getCwd(), filePaths)
    }
    
    const entries = [
      ['file_path', formatFilePath(file_path)],
      ...Object.entries(rest),
    ]
    return entries
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')
  },
  renderToolResultMessage(output) {
    const verbose = false // Set default value for verbose
    // TODO: Render recursively
    switch (output.type) {
      case 'image':
        return (
          <Box justifyContent="space-between" overflowX="hidden" width="100%">
            <Box flexDirection="row">
              <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
              <Text>Read image</Text>
            </Box>
          </Box>
        )
      case 'text': {
        const { filePath, content, numLines } = output.file
        const contentWithFallback = content || '(No content)'
        return (
          <Box justifyContent="space-between" overflowX="hidden" width="100%">
            <Box flexDirection="row">
              <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
              <Box flexDirection="column">
                <HighlightedCode
                  code={
                    verbose
                      ? contentWithFallback
                      : contentWithFallback
                          .split('\n')
                          .slice(0, MAX_LINES_TO_RENDER)
                          .filter(_ => _.trim() !== '')
                          .join('\n')
                  }
                  language={extname(filePath).slice(1)}
                />
                {!verbose && numLines > MAX_LINES_TO_RENDER && (
                  <Text color={getTheme().secondaryText}>
                    ... (+{numLines - MAX_LINES_TO_RENDER} lines)
                  </Text>
                )}
              </Box>
            </Box>
          </Box>
        )
      }
    }
  },
  renderToolUseRejectedMessage() {
    return <FallbackToolUseRejectedMessage />
  },
  async validateInput({ file_path, offset, limit }) {
    // Handle JSON string representation of array
    let filePaths: string | string[]
    if (typeof file_path === 'string' && file_path.startsWith('[') && file_path.endsWith(']')) {
      try {
        filePaths = JSON.parse(file_path)
      } catch (e) {
        // If parsing fails, treat as single file path
        filePaths = file_path
      }
    } else {
      filePaths = file_path
    }
    
    // Handle batch file reading
    if (Array.isArray(filePaths)) {
      const maxFiles = 10 // Limit maximum files per batch
      if (filePaths.length > maxFiles) {
        return {
          result: false,
          message: `最多支持同时读取${maxFiles}个文件`,
        }
      }
      
      // Validate each file in the batch
      for (const filePath of filePaths) {
        const result = await validateSingleFile(filePath, offset, limit)
        if (!result.result) {
          return result
        }
      }
      
      return { result: true }
    } else {
      // Handle single file reading (existing logic)
      return await validateSingleFile(filePaths, offset, limit)
    }
 },
  async *call(
    { file_path, offset = 1, limit = undefined },
    { readFileTimestamps },
  ) {
    // Handle JSON string representation of array
    let filePaths: string | string[]
    if (typeof file_path === 'string' && file_path.startsWith('[') && file_path.endsWith(']')) {
      try {
        filePaths = JSON.parse(file_path)
      } catch (e) {
        // If parsing fails, treat as single file path
        filePaths = file_path
      }
    } else {
      filePaths = file_path
    }
    
    // Handle batch file reading
    if (Array.isArray(filePaths)) {
      const maxFiles = 10 // Limit maximum files per batch
      if (filePaths.length > maxFiles) {
        throw new Error(`最多支持同时读取${maxFiles}个文件`)
      }
      
      const results = await Promise.all(
        filePaths.map(path => readSingleFile(path, offset, limit, readFileTimestamps))
      )
      
      yield {
        type: 'result',
        data: { type: 'batch', files: results },
        resultForAssistant: renderBatchResultForAssistant(results),
      }
    } else {
      // Handle single file reading (existing logic)
      const result = await readSingleFile(filePaths, offset, limit, readFileTimestamps)
      yield {
        type: 'result',
        data: result,
        resultForAssistant: this.renderResultForAssistant(result),
      }
    }
  },
  renderResultForAssistant(data) {
    return renderResultForAssistant(data)
  },
} satisfies Tool<
  typeof inputSchema,
  | {
      type: 'text'
      file: {
        filePath: string
        content: string
        numLines: number
        startLine: number
        totalLines: number
      }
    }
  | {
      type: 'image'
      file: { base64: string; type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }
    }
  | {
      type: 'batch'
      files: Array<{
        type: 'text'
        file: {
          filePath: string
          content: string
          numLines: number
          startLine: number
          totalLines: number
        }
      } | {
        type: 'image'
        file: { base64: string; type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }
      }>
    }
>

const formatFileSizeError = (sizeInBytes: number) =>
 `File content (${Math.round(sizeInBytes / 1024)}KB) exceeds maximum allowed size (${Math.round(MAX_OUTPUT_SIZE / 1024)}KB). Please use offset and limit parameters to read specific portions of the file, or use the GrepTool to search for specific content.`

function renderBatchResultForAssistant(results: any[]) {
  return results.map(result => {
    switch (result.type) {
      case 'image':
        return `=== ${result.file.type} ===\n${renderResultForAssistant(result)}`
      case 'text':
        return `=== ${result.file.filePath} ===\n${renderResultForAssistant(result)}`
      default:
        return `=== Unknown file type ===\n${JSON.stringify(result)}`
    }
  }).join('\n\n')
}

function renderResultForAssistant(data: any) {
  switch (data.type) {
    case 'image':
      return `[Image: ${data.file.type} - ${Math.round(data.file.base64.length * 0.75)} bytes]`
    case 'text':
      return addLineNumbers(data.file)
    case 'batch':
      return renderBatchResultForAssistant(data.files)
  }
}

async function readSingleFile(
  filePath: string,
  offset: number,
  limit: number | undefined,
  readFileTimestamps: Record<string, number>
) {
  const ext = path.extname(filePath).toLowerCase()
  const fullFilePath = normalizeFilePath(filePath)

  // Record file read for freshness tracking
  recordFileRead(fullFilePath)

  // No longer emit file read event since file content will be embedded directly
  // Emit file read event for system reminders
  // emitReminderEvent('file:read', {
  //   filePath: fullFilePath,
  //   extension: ext,
  //   timestamp: Date.now(),
  // })

  // Update read timestamp, to invalidate stale writes
  readFileTimestamps[fullFilePath] = Date.now()

  // Check for file modifications and generate reminder if needed
  const modificationReminder = generateFileModificationReminder(fullFilePath)
  if (modificationReminder) {
    emitReminderEvent('file:modified', {
      filePath: fullFilePath,
      reminder: modificationReminder,
      timestamp: Date.now(),
    })
  }

  // Use secure file service to check if path is a file or directory
  const fileCheck = secureFileService.safeGetFileInfo(fullFilePath)
  if (!fileCheck.success) {
    throw new Error(fileCheck.error || 'Failed to get file info')
  }

  const stats = fileCheck.stats!
  
  // Handle directory
  if (stats.isDirectory) {
    // For directories, list contents
    const dirContents = readdirSync(fullFilePath)
    return {
      type: 'text' as const,
      file: {
        filePath: fullFilePath,
        content: `Directory contents:\n${dirContents.join('\n')}`,
        numLines: dirContents.length + 1,
        startLine: 1,
        totalLines: dirContents.length + 1,
      }
    }
  }
  // Handle file
  else if (stats.isFile) {
    // Handle image files
    if (IMAGE_EXTENSIONS.has(ext)) {
      const data = await readImage(fullFilePath, ext)
      return data
    }

    // Handle text files
    const textContent = await readTextContent(fullFilePath, offset, limit)
    return {
      type: 'text' as const,
      file: {
        filePath: fullFilePath,
        content: textContent.content,
        numLines: textContent.lineCount,
        startLine: 1,
        totalLines: textContent.totalLines,
      }
    }
  }
  // Handle other types (e.g., symlinks)
  else {
    throw new Error(`Unsupported file type: ${fullFilePath}`)
  }
}

function createImageResponse(
  buffer: Buffer,
  ext: string,
): {
  type: 'image'
  file: { base64: string; type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }
} {
  return {
    type: 'image',
    file: {
      base64: buffer.toString('base64'),
      type: `image/${ext.slice(1)}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    },
  }
}

async function readImage(
  filePath: string,
  ext: string,
): Promise<{
  type: 'image'
  file: { base64: string; type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }
}> {
  try {
    const stats = statSync(filePath)
    let sharp: any
    try {
      // Use dynamic require to avoid TypeScript module resolution
      sharp = require('sharp')
    } catch (e) {
      // Sharp is not available, return original image without processing
      console.warn('Sharp module not found, returning original image without processing')
    }
    
    // Use secure file service to read the file
    const fileReadResult = secureFileService.safeReadFile(filePath, {
      encoding: 'buffer' as BufferEncoding,
      maxFileSize: MAX_IMAGE_SIZE
    })
    
    if (!fileReadResult.success) {
      throw new Error(`Failed to read image file: ${fileReadResult.error}`)
    }
    
    // If sharp is not available, return original image
    if (!sharp) {
      return createImageResponse(fileReadResult.content as Buffer, ext)
    }

    const image = sharp(fileReadResult.content as Buffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      if (stats.size > MAX_IMAGE_SIZE) {
        const compressedBuffer = await image.jpeg({ quality: 80 }).toBuffer()
        return createImageResponse(compressedBuffer, 'jpeg')
      }
    }

    // Calculate dimensions while maintaining aspect ratio
    let width = metadata.width || 0
    let height = metadata.height || 0

    // Check if the original file just works
    if (
      stats.size <= MAX_IMAGE_SIZE &&
      width <= MAX_WIDTH &&
      height <= MAX_HEIGHT
    ) {
      // Use secure file service to read the file
      const fileReadResult = secureFileService.safeReadFile(filePath, {
        encoding: 'buffer' as BufferEncoding,
        maxFileSize: MAX_IMAGE_SIZE
      })
      
      if (!fileReadResult.success) {
        throw new Error(`Failed to read image file: ${fileReadResult.error}`)
      }
      
      return createImageResponse(fileReadResult.content as Buffer, ext)
    }

    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width)
      width = MAX_WIDTH
    }

    if (height > MAX_HEIGHT) {
      width = Math.round((width * MAX_HEIGHT) / height)
      height = MAX_HEIGHT
    }

    // Resize image and convert to buffer
    const resizedImageBuffer = await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer()

    // If still too large after resize, compress quality
    if (resizedImageBuffer.length > MAX_IMAGE_SIZE) {
      const compressedBuffer = await image.jpeg({ quality: 80 }).toBuffer()
      return createImageResponse(compressedBuffer, 'jpeg')
    }

    return createImageResponse(resizedImageBuffer, ext)
  } catch (e) {
    logError(e)
    // If any error occurs during processing, return original image
    const fileReadResult = secureFileService.safeReadFile(filePath, {
      encoding: 'buffer' as BufferEncoding,
      maxFileSize: MAX_IMAGE_SIZE
    })
    
    if (!fileReadResult.success) {
      throw new Error(`Failed to read image file: ${fileReadResult.error}`)
    }
    
    return createImageResponse(fileReadResult.content as Buffer, ext)
  }
}
