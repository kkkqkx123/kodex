import { safeParseJSON } from './json'
import { logError } from './log'
import { queryQuick } from '../services/claude'
import React from 'react'

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
      // 如果有Ink实例，使用其clear方法并强制重新渲染
      if (global.inkInstance) {
        global.inkInstance.clear()
        // 强制重新渲染空白内容来清除Static组件
        global.inkInstance.rerender(React.createElement('div', {}))
      }
      
      // Windows需要特殊处理
      if (process.platform === 'win32') {
        // Windows使用cls命令
        const { exec } = require('child_process')
        exec('cls', (error: any) => {
          if (error) {
            // 如果cls失败，使用ANSI序列
            process.stdout.write('\x1b[2J\x1b[3J\x1b[H', () => {
              // 再次清理确保完全清除
              if (global.inkInstance) {
                global.inkInstance.clear()
                global.inkInstance.rerender(React.createElement('div', {}))
              }
              setTimeout(resolve, 50)
            })
          } else {
            // cls成功后再次清理Ink
            if (global.inkInstance) {
              global.inkInstance.clear()
              global.inkInstance.rerender(React.createElement('div', {}))
            }
            setTimeout(resolve, 50)
          }
        })
      } else {
        // Unix-like系统使用ANSI转义序列
        const clearSequence = '\x1b[2J\x1b[3J\x1b[H'
        process.stdout.write(clearSequence, () => {
          // 清理后再次清理Ink
          if (global.inkInstance) {
            global.inkInstance.clear()
            global.inkInstance.rerender(React.createElement('div', {}))
          }
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
      // 如果有Ink实例，使用其clear方法并强制重新渲染
      if (global.inkInstance) {
        global.inkInstance.clear()
        global.inkInstance.rerender(React.createElement('div', {}))
        
        // 尝试卸载并重新创建实例
        try {
          global.inkInstance.unmount()
          global.inkInstance = null
        } catch (e) {
          // 卸载失败，继续使用clear方法
        }
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
      // 如果有Ink实例，使用其clear方法并强制重新渲染
      if (global.inkInstance) {
        global.inkInstance.clear()
        global.inkInstance.rerender(React.createElement('div', {}))
        
        // 尝试卸载并重新创建实例
        try {
          global.inkInstance.unmount()
          global.inkInstance = null
        } catch (e) {
          // 卸载失败，继续使用clear方法
        }
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

/**
 * 完全清理终端和Ink渲染，确保所有旧内容被删除
 * 这个方法结合了终端清理和Ink渲染清理，专门解决UI残留问题
 */
export async function completeTerminalCleanup(): Promise<void> {
  try {
    // 1. 清理Ink实例 - 更激进的清理策略
    if (global.inkInstance) {
      // 强制重新渲染空白内容多次，确保Static组件被清理
      for (let i = 0; i < 3; i++) {
        global.inkInstance.rerender(React.createElement('div', {}))
        await new Promise(resolve => setTimeout(resolve, 20))
      }
      
      // 清理终端多次
      for (let i = 0; i < 2; i++) {
        global.inkInstance.clear()
        await new Promise(resolve => setTimeout(resolve, 20))
      }
      
      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 尝试卸载实例
      try {
        global.inkInstance.unmount()
        global.inkInstance = null
      } catch (e) {
        // 卸载失败，继续使用clear方法
        console.warn('Failed to unmount ink instance:', e)
      }
    }
    
    // 2. 执行终端清理 - 针对大量内容的特殊处理
    await resetTerminal()
    
    // 3. 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc()
    }
    
    // 4. 额外的终端缓冲区清理
    if (process.stdout.isTTY) {
      // 清除可能的滚动缓冲区残留
      process.stdout.write('\r\x1b[K')
    }
    
  } catch (error) {
    console.error('Error during complete terminal cleanup:', error)
    throw error
  }
}

/**
 * 超激进的终端清理 - 专门用于处理大量内容和Static组件残留
 * 这个方法使用所有可能的清理策略
 */
export async function ultraTerminalCleanup(): Promise<void> {
  try {
    console.log('🧹 执行超激进清理...')
    
    // 1. 完全清理Ink环境
    await completeTerminalCleanup()
    
    // 2. 强制终端重置
    if (process.platform === 'win32') {
      const { exec } = require('child_process')
      
      // 使用Windows特定的清理命令
      await new Promise<void>((resolve, reject) => {
        exec('cls', (error: any) => {
          if (error) {
            // 如果cls失败，使用终极ANSI序列
            const ultimateSequence = [
              '\x1b[2J\x1b[3J\x1b[H', // 标准清除
              '\x1b[!p', // 软重置终端
              '\x1b[0m', // 重置所有属性
              '\x1b[?1049l', // 恢复主屏幕
              '\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m\x1b[?1049l', // 终极序列
            ].join('')
            process.stdout.write(ultimateSequence, () => {
              setTimeout(resolve, 200)
            })
          } else {
            setTimeout(resolve, 100)
          }
        })
      })
    } else {
      // Unix系统的终极清理序列
      const ultimateSequence = [
        '\x1b[2J\x1b[3J\x1b[H', // 清除屏幕和缓冲区
        '\x1b[!p', // 软重置终端
        '\x1b[0m', // 重置所有属性
        '\x1b[?1049l', // 恢复主屏幕
        '\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m\x1b[?1049l\x1b[2J\x1b[3J\x1b[H', // 多次清理
      ].join('')
      
      process.stdout.write(ultimateSequence)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // 3. 确保完全清理
    await new Promise(resolve => setTimeout(resolve, 100))
    
  } catch (error) {
    console.error('Error during ultra terminal cleanup:', error)
    throw error
  }
}

/**
 * 创建新的Ink渲染实例，用于替换旧的实例
 * 这个方法确保在清理后能够重新创建干净的渲染环境
 */
export async function recreateInkInstance(): Promise<void> {
  try {
    // 先完全清理现有实例
    await completeTerminalCleanup()
    
    // 重置全局变量
    global.inkInstance = null
    
    // 等待系统清理
    await new Promise(resolve => setTimeout(resolve, 100))
    
  } catch (error) {
    console.error('Error recreating ink instance:', error)
    throw error
  }
}
