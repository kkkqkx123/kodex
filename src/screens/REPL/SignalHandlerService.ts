import { type ToolUseConfirm, type BinaryFeedbackContext, type ToolJSXState, type CleanupFunction } from '../REPL.types'

export class SignalHandlerService {
  private static instance: SignalHandlerService | null = null
  private cleanupFunctions: CleanupFunction[] = []

  static setupSignalHandling(
    setToolJSX: (jsx: ToolJSXState) => void,
    setToolUseConfirm: (confirm: ToolUseConfirm | null) => void,
    setBinaryFeedbackContext: (context: BinaryFeedbackContext | null) => void,
    isMessageSelectorVisible: boolean,
    setIsMessageSelectorVisible: (visible: boolean) => void,
    toolUseConfirm: ToolUseConfirm | null,
    binaryFeedbackContext: BinaryFeedbackContext | null,
    toolJSX: ToolJSXState,
    setToolJSXLocal: (jsx: ToolJSXState) => void,
    onExit: () => void
  ): CleanupFunction {
    if (SignalHandlerService.instance) {
      return SignalHandlerService.instance.cleanup
    }

    const instance = new SignalHandlerService()
    SignalHandlerService.instance = instance

    return instance.setup(
      setToolJSX,
      setToolUseConfirm,
      setBinaryFeedbackContext,
      isMessageSelectorVisible,
      setIsMessageSelectorVisible,
      toolUseConfirm,
      binaryFeedbackContext,
      toolJSX,
      setToolJSXLocal,
      onExit
    )
  }

  private setup(
    setToolJSX: (jsx: ToolJSXState) => void,
    setToolUseConfirm: (confirm: ToolUseConfirm | null) => void,
    setBinaryFeedbackContext: (context: BinaryFeedbackContext | null) => void,
    isMessageSelectorVisible: boolean,
    setIsMessageSelectorVisible: (visible: boolean) => void,
    toolUseConfirm: ToolUseConfirm | null,
    binaryFeedbackContext: BinaryFeedbackContext | null,
    toolJSX: ToolJSXState,
    setToolJSXLocal: (jsx: ToolJSXState) => void,
    onExit: () => void
  ): CleanupFunction {
    // Handle exit cleanup
    const handleExit = () => {
      setToolJSXLocal(null)
      setToolUseConfirm(null)
      setBinaryFeedbackContext(null)
      setIsMessageSelectorVisible(false)
      onExit()
      
      // Clear the terminal line
      if (process.stdout.isTTY) {
        process.stdout.write('\r\x1b[K')
      }
      // Force a sync flush to ensure the terminal is cleared
      if (process.stdout.write) {
        process.stdout.write('\r\x1b[K')
      }
    }

    // Override process.exit to ensure cleanup
    const originalExit = process.exit
    process.exit = function(code?: number): never {
      handleExit()
      originalExit.call(process, code)
      // This line will never be reached, but TypeScript needs to know the function never returns
      throw new Error('process.exit should never return')
    }

    // Handle SIGINT (Ctrl+C) with double tap logic
    let lastSigintTime = 0
    const sigintDelay = 500 // 500ms delay for double tap
    
    const handleSigint = async () => {
      const now = Date.now()
      
      // Check if we're in a non-main interface (message selector, tool confirm, etc.)
      const isNonMainInterface = isMessageSelectorVisible || toolUseConfirm || binaryFeedbackContext || toolJSX
      
      if (isNonMainInterface) {
        // Non-main interface logic
        if (now - lastSigintTime < sigintDelay) {
          // Double tap - exit non-main interface (equivalent to ESC)
          console.log('\nExiting current interface...')
          if (isMessageSelectorVisible) {
            setIsMessageSelectorVisible(false)
          }
          if (toolUseConfirm) {
            setToolUseConfirm(null)
          }
          if (binaryFeedbackContext) {
            setBinaryFeedbackContext(null)
          }
          if (toolJSX) {
            setToolJSX(null)
          }
          lastSigintTime = 0 // Reset timer
        } else {
          // Single tap - show prompt only
          console.log('\nPress Ctrl+C again to exit')
          lastSigintTime = now
        }
      } else {
        // Main interface logic
        if (now - lastSigintTime < sigintDelay) {
          // Double tap - exit program and terminate all child processes
          console.log('\nExiting program...')
          
          // Import cleanup functions
          const { stopAgentWatcher } = await import('../../utils/agentLoader')
          const { closeAllClients } = await import('../../services/mcpClient')
          const { PersistentShell } = await import('../../utils/PersistentShell')
          
          // Clean up resources before exit
          try {
            // Clean up file watchers
            await stopAgentWatcher().catch(err => {
              console.warn('Failed to stop agent watchers:', err)
            })
            
            // Clean up MCP client connections
            await closeAllClients().catch(err => {
              console.warn('Failed to close MCP clients:', err)
            })
            
            // Close persistent shell
            try {
              PersistentShell.getInstance().close()
            } catch (err) {
              console.warn('Failed to close persistent shell:', err)
            }
            
            // Clean up GC interval if exists
            if (global.gcInterval) {
              clearInterval(global.gcInterval)
              global.gcInterval = null
            }
            
            // Force garbage collection
            if (global.gc) {
              try {
                global.gc()
              } catch (e) {
                // Ignore GC errors
              }
            }
          } catch (error) {
            console.error('Error during cleanup:', error)
          }
          
          // Small delay to ensure UI updates and cleanup
          setTimeout(() => {
            // Force process exit with code 0
            try {
              process.exit(0)
            } catch (e) {
              // If process.exit fails, try more forceful termination
              process.kill(process.pid, 'SIGTERM')
            }
          }, 10)
        } else {
          // Single tap - show prompt only
          console.log('\nPress Ctrl+C again to exit')
          lastSigintTime = now
        }
      }
    }

    process.on('SIGINT', handleSigint)

    const cleanup = () => {
      process.exit = originalExit
      process.off('SIGINT', handleSigint)
      if (process.platform === 'win32' && process.env.PSModulePath) {
        process.off('SIGBREAK', handleSigint)
      }
      SignalHandlerService.instance = null
    }

    this.cleanupFunctions.push(cleanup)
    return cleanup
  }

  private cleanup(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []
  }

  static getInstance(): SignalHandlerService | null {
    return SignalHandlerService.instance
  }
}