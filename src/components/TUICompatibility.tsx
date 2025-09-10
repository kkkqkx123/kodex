import React, { useState, useEffect } from 'react'
import { useTerminalSize } from '../hooks/useTerminalSize'
import { Box, Text } from 'ink'
import { getTheme } from '../utils/theme'

// Terminal capabilities detection
export interface TerminalCapabilities {
  supportsColor: boolean
  supportsUnicode: boolean
  supportsMouse: boolean
  supportsHyperlinks: boolean
  columns: number
  rows: number
  isTTY: boolean
  platform: string
}

// Default capabilities for unknown terminals
const defaultCapabilities: TerminalCapabilities = {
  supportsColor: true,
  supportsUnicode: true,
  supportsMouse: false,
  supportsHyperlinks: false,
  columns: 80,
  rows: 24,
  isTTY: true,
  platform: 'unknown'
}

// Hook to detect terminal capabilities
export function useTerminalCapabilities(): TerminalCapabilities {
  const [capabilities, setCapabilities] = useState<TerminalCapabilities>(defaultCapabilities)

  const terminalSize = useTerminalSize()

  useEffect(() => {
    // Detect terminal capabilities
    const detectCapabilities = (): TerminalCapabilities => {
      // Check if we're in a TTY environment
      const isTTY = process.stdout.isTTY && process.stderr.isTTY
      
      // Basic color support detection
      const supportsColor = process.env.COLORTERM !== undefined || 
                           process.env.TERM?.includes('color') || 
                           process.env.TERM === 'xterm-256color'
      
      // Unicode support detection
      const supportsUnicode = process.env.LANG?.includes('UTF') || 
                             process.env.LC_CTYPE?.includes('UTF') ||
                             process.env.TERM?.includes('unicode')
      
      // Mouse support detection
      const supportsMouse = isTTY && (
        process.env.TERM_PROGRAM === 'vscode' ||
        process.env.TERM_PROGRAM === 'iTerm.app' ||
        process.env.TERM === 'xterm' ||
        process.env.TERM === 'xterm-256color'
      )
      
      // Hyperlink support detection
      const supportsHyperlinks = process.env.TERM_PROGRAM === 'iTerm.app' ||
                                 (isTTY && process.env.TERM?.includes('xterm'))
      
      // Platform detection
      const platform = process.platform || 'unknown'
      
      return {
        supportsColor,
        supportsUnicode,
        supportsMouse,
        supportsHyperlinks,
        columns: terminalSize.columns,
        rows: terminalSize.rows,
        isTTY,
        platform
      }
    }

    setCapabilities(detectCapabilities())
  }, [terminalSize.columns, terminalSize.rows])

  return capabilities
}

// Fallback characters for terminals without Unicode support
export const fallbackChars = {
  // Progress bar characters
  progressFilled: '#',
  progressEmpty: '-',
  
  // Status icons
  running: '>',
  completed: 'V',
  failed: 'X',
  cancelled: 'O',
  pending: 'o',
  
  // UI elements
  borderVertical: '|',
  borderHorizontal: '-',
  borderCornerTL: '+',
  borderCornerTR: '+',
  borderCornerBL: '+',
  borderCornerBR: '+',
  
  // Notification icons
  info: 'i',
  success: '+',
  warning: '!',
  error: '!',
  action: '>'
}

// Hook to get appropriate characters based on terminal capabilities
export function useTerminalChars() {
  const capabilities = useTerminalCapabilities()
  
  return {
    // Progress bar characters
    progressFilled: capabilities.supportsUnicode ? '█' : fallbackChars.progressFilled,
    progressEmpty: capabilities.supportsUnicode ? '░' : fallbackChars.progressEmpty,
    
    // Status icons
    running: capabilities.supportsUnicode ? '▶' : fallbackChars.running,
    completed: capabilities.supportsUnicode ? '✓' : fallbackChars.completed,
    failed: capabilities.supportsUnicode ? '✗' : fallbackChars.failed,
    cancelled: capabilities.supportsUnicode ? '⊘' : fallbackChars.cancelled,
    pending: capabilities.supportsUnicode ? '○' : fallbackChars.pending,
    
    // UI elements
    borderVertical: capabilities.supportsUnicode ? '│' : fallbackChars.borderVertical,
    borderHorizontal: capabilities.supportsUnicode ? '─' : fallbackChars.borderHorizontal,
    borderCornerTL: capabilities.supportsUnicode ? '╭' : fallbackChars.borderCornerTL,
    borderCornerTR: capabilities.supportsUnicode ? '╮' : fallbackChars.borderCornerTR,
    borderCornerBL: capabilities.supportsUnicode ? '╰' : fallbackChars.borderCornerBL,
    borderCornerBR: capabilities.supportsUnicode ? '╯' : fallbackChars.borderCornerBR,
    
    // Notification icons
    info: capabilities.supportsUnicode ? 'ℹ' : fallbackChars.info,
    success: capabilities.supportsUnicode ? '✓' : fallbackChars.success,
    warning: capabilities.supportsUnicode ? '⚠' : fallbackChars.warning,
    error: capabilities.supportsUnicode ? '✗' : fallbackChars.error,
    action: capabilities.supportsUnicode ? '→' : fallbackChars.action
  }
}

