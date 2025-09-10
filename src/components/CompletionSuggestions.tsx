import React, { memo, useMemo, useRef, useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import type { UnifiedSuggestion } from '../hooks/completion/types'
import { useTerminalSize } from '../hooks/useTerminalSize'

interface CompletionSuggestionsProps {
  suggestions: UnifiedSuggestion[]
  selectedIndex: number
  emptyDirMessage: string
  input: string // 添加输入作为key的一部分，确保输入变化时重新挂载
}

// 独立的memoized补全建议组件，避免整个UI重新渲染
export const CompletionSuggestions = memo(function CompletionSuggestions({
  suggestions,
  selectedIndex,
  emptyDirMessage,
  input,
}: CompletionSuggestionsProps) {
  const { rows } = useTerminalSize()
  const prevInputRef = useRef<string>('')
  const [isVisible, setIsVisible] = useState(true)
  const [renderKey, setRenderKey] = useState(0)

  // 强制清除机制：当输入发生上下文变化时，短暂卸载组件
  useEffect(() => {
    const currentPrefix = input.slice(0, 5) // 获取输入前缀
    const prevPrefix = prevInputRef.current.slice(0, 5)
    
    if (currentPrefix !== prevPrefix && prevInputRef.current !== '') {
      // 检测到上下文变化，强制清除
      setIsVisible(false)
      setRenderKey(prev => prev + 1)
      
      // 短暂延迟后重新显示，确保旧的渲染被清除
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 10)
      
      return () => clearTimeout(timer)
    }
    
    prevInputRef.current = input
  }, [input])

  // 当suggestions为空时，立即隐藏
  useEffect(() => {
    if (suggestions.length === 0) {
      setIsVisible(false)
    }
  }, [suggestions])

  // 限制建议数量以适应终端高度
  const limitedSuggestions = useMemo(() => {
    if (suggestions.length === 0) return []
    
    const availableRows = Math.max(1, rows - 4)
    const maxVisible = Math.min(availableRows, suggestions.length)
    return suggestions.slice(0, maxVisible)
  }, [suggestions, rows])

  // 渲染建议列表 - 使用更严格的key来确保正确更新
  const renderedSuggestions = useMemo(() => {
    if (limitedSuggestions.length === 0) return null
    
    return limitedSuggestions.map((suggestion, index) => {
      const isSelected = index === selectedIndex
      const displayText = suggestion.displayValue || suggestion.value
      
      return (
        <Box key={`${input}-${suggestion.value}-${index}`}>
          <Text color={isSelected ? 'cyan' : undefined}>
            {isSelected ? '▸ ' : '  '}
            {displayText}
          </Text>
        </Box>
      )
    })
  }, [limitedSuggestions, selectedIndex, input])

  // 获取操作提示文本
  const operationHint = useMemo(() => {
    const selected = suggestions[selectedIndex]
    if (!selected) {
      return '↑↓ navigate • → accept • Tab cycle • Esc close'
    }
    if (selected.value.endsWith('/')) {
      return '→ enter directory • ↑↓ navigate • Tab cycle • Esc close'
    } else if (selected.type === 'agent') {
      return '→ select agent • ↑↓ navigate • Tab cycle • Esc close'
    } else {
      return '→ insert reference • ↑↓ navigate • Tab cycle • Esc close'
    }
  }, [suggestions, selectedIndex])

  // 强制清除：如果不可见，直接返回null
  if (!isVisible || suggestions.length === 0) {
    return null
  }

  // 使用强制重新渲染的key
  const forceRenderKey = `completion-${renderKey}-${input.slice(0, 8)}-${suggestions.length}`

  return (
    <Box key={forceRenderKey} flexDirection="column">
      <Box flexDirection="column">
        {renderedSuggestions}
        
        {/* 显示溢出指示器 */}
        {suggestions.length > limitedSuggestions.length && (
          <Box marginTop={0}>
            <Text dimColor>
              ... and {suggestions.length - limitedSuggestions.length} more suggestions
            </Text>
          </Box>
        )}

        {/* 简洁操作提示框 */}
        <Box marginTop={1} paddingX={3} borderStyle="round" borderColor="gray">
          <Text 
            dimColor={!emptyDirMessage} 
            color={emptyDirMessage ? "yellow" : undefined}
          >
            {emptyDirMessage || operationHint}
          </Text>
        </Box>
      </Box>
    </Box>
  )
})

// 设置displayName用于调试
CompletionSuggestions.displayName = 'CompletionSuggestions'