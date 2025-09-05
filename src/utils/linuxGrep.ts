import { execFile } from 'child_process'
import { logError } from './log'
import debug from 'debug'

const d = debug('claude:linuxGrep')

/**
 * 在Linux系统下执行grep命令
 * @param args grep命令参数
 * @param target 搜索目标路径
 * @param abortSignal 中断信号
 * @returns 匹配的文件列表
 */
export async function linuxGrep(
  args: string[],
  target: string,
  abortSignal: AbortSignal,
): Promise<string[]> {
  d('linuxGrep called: %o', args, target)

  return new Promise((resolve) => {
    execFile(
      'grep',
      [...args, target],
      {
        maxBuffer: 1_000_000,
        signal: abortSignal,
        timeout: 10_000,
      },
      (error, stdout) => {
        if (error) {
          // Exit code 1 from grep means "no matches found" - this is normal
          if (error.code !== 1) {
            d('grep error: %o', error)
            logError(error)
          }
          resolve([])
        } else {
          d('grep succeeded with %s', stdout)
          // 处理grep输出，提取文件名
          const files = stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(line => {
              // grep输出格式通常是: filename:line_content
              const colonIndex = line.indexOf(':')
              return colonIndex > 0 ? line.substring(0, colonIndex) : line
            })
            // 去重
            .filter((file, index, self) => self.indexOf(file) === index)
          
          resolve(files)
        }
      },
    )
  })
}