// Hook to get responsive layout parameters based on terminal size
export function useResponsiveLayout() {
  const capabilities = useTerminalCapabilities()
  const terminalSize = useTerminalSize()
  
  const getLayoutParams = () => {
    const { columns, rows } = terminalSize
    
    // Adjust layout based on terminal size
    const isSmall = columns < 60 || rows < 20
    const isMedium = columns >= 60 && columns < 100 && rows >= 20 && rows < 30
    const isLarge = columns >= 100 && rows >= 30
    
    return {
      isSmall,
      isMedium,
      isLarge,
      maxVisibleTasks: isSmall ? 2 : isMedium ? 3 : 5,
      compactMode: isSmall,
      showDetails: !isSmall,
      showControls: !isSmall,
      maxNotificationWidth: isSmall ? columns - 10 : columns - 20,
      maxErrorWidth: isSmall ? columns - 10 : columns - 20,
      truncateLength: isSmall ? 20 : isMedium ? 40 : 60
    }
  }
  
  const [layoutParams, setLayoutParams] = useState(getLayoutParams())
  
  useEffect(() => {
    setLayoutParams(getLayoutParams())
  }, [terminalSize.columns, terminalSize.rows])
  
  return layoutParams
}

// Component to display terminal compatibility warnings
interface TUICompatibilityWarningProps {
  capabilities: TerminalCapabilities
}

export function TUICompatibilityWarning({ capabilities }: TUICompatibilityWarningProps) {
  const theme = getTheme()
  
  const warnings = []
  
  if (!capabilities.supportsColor) {
    warnings.push('This terminal does not support colors. Some UI elements may not display correctly.')
  }
  
  if (!capabilities.supportsUnicode) {
    warnings.push('This terminal does not support Unicode characters. Some icons may not display correctly.')
  }
  
  if (!capabilities.supportsMouse) {
    warnings.push('This terminal does not support mouse interactions. Click events will not work.')
  }
  
  if (warnings.length === 0) {
    return null
  }
  
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.warning} padding={1} marginBottom={1}>
      <Text color={theme.warning} bold={true}>Terminal Compatibility Warning</Text>
      {warnings.map((warning, index) => (
        <Text color={theme.secondaryText}>
          • {warning}
        </Text>
      ))}
      <Box flexDirection="row" justifyContent="flex-end" marginTop={1}>
        <Text color={theme.secondaryText} dimColor={true}>
          Terminal: {capabilities.columns}x{capabilities.rows} {capabilities.platform}
        </Text>
      </Box>
    </Box>
  )
}

// Hook to provide TUI compatibility utilities
export function useTUICompatibility() {
  const capabilities = useTerminalCapabilities()
  const chars = useTerminalChars()
  const layout = useResponsiveLayout()
  
  return {
    capabilities,
    chars,
    layout,
    // Utility function to truncate text based on terminal width
    truncateText: (text: string, maxLength?: number) => {
      const maxLen = maxLength || layout.truncateLength
      if (text.length <= maxLen) return text
      return text.substring(0, maxLen - 3) + '...'
    },
    // Utility function to check if we should show a component based on layout
    shouldShow: (componentType: 'details' | 'controls' | 'notifications' | 'errors') => {
      switch (componentType) {
        case 'details':
          return layout.showDetails
        case 'controls':
          return layout.showControls
        case 'notifications':
        case 'errors':
          return true // Always show notifications and errors
        default:
          return true
      }
    }
  }
}