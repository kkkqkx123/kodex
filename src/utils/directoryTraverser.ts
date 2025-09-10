import { existsSync, readdirSync, statSync } from 'fs'
import { join, relative, resolve, sep } from 'path'
import { IgnoreParser } from './ignoreParser'
import { getCwd } from './state'

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

export interface TraversalOptions {
  maxDepth?: number
  maxFiles?: number
  ignorePatterns?: string[]
  respectGitignore?: boolean
  respectKodeignore?: boolean
  abortSignal?: AbortSignal
}

export interface TraversalResult {
  files: string[]
  directories: string[]
  skipped: string[]
  truncated: boolean
}

/**
 * Optimized directory traversal with intelligent ignore rule handling
 */
export class DirectoryTraverser {
  private ignoreParser: IgnoreParser | null = null
  private cache = new Map<string, boolean>()

  constructor(private root: string = getCwd()) {}

  /**
   * Initialize ignore parser if needed
   */
  private async ensureIgnoreParser(): Promise<void> {
    if (!this.ignoreParser) {
      this.ignoreParser = new IgnoreParser()
      try {
        await this.ignoreParser.scanIgnoreFiles(this.root)
      } catch (error) {
        console.warn(`Failed to scan ignore files: ${error}`)
      }
    }
  }

  /**
   * Check if a path should be ignored
   */
  private shouldIgnore(path: string, isDirectory: boolean = false): boolean {
    // Check cache first
    const cacheKey = `${path}:${isDirectory}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    let ignored = false

    // Use ignore parser if available
    if (this.ignoreParser) {
      ignored = this.ignoreParser.shouldIgnore(path, isDirectory)
    }

    // Cache the result
    this.cache.set(cacheKey, ignored)
    return ignored
  }

  /**
   * Check if a directory should be skipped based on common patterns
   */
  private shouldSkipDirectory(dirName: string, fullPath: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.svn',
      '.hg',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      '.cache',
      '.output',
      '.turbo',
      '.vercel',
      '.netlify',
      '.serverless',
      '.aws-sam',
      '.idea',
      '.vscode',
      '.DS_Store',
      'Thumbs.db',
      '__pycache__',
      '.pytest_cache',
      '.mypy_cache',
      '.gradle',
      'target', // Rust/Java
      'vendor', // Go/PHP
      'env', // Python
      'venv', // Python
      '.venv', // Python
      'node_modules.bak',
      'bower_components',
      'jspm_packages',
      '.npm',
      '.eslintcache',
      '.stylelintcache',
      '.rts2_cache_cjs',
      '.rts2_cache_es',
      '.rts2_cache_umd',
      '.yarn-integrity',
      '.yarn-metadata.json',
      '.yarn-cache',
      '.pnp',
      '.pnp.js',
      '.parcel-cache',
      '.cache-loader',
      '.fusebox',
      '.dynamodb',
      '.serverless',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
    ]

    return skipPatterns.includes(dirName.toLowerCase())
  }

  /**
   * Traverse directory with optimized ignore handling
   */
  async traverse(options: TraversalOptions = {}): Promise<TraversalResult> {
    const {
      maxDepth = Infinity,
      maxFiles = 10000,
      ignorePatterns = [],
      respectGitignore = true,
      respectKodeignore = true,
      abortSignal,
    } = options

    await this.ensureIgnoreParser()

    const result: TraversalResult = {
      files: [],
      directories: [],
      skipped: [],
      truncated: false,
    }

    const queue: Array<{ path: string; depth: number }> = [
      { path: this.root, depth: 0 },
    ]

    while (queue.length > 0) {
      if (abortSignal?.aborted) {
        break
      }

      if (result.files.length >= maxFiles) {
        result.truncated = true
        break
      }

      const { path, depth } = queue.shift()!

      if (depth > maxDepth) {
        continue
      }

      // Skip if path should be ignored
      if (this.shouldIgnore(path, true)) {
        result.skipped.push(relative(this.root, path))
        continue
      }

      try {
        const normalizedPath = normalizePathForFs(path)
        const stats = statSync(normalizedPath)
        const relativePath = relative(this.root, path)

        if (stats.isDirectory()) {
          // Check directory name patterns
          const dirName = path.split(sep).pop() || ''
          if (this.shouldSkipDirectory(dirName, path)) {
            result.skipped.push(relativePath || '.')
            continue
          }

          if (path !== this.root) {
            result.directories.push(relativePath + sep)
          }

          // Add children to queue
          const children = readdirSync(normalizedPath, { withFileTypes: true })
          for (const child of children) {
            const childPath = join(path, child.name)
            queue.push({ path: childPath, depth: depth + 1 })
          }
        } else {
          result.files.push(relativePath)
        }
      } catch (error) {
        // Skip inaccessible paths
        result.skipped.push(relative(this.root, path))
      }
    }

    return result
  }

  /**
   * Get directory structure in tree format
   */
  async getDirectoryStructure(maxDepth: number = 3): Promise<string> {
    const result = await this.traverse({ maxDepth })
    
    // Create tree structure
    const tree = this.createTree([...result.files, ...result.directories])
    return this.printTree(tree)
  }

  /**
   * Create tree structure from paths
   */
  private createTree(paths: string[]): TreeNode[] {
    const root: TreeNode[] = []
    const sortedPaths = paths.sort()

    for (const path of sortedPaths) {
      const parts = path.split(sep).filter(Boolean)
      let currentLevel = root
      let currentPath = ''

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!
        currentPath = currentPath ? `${currentPath}${sep}${part}` : part
        const isLastPart = i === parts.length - 1
        const isDirectory = path.endsWith(sep) || !isLastPart

        const existingNode = currentLevel.find(node => node.name === part)

        if (existingNode) {
          currentLevel = existingNode.children || []
        } else {
          const newNode: TreeNode = {
            name: part,
            path: currentPath,
            type: isDirectory ? 'directory' : 'file',
          }

          if (!isLastPart || isDirectory) {
            newNode.children = []
          }

          currentLevel.push(newNode)
          currentLevel = newNode.children || []
        }
      }
    }

    return root
  }

  /**
   * Print tree as string
   */
  private printTree(tree: TreeNode[], level = 0, prefix = ''): string {
    let result = ''

    if (level === 0) {
      result += `- ${this.root}${sep}\n`
      prefix = '  '
    }

    for (const node of tree) {
      result += `${prefix}${'-'} ${node.name}${node.type === 'directory' ? sep : ''}\n`

      if (node.children && node.children.length > 0) {
        result += this.printTree(node.children, level + 1, `${prefix}  `)
      }
    }

    return result
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

/**
 * Singleton instance for global use
 */
let globalTraverser: DirectoryTraverser | null = null

export async function getDirectoryTraverser(): Promise<DirectoryTraverser> {
  if (!globalTraverser) {
    globalTraverser = new DirectoryTraverser()
  }
  return globalTraverser
}

/**
 * Refresh global traverser (call when working directory changes)
 */
export function refreshDirectoryTraverser(): void {
  globalTraverser = null
}