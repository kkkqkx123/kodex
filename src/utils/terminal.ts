import { safeParseJSON } from './json'
import { logError } from './log'
import { queryQuick } from '../services/claude'

declare global {
  var inkInstance: import('ink').Instance | null
}

export function setTerminalTitle(title: string): void {
  if (process.platform === 'win32') {
    process.title = title ? `✳ ${title}` : title
  } else {
    process.stdout.write(`\x1b]0;${title ? `✳ ${title}` : ''}\x07`)
  }
}

export async function updateTerminalTitle(message: string): Promise<void> {
  try {
    const result = await queryQuick({
      systemPrompt: [
        "Analyze if this message indicates a new conversation topic. If it does, extract a 2-3 word title that captures the new topic. Format your response as a JSON object with two fields: 'isNewTopic' (boolean) and 'title' (string, or null if isNewTopic is false). Only include these fields, no other text.",
      ],
      userPrompt: message,
      enablePromptCaching: true,
    })

    const content = result.message.content
      .filter(_ => _.type === 'text')
      .map(_ => _.text)
      .join('')

    const response = safeParseJSON(content)
    if (
      response &&
      typeof response === 'object' &&
      'isNewTopic' in response &&
      'title' in response
    ) {
      if (response.isNewTopic && response.title) {
        setTerminalTitle(response.title as string)
      }
    }
  } catch (error) {
    logError(error)
  }
}

/**
 * 清除终端内容，包括屏幕和滚动缓冲区
 * 使用标准的ANSI转义序列来确保跨终端兼容性
 * 特别处理Ink Static组件的内容
 */
export function clearTerminal(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 如果有Ink实例，使用其clear方法
      if (global.inkInstance) {
        global.inkInstance.clear()
      }
      
      // Windows需要特殊处理
      if (process.platform === 'win32') {
        // Windows使用cls命令
        const { exec } = require('child_process')
        exec('cls', (error: any) => {
          if (error) {
            // 如果cls失败，使用ANSI序列
            process.stdout.write('\x1b[2J\x1b[3J\x1b[H', () => resolve())
          } else {
            resolve()
          }
        })
      } else {
        // Unix-like系统使用ANSI转义序列
        const clearSequence = '\x1b[2J\x1b[3J\x1b[H'
        process.stdout.write(clearSequence, () => {
          setTimeout(resolve, 50) // 给终端一些处理时间
        })
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 强制清除终端，包括所有可能的缓冲区内容
 * 这个方法使用更激进的清理策略来处理顽固的终端内容
 */
export function forceClearTerminal(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 如果有Ink实例，使用其clear方法
      if (global.inkInstance) {
        global.inkInstance.clear()
      }
      
      // Windows需要特殊处理
      if (process.platform === 'win32') {
        const { exec } = require('child_process')
        
        // 使用更激进的清除序列
        const aggressiveSequence = [
          '\x1b[2J\x1b[3J\x1b[H', // 标准清除
          '\x1b[!p', // 软重置终端
          '\x1b[0m', // 重置所有属性
        ].join('')
        
        process.stdout.write(aggressiveSequence, () => {
          // 尝试使用cls命令
          exec('cls', (error: any) => {
            if (error) {
              // 如果cls失败，使用更激进的ANSI序列
              process.stdout.write('\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m', () => {
                setTimeout(resolve, 100)
              })
            } else {
              setTimeout(resolve, 100)
            }
          })
        })
      } else {
        // Unix-like系统使用更激进的ANSI序列
        const aggressiveSequence = '\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m'
        process.stdout.write(aggressiveSequence, () => {
          setTimeout(resolve, 100)
        })
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 清除终端并重置终端状态
 * 这个方法不仅清除内容，还尝试重置终端到初始状态
 */
export function resetTerminal(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 如果有Ink实例，使用其clear方法
      if (global.inkInstance) {
        global.inkInstance.clear()
      }
      
      // Windows需要特殊处理
      if (process.platform === 'win32') {
        const { exec } = require('child_process')
        
        // 使用完整的重置序列
        const resetSequence = [
          '\x1b[2J\x1b[3J\x1b[H', // 清除屏幕和缓冲区
          '\x1b[!p', // 软重置终端
          '\x1b[0m', // 重置所有属性
          '\x1b[?1049l', // 恢复主屏幕
        ].join('')
        
        process.stdout.write(resetSequence, () => {
          // 尝试使用cls命令
          exec('cls', (error: any) => {
            if (error) {
              // 如果cls失败，使用更完整的重置序列
              process.stdout.write('\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m\x1b[?1049l', () => {
                setTimeout(resolve, 150)
              })
            } else {
              setTimeout(resolve, 150)
            }
          })
        })
      } else {
        // Unix-like系统使用完整的重置序列
        const resetSequence = [
          '\x1b[2J\x1b[3J\x1b[H', // 清除屏幕和缓冲区
          '\x1b[!p', // 软重置终端
          '\x1b[0m', // 重置所有属性
          '\x1b[?1049l', // 恢复主屏幕
        ].join('')
        
        process.stdout.write(resetSequence, () => {
          setTimeout(resolve, 150)
        })
      }
    } catch (error) {
      reject(error)
    }
  })
}
