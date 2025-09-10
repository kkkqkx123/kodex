import { execFile } from 'child_process'
import { logError } from './log'
import debug from 'debug'

const d = debug('claude:windowsGrep')

/**
 * 在Windows系统下通过PowerShell执行类似grep的功能
 * @param args 类似grep的参数
 * @param target 搜索目标路径
 * @param abortSignal 中断信号
 * @returns 匹配的文件列表
 */
export async function windowsGrep(
  args: string[],
  target: string,
  abortSignal: AbortSignal,
): Promise<string[]> {
  d('windowsGrep called: %o', args, target)

  // 解析grep参数
  let pattern = ''
  let includePattern = '*'
  let lineNumbers = false
  
  // 简单解析参数，提取搜索模式和文件模式
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '-l' || arg === '--files-with-matches') {
      // 只列出匹配的文件，这是默认行为
      continue
    } else if (arg === '-n' || arg === '--line-number') {
      lineNumbers = true
    } else if (arg.startsWith('--glob') || arg.startsWith('-g')) {
      // 处理文件模式
      if (arg.includes('=')) {
        includePattern = arg.split('=')[1]
      } else if (i + 1 < args.length) {
        includePattern = args[++i]
      }
    } else if (!arg.startsWith('-')) {
      // 搜索模式
      pattern = arg
    }
  }

  // 构建PowerShell命令
  // 使用Get-ChildItem递归查找文件，然后使用Select-String搜索内容
  const psCommand = [
    'Get-ChildItem',
    `-Path "${target}"`,
    `-Include "${includePattern}"`,
    '-Recurse',
    '|',
    'Select-String',
    `-Pattern "${pattern}"`,
    '|',
    'Select-Object',
    '-Unique',
    'FileName'
  ].join(' ')

  const psArgs = [
    '-Command',
    psCommand
  ]

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      psArgs,
      {
        maxBuffer: 1_000_000,
        signal: abortSignal,
        timeout: 10_000,
      },
      (error, stdout) => {
        if (error) {
          d('PowerShell grep error: %o', error)
          logError(error)
          resolve([])
        } else {
          d('PowerShell grep succeeded with %s', stdout)
          // 处理PowerShell输出，提取文件名
          const files = stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(line => line.trim())
          
          resolve(files)
        }
      },
    )
  })
}