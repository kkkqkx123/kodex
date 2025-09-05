import { execFile } from 'child_process'
import { ripgrepPath } from './ripgrep'
import debug from 'debug'

const d = debug('claude:detectGrepTool')

/**
 * 检测系统中可用的grep工具
 * @returns 'ripgrep' | 'grep' | 'powershell' | null
 */
export async function detectGrepTool(): Promise<'ripgrep' | 'grep' | 'powershell' | null> {
  // 首先检查ripgrep是否可用
  try {
    const rgPath = ripgrepPath()
    if (rgPath) {
      // 验证ripgrep是否真的可用
      return new Promise((resolve) => {
        execFile(rgPath, ['--version'], { timeout: 5000 }, (error) => {
          if (error) {
            d('ripgrep not available: %o', error)
            resolve(null)
          } else {
            d('ripgrep is available')
            resolve('ripgrep')
          }
        })
      })
    }
  } catch (e) {
    d('ripgrep detection failed: %o', e)
  }

  // 如果是Linux系统，检查grep是否可用
  if (process.platform === 'linux') {
    return new Promise((resolve) => {
      execFile('grep', ['--version'], { timeout: 5000 }, (error) => {
        if (error) {
          d('grep not available: %o', error)
          resolve(null)
        } else {
          d('grep is available')
          resolve('grep')
        }
      })
    })
  }

  // 如果是Windows系统，检查PowerShell是否可用
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      execFile('powershell.exe', ['-Command', 'Get-Command Get-ChildItem'], { timeout: 5000 }, (error) => {
        if (error) {
          d('PowerShell not available: %o', error)
          resolve(null)
        } else {
          d('PowerShell is available')
          resolve('powershell')
        }
      })
    })
  }

  return null
}