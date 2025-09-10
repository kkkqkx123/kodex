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
  return new Promise(resolve => {
    // 如果有Ink实例，使用其clear方法
    if (global.inkInstance) {
      global.inkInstance.clear()
    }
    
    // 多次发送清除命令以确保Static组件内容被完全清除
    const clearSequence = [
      '\x1b[2J', // 清除屏幕
      '\x1b[3J', // 清除滚动缓冲区
      '\x1b[H',  // 光标归位
      '\x1b[2J\x1b[3J\x1b[H', // 再次清除
    ].join('')
    
    process.stdout.write(clearSequence, () => {
      // 额外发送一些换行符来确保缓冲区被刷新
      process.stdout.write('\n\n\n\n\n', () => {
        // 最后发送光标归位命令
        process.stdout.write('\x1b[H', () => {
          resolve()
        })
      })
    })
  })
}

/**
 * 强制清除终端，包括所有可能的缓冲区内容
 * 这个方法使用更激进的清理策略来处理顽固的终端内容
 */
export function forceClearTerminal(): Promise<void> {
  return new Promise(resolve => {
    // 如果有Ink实例，使用其clear方法
    if (global.inkInstance) {
      global.inkInstance.clear()
    }
    
    // 使用多重ANSI转义序列进行彻底清理
    // 多次发送清除命令以确保可靠性
    const clearSequence = [
      '\x1b[2J', // 清除屏幕
      '\x1b[3J', // 清除滚动缓冲区
      '\x1b[H',  // 光标归位
      '\x1b[2J\x1b[3J\x1b[H', // 再次清除
    ].join('')
    
    process.stdout.write(clearSequence, () => {
      // 额外发送一些换行符来确保缓冲区被刷新
      process.stdout.write('\n\n\n\n\n', () => {
        // 最后发送光标归位命令
        process.stdout.write('\x1b[H', () => {
          resolve()
        })
      })
    })
  })
}

/**
 * 清除终端并重置终端状态
 * 这个方法不仅清除内容，还尝试重置终端到初始状态
 */
export function resetTerminal(): Promise<void> {
  return new Promise(resolve => {
    // 如果有Ink实例，使用其clear方法
    if (global.inkInstance) {
      global.inkInstance.clear()
    }
    
    // 使用重置序列：清除屏幕 + 重置属性 + 光标归位
    const resetSequence = [
      '\x1b[2J', // 清除屏幕
      '\x1b[3J', // 清除滚动缓冲区
      '\x1b[0m', // 重置所有属性（颜色、样式等）
      '\x1b[H'   // 光标归位
    ].join('')
    
    process.stdout.write(resetSequence, () => {
      resolve()
    })
  })
}
