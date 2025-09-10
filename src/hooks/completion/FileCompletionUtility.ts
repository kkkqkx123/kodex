import { useCallback } from 'react'
import { existsSync, statSync, readdirSync } from 'fs'
import { join, dirname, basename, resolve } from 'path'
import { getCwd } from '../../utils/state'
import { getGlobalConfig } from '../../utils/config'
import { IgnoreParser } from '../../utils/ignoreParser'
import type { UnifiedSuggestion } from './types'
import { matchCommands } from '../../utils/fuzzyMatcher'

/**
 * Normalize path for Git Bash environment
 * Converts Unix-style paths back to Windows paths when in Git Bash
 */
function normalizePathForFs(p: string): string {
  if (process.platform === 'win32' && process.env.MSYSTEM?.includes('MINGW')) {
    // Convert Unix-style path (/d/path/to/file) back to Windows path (D:\path\to\file)
    if (p.startsWith('/') && /^[a-z]/.test(p.substring(1))) {
      const driveLetter = p.substring(1, 2).toUpperCase();
      const restOfPath = p.substring(2).replace(/\//g, '\\');
      return `${driveLetter}:${restOfPath}`;
    }
    // Fix paths that start with single backslash (incorrect normalization)
    if (p.startsWith('\\') && p.length > 1 && /^[a-z]/.test(p.substring(1, 2))) {
      const driveLetter = p.substring(1, 2).toUpperCase();
      const restOfPath = p.substring(2);
      return `${driveLetter}:${restOfPath}`;
    }
  }
  return p;
}

export class FileCompletionUtility {
  private ignoreParser: IgnoreParser | null = null

  constructor() {
    this.initializeIgnoreParser()
  }

  private async initializeIgnoreParser() {
    try {
      const cwd = getCwd()
      this.ignoreParser = new IgnoreParser()
      await this.ignoreParser.scanIgnoreFiles(cwd)
    } catch (error) {
      console.warn('[FileCompletionUtility] Failed to initialize ignore parser:', error)
    }
  }

  // Generate file suggestions with Unix-style path completion
  generateFileSuggestions = useCallback((prefix: string, isAtReference: boolean = false): UnifiedSuggestion[] => {
    try {
      const cwd = getCwd()

      // Handle empty prefix case - show current directory contents
      if (!prefix) {
        const allEntries = readdirSync(normalizePathForFs(cwd))
          .filter(entry => {
            // Don't show hidden files by default
            if (entry.startsWith('.')) return false

            // Check if entry should be ignored
            if (this.ignoreParser) {
              const fullPath = join(cwd, entry)
              return !this.ignoreParser.shouldIgnore(normalizePathForFs(fullPath))
            }

            return true
          })
          .sort((a, b) => {
            // Sort directories first, then files
            const aPath = join(cwd, a)
            const bPath = join(cwd, b)
            const aIsDir = statSync(normalizePathForFs(aPath)).isDirectory()
            const bIsDir = statSync(normalizePathForFs(bPath)).isDirectory()

            if (aIsDir && !bIsDir) return -1
            if (!aIsDir && bIsDir) return 1

            // Within same type, sort with proper Unicode support
            const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}\u{30000}-\u{3134f}]/u
            if (hasChinese.test(a) || hasChinese.test(b)) {
              return a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
            } else {
              return a.toLowerCase().localeCompare(b.toLowerCase())
            }
          })
        
        // Limit to 20 total items, with maximum 6 folders
        const folders = allEntries.filter(entry => {
          const entryPath = join(cwd, entry)
          return statSync(normalizePathForFs(entryPath)).isDirectory()
        }).slice(0, 6)
        
        const files = allEntries.filter(entry => {
          const entryPath = join(cwd, entry)
          return !statSync(normalizePathForFs(entryPath)).isDirectory()
        }).slice(0, 14) // 20 total - 6 folders = 14 files
        
        const limitedEntries = [...folders, ...files].slice(0, 20)
        
        return limitedEntries.map(entry => {
          const entryPath = join(cwd, entry)
          const isDir = statSync(normalizePathForFs(entryPath)).isDirectory()
          const icon = isDir ? '📁' : '📄'

          return {
            value: entry + (isDir ? '/' : ''),
            displayValue: `${icon} ${entry}${isDir ? '/' : ''}`,
            type: 'file' as const,
            score: isDir ? 90 : 70,
          }
        })
      }

      // Special handling for @ references - do a deep search
      if (isAtReference) {
        return this.generateDeepFileSuggestions(prefix, cwd)
      }

      // Parse user input preserving original format
      const userPath = prefix
      const isAbsolutePath = userPath.startsWith('/')
      const isHomePath = userPath.startsWith('~')

      // Check if the prefix contains Chinese characters
      const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}\u{30000}-\u{3134f}]/u.test(userPath)

      let searchDir: string
      let nameFilter: string
      let endsWithSlash: boolean = false
      let searchStat: any = null
      let searchPath: string = ''

      if (hasChinese) {
        // For Chinese characters, search in the current directory
        searchDir = cwd
        nameFilter = userPath
        endsWithSlash = userPath.endsWith('/')
        searchPath = cwd
      } else {
        // Resolve search directory - but keep user's path format for output
        if (isHomePath) {
          searchPath = userPath.replace('~', process.env.HOME || '')
        } else if (isAbsolutePath) {
          searchPath = userPath
        } else {
          searchPath = resolve(cwd, userPath)
        }

        // Determine search directory and filename filter
        endsWithSlash = userPath.endsWith('/')
        searchStat = existsSync(normalizePathForFs(searchPath)) ? statSync(normalizePathForFs(searchPath)) : null

        if (endsWithSlash || searchStat?.isDirectory()) {
          searchDir = searchPath
          nameFilter = ''
        } else {
          searchDir = dirname(searchPath)
          nameFilter = basename(searchPath)
        }
      }

      if (!existsSync(normalizePathForFs(searchDir))) {
        return []
      }

      // Get directory entries with filter
      const showHidden = nameFilter.startsWith('.') || userPath.includes('/.')
      const allEntries = readdirSync(normalizePathForFs(searchDir))
        .filter(entry => {
          // Filter hidden files unless user explicitly wants them
          if (!showHidden && entry.startsWith('.')) return false

          // Check if entry should be ignored
          if (this.ignoreParser) {
            const fullPath = join(searchDir, entry)
            if (this.ignoreParser.shouldIgnore(normalizePathForFs(fullPath))) return false
          }

          // Filter by name if there's a filter
          if (nameFilter) {
            if (hasChinese) {
              if (!entry.includes(nameFilter)) return false
            } else {
              if (!entry.toLowerCase().startsWith(nameFilter.toLowerCase())) return false
            }
          }
          return true
        })
        .sort((a, b) => {
          // Sort directories first, then files
          const aPath = join(searchDir, a)
          const bPath = join(searchDir, b)
          const aIsDir = statSync(normalizePathForFs(aPath)).isDirectory()
          const bIsDir = statSync(normalizePathForFs(bPath)).isDirectory()

          if (aIsDir && !bIsDir) return -1
          if (!aIsDir && bIsDir) return 1

          // Within same type, sort with proper Unicode support
          const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\u{2000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}\u{30000}-\u{3134f}]/u
          if (hasChinese.test(a) || hasChinese.test(b)) {
            return a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' })
          } else {
            return a.toLowerCase().localeCompare(b.toLowerCase())
          }
        })

      // Limit to 20 total items, with maximum 6 folders
      const folders = allEntries.filter(entry => {
        const entryPath = join(searchDir, entry)
        return statSync(normalizePathForFs(entryPath)).isDirectory()
      }).slice(0, 6)
      
      const files = allEntries.filter(entry => {
        const entryPath = join(searchDir, entry)
        return !statSync(normalizePathForFs(entryPath)).isDirectory()
      }).slice(0, 14) // 20 total - 6 folders = 14 files
      
      const limitedEntries = [...folders, ...files].slice(0, 20)

      return limitedEntries.map(entry => {
        const entryPath = join(searchDir, entry)
        const isDir = statSync(normalizePathForFs(entryPath)).isDirectory()
        const icon = isDir ? '📁' : '📄'

        // Unix-style path building - preserve user's original path format
        let value: string

        if (userPath.includes('/')) {
          // User typed path with separators - maintain structure
          if (endsWithSlash) {
            value = userPath + entry + (isDir ? '/' : '')
          } else if (searchStat?.isDirectory()) {
            value = userPath + '/' + entry + (isDir ? '/' : '')
          } else {
            const userDir = userPath.includes('/') ? userPath.substring(0, userPath.lastIndexOf('/')) : ''
            value = userDir ? userDir + '/' + entry + (isDir ? '/' : '') : entry + (isDir ? '/' : '')
          }
        } else {
          // User typed simple name
          if (searchStat?.isDirectory()) {
            value = userPath + '/' + entry + (isDir ? '/' : '')
          } else {
            value = entry + (isDir ? '/' : '')
          }
        }

        return {
          value,
          displayValue: `${icon} ${entry}${isDir ? '/' : ''}`,
          type: 'file' as const,
          score: isDir ? 100 : 70,
        }
      })
    } catch (error) {
      return []
    }
  }, [])

  // Helper function for deep file search when using @ references
  private generateDeepFileSuggestions = useCallback((prefix: string, cwd: string): UnifiedSuggestion[] => {
    try {
      const matchedFiles: UnifiedSuggestion[] = []
      const matchedFolders: UnifiedSuggestion[] = []
      const maxResults = 20

      // Simple breadth-first search through the directory tree
      const queue: string[] = [cwd]
      const visited = new Set<string>()

      while (queue.length > 0 && (matchedFiles.length + matchedFolders.length) < maxResults) {
        const currentDir = queue.shift()!

        if (visited.has(currentDir)) continue
        visited.add(currentDir)

        // Skip directories that should be ignored
        if (this.ignoreParser && this.ignoreParser.shouldIgnore(normalizePathForFs(currentDir), true)) {
          continue
        }

        try {
          const entries = readdirSync(normalizePathForFs(currentDir))

          for (const entry of entries) {
            // Skip hidden files/directories unless prefix explicitly starts with .
            if (entry.startsWith('.') && !prefix.startsWith('.')) continue

            const fullPath = join(currentDir, entry)
            const relativePath = fullPath.startsWith(cwd) ? fullPath.slice(cwd.length + 1) : fullPath

            // Skip entries that should be ignored
            if (this.ignoreParser && this.ignoreParser.shouldIgnore(normalizePathForFs(fullPath))) {
              continue
            }

            try {
              const stat = statSync(normalizePathForFs(fullPath))

              if (stat.isDirectory()) {
                queue.push(fullPath)

                if (entry.toLowerCase().includes(prefix.toLowerCase()) ||
                  relativePath.toLowerCase().includes(prefix.toLowerCase())) {
                  matchedFolders.push({
                    value: relativePath + '/',
                    displayValue: `📁 ${relativePath}/`,
                    type: 'file' as const,
                    score: 90,
                  })
                }
              } else {
                if (entry.toLowerCase().includes(prefix.toLowerCase()) ||
                  relativePath.toLowerCase().includes(prefix.toLowerCase())) {
                  matchedFiles.push({
                    value: relativePath,
                    displayValue: `📄 ${relativePath}`,
                    type: 'file' as const,
                    score: entry.toLowerCase().startsWith(prefix.toLowerCase()) ? 90 : 80,
                  })
                }
              }
            } catch (statError) {
              continue
            }
          }
        } catch (dirError) {
          continue
        }
      }

      // Limit folders to 6 items and total to 20 items
      const limitedFolders = matchedFolders.slice(0, 6)
      const limitedFiles = matchedFiles.slice(0, 14) // 20 total - 6 folders = 14 files
      
      return [...limitedFolders, ...limitedFiles]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
    } catch (error) {
      return []
    }
  }, [])

  // Calculate match score with Chinese character support
  calculateMatchScore = useCallback((suggestion: UnifiedSuggestion, prefix: string): number => {
    const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}\u{30000}-\u{3134f}]/u.test(prefix)

    let matchFound = false
    let score = 0

    if (hasChinese) {
      if (suggestion.value.startsWith(prefix)) {
        matchFound = true
        score = 100
      } else if (suggestion.value.includes(prefix)) {
        matchFound = true
        score = 95
      } else if (suggestion.displayValue.includes(prefix)) {
        matchFound = true
        score = 90
      }
    } else {
      const lowerPrefix = prefix.toLowerCase()
      const value = suggestion.value.toLowerCase()
      const displayValue = suggestion.displayValue.toLowerCase()

      if (value.startsWith(lowerPrefix)) {
        matchFound = true
        score = 100
      } else if (value.includes(lowerPrefix)) {
        matchFound = true
        score = 95
      } else if (displayValue.includes(lowerPrefix)) {
        matchFound = true
        score = 90
      } else {
        // Word boundary matching
        const words = value.split(/[-_]/)
        if (words.some(word => word.startsWith(lowerPrefix))) {
          matchFound = true
          score = 93
        } else {
          // Acronym matching
          const acronym = words.map(word => word[0]).join('')
          if (acronym.startsWith(lowerPrefix)) {
            matchFound = true
            score = 8
          }
        }
      }
    }

    if (!matchFound) return 0

    // Type preferences
    if (suggestion.type === 'ask') score += 2
    if (suggestion.type === 'agent') score += 1

    return score
  }, [])
}