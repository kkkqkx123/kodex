import {
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
} from './utils/config.js'
import { logError } from './utils/log'
import { getCodeStyle } from './utils/style'
import { getCwd } from './utils/state'
import { memoize, omit } from 'lodash-es'
import { LSTool } from './tools/LsTool/lsTool.js'
import { getIsGit } from './utils/git'
import { ripGrep } from './utils/ripgrep'
import * as path from 'path'
import { execFileNoThrow } from './utils/execFileNoThrow'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { getModelManager } from './utils/model'
import { lastX } from './utils/generators'
import { getGitEmail } from './utils/user'
import { PROJECT_FILE } from './constants/product'
import { IgnoreParser } from './utils/ignoreParser'
/**
 * Find all AGENTS.md and CLAUDE.md files in the current working directory
 */
export async function getClaudeFiles(): Promise<string | null> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 3000)
  try {
    // Search for both AGENTS.md and CLAUDE.md files
    const [codeContextFiles, claudeFiles] = await Promise.all([
      ripGrep(
        ['--files', '--glob', join('**', '*', PROJECT_FILE)],
        getCwd(),
        abortController.signal,
      ).catch(() => []),
      ripGrep(
        ['--files', '--glob', join('**', '*', 'CLAUDE.md')],
        getCwd(),
        abortController.signal,
      ).catch(() => []),
    ])

    const allFiles = [...codeContextFiles, ...claudeFiles]
    if (!allFiles.length) {
      return null
    }

    // Add instructions for additional project files
    const fileTypes = []
    if (codeContextFiles.length > 0) fileTypes.push('AGENTS.md')
    if (claudeFiles.length > 0) fileTypes.push('CLAUDE.md')

    return `NOTE: Additional project documentation files (${fileTypes.join(', ')}) were found. When working in these directories, make sure to read and follow the instructions in the corresponding files:\n${allFiles
      .map(_ => path.join(getCwd(), _))
      .map(_ => `- ${_}`)
      .join('\n')}`
  } catch (error) {
    logError(error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export function setContext(key: string, value: string): void {
  const projectConfig = getCurrentProjectConfig()
  const context = omit(
    { ...projectConfig.context, [key]: value },
    'codeStyle',
    'directoryStructure',
  )
  saveCurrentProjectConfig({ ...projectConfig, context })
}

export function removeContext(key: string): void {
  const projectConfig = getCurrentProjectConfig()
  const context = omit(
    projectConfig.context,
    key,
    'codeStyle',
    'directoryStructure',
  )
  saveCurrentProjectConfig({ ...projectConfig, context })
}

export const getReadme = memoize(async (): Promise<string | null> => {
  try {
    const readmePath = join(getCwd(), 'README.md')
    if (!existsSync(readmePath)) {
      return null
    }
    const content = await readFile(readmePath, 'utf-8')
    return content
  } catch (e) {
    logError(e)
    return null
  }
})

/**
 * Get project documentation content (AGENTS.md and CLAUDE.md)
 */
export const getProjectDocs = memoize(async (): Promise<string | null> => {
  try {
    const cwd = getCwd()
    const codeContextPath = join(cwd, 'AGENTS.md')
    const claudePath = join(cwd, 'CLAUDE.md')

    const docs = []

    // Try to read AGENTS.md
    if (existsSync(codeContextPath)) {
      try {
        const content = await readFile(codeContextPath, 'utf-8')
        docs.push(`# AGENTS.md\n\n${content}`)
      } catch (e) {
        logError(e)
      }
    }

    // Try to read CLAUDE.md
    if (existsSync(claudePath)) {
      try {
        const content = await readFile(claudePath, 'utf-8')
        docs.push(`# CLAUDE.md\n\n${content}`)
      } catch (e) {
        logError(e)
      }
    }

    return docs.length > 0 ? docs.join('\n\n---\n\n') : null
  } catch (e) {
    logError(e)
    return null
  }
})

export const getGitStatus = memoize(async (): Promise<string | null> => {
  if (process.env.NODE_ENV === 'test') {
    // Avoid cycles in tests
    return null
  }
  if (!(await getIsGit())) {
    return null
  }

  try {
    const [branch, mainBranch, status, log, authorLog] = await Promise.all([
      execFileNoThrow(
        'git',
        ['branch', '--show-current'],
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()),
      execFileNoThrow(
        'git',
        ['rev-parse', '--abbrev-ref', 'origin/HEAD'],
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.replace('origin/', '').trim()),
      execFileNoThrow(
        'git',
        ['status', '--short'],
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()),
      execFileNoThrow(
        'git',
        ['log', '--oneline', '-n', '5'],
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()),
      execFileNoThrow(
        'git',
        [
          'log',
          '--oneline',
          '-n',
          '5',
          '--author',
          (await getGitEmail()) || '',
        ],
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()),
    ])
    // Check if status has more than 200 lines
    const statusLines = status.split('\n').length
    const truncatedStatus =
      statusLines > 200
        ? status.split('\n').slice(0, 200).join('\n') +
          '\n... (truncated because there are more than 200 lines. If you need more information, run "git status" using BashTool)'
        : status

    return `This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.\nCurrent branch: ${branch}\n\nMain branch (you will usually use this for PRs): ${mainBranch}\n\nStatus:\n${truncatedStatus || '(clean)'}\n\nRecent commits:\n${log}\n\nYour recent commits:\n${authorLog || '(no recent commits)'}`
  } catch (error) {
    logError(error)
    return null
  }
})

/**
 * This context is prepended to each conversation, and cached for the duration of the conversation.
 */
export const getContext = memoize(
  async (): Promise<{
    [k: string]: string
  }> => {
    const codeStyle = getCodeStyle()
    const projectConfig = getCurrentProjectConfig()
    const dontCrawl = projectConfig.dontCrawlDirectory
    // Quick start mode - skip directory scanning if KODE_QUICK_START is set
    const isQuickStart = process.env.KODE_QUICK_START === 'true'
    
    const [gitStatus, directoryStructure, claudeFiles, readme, projectDocs] =
      await Promise.all([
        getGitStatus(),
        (dontCrawl || isQuickStart) ? Promise.resolve('') : getDirectoryStructure(),
        (dontCrawl || isQuickStart) ? Promise.resolve('') : getClaudeFiles(),
        getReadme(),
        getProjectDocs(),
      ])
    return {
      ...projectConfig.context,
      ...(directoryStructure ? { directoryStructure } : {}),
      ...(gitStatus ? { gitStatus } : {}),
      ...(codeStyle ? { codeStyle } : {}),
      ...(claudeFiles ? { claudeFiles } : {}),
      ...(readme ? { readme } : {}),
      ...(projectDocs ? { projectDocs } : {}),
    }
  },
)

/**
 * Approximate directory structure, to orient Claude. Claude will start with this, then use
 * tools like LS and View to get more information.
 */
// 全局ignore规则缓存
let globalIgnoreParser: IgnoreParser | null = null

/**
 * 加载并缓存ignore规则
 */
export async function loadIgnoreRules(cwd: string): Promise<IgnoreParser> {
  if (!globalIgnoreParser) {
    globalIgnoreParser = new IgnoreParser()
    try {
      await globalIgnoreParser.scanIgnoreFiles(cwd)
    } catch (error) {
      logError(`加载ignore规则失败: ${error}`)
    }
  }
  return globalIgnoreParser
}

/**
 * 刷新全局ignore规则
 */
export async function refreshIgnoreRules(cwd: string): Promise<{
  success: boolean;
  filesScanned: number;
  rulesLoaded: number;
  duration: number;
}> {
  if (!globalIgnoreParser) {
    globalIgnoreParser = new IgnoreParser()
  }
  
  try {
    const result = await globalIgnoreParser.refreshIgnoreRules(cwd)
    
    // 不再在这里输出日志，让调用者来处理日志输出
    // if (result.success) {
    //   console.log(`✅ Ignore规则刷新成功！`)
    //   console.log(`📁 扫描文件: ${result.filesScanned}`)
    //   console.log(`📋 加载规则: ${result.rulesLoaded}`)
    //   console.log(`⏱️  耗时: ${result.duration}ms`)
    // } else {
    //   console.log(`❌ Ignore规则刷新失败`)
    // }
    
    return result
  } catch (error) {
    logError(`刷新ignore规则失败: ${error}`)
    return {
      success: false,
      filesScanned: 0,
      rulesLoaded: 0,
      duration: 0
    }
  }
}

export const getDirectoryStructure = memoize(
  async function (): Promise<string> {
    try {
      const abortController = new AbortController()
      const timeout = setTimeout(() => {
        abortController.abort()
      }, 2_000) // Increased timeout to 2 seconds
      
      try {
        const cwd = getCwd()
        
        // Use the optimized directory traverser
        const { DirectoryTraverser } = await import('./utils/directoryTraverser')
        const traverser = new DirectoryTraverser(cwd)
        
        // Get directory structure with max depth of 3
        const structure = await traverser.getDirectoryStructure(3)
        
        return `Below is a snapshot of this project's file structure at the start of the conversation. This snapshot will NOT update during the conversation.

${structure}`
      } finally {
        clearTimeout(timeout)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Timeout case - return minimal structure instead of empty string
        return `Directory structure scan timed out. This is a large directory - use LS tool to explore specific subdirectories as needed.`
      }
      logError(error)
      return ''
    }
  },
)
