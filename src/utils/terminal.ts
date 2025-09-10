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
 * 简化后的终端清理函数 - 仅使用ink的内置清理机制
 * 移除了所有复杂的系统命令和ansi转义序列
 */
export function clearTerminal(): Promise<void> {
  return new Promise((resolve) => {
    try {
      // 仅使用ink的清理机制
      if (global.inkInstance) {
        global.inkInstance.clear()
        // 强制重新渲染空白内容
        global.inkInstance.rerender(React.createElement('div', {}))
      }
      
      // 简单的延迟确保清理完成
      setTimeout(resolve, 50)
    } catch (error) {
      console.error('Error clearing terminal:', error)
      resolve() // 即使出错也继续执行
    }
  })
}

/**
 * 完全清理终端 - 用于需要彻底清理的场景
 * 仍然只使用ink的机制，但增加了额外的清理步骤
 */
export async function completeTerminalCleanup(): Promise<void> {
  try {
    if (global.inkInstance) {
      // 多次清理确保完全清除
      for (let i = 0; i < 3; i++) {
        global.inkInstance.clear()
        global.inkInstance.rerender(React.createElement('div', {}))
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    // 等待清理完成
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    console.error('Error during terminal cleanup:', error)
  }
}

/**
 * 定期清理终端 - 防止内存累积和UI重复
 */
export function schedulePeriodicCleanup(): () => void {
  let cleanupCount = 0
  const maxCleanups = 10 // 限制清理次数
  
  const cleanup = async () => {
    if (cleanupCount >= maxCleanups) return
    
    try {
      await completeTerminalCleanup()
      cleanupCount++
    } catch (error) {
      console.error('Scheduled cleanup error:', error)
    }
  }
  
  // 每30秒清理一次
  const interval = setInterval(cleanup, 30000)
  
  // 返回清理函数
  return () => {
    clearInterval(interval)
  }
}

// 移除所有其他复杂的清理函数，只保留这两个基本的
