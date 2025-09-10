import { Command } from '../commands'
import { getMessagesGetter, getMessagesSetter } from '../messages'
import { getContext } from '../context'
import { clearTerminal } from '../utils/terminal'

const lasti = {
  type: 'local',
  name: 'lasti',
  description: 'Force interrupt LLM agent, terminate current task, and rollback to previous user input, wait for user instruction. Clear context.',
  isEnabled: true,
  isHidden: false,
  async call(_, context: any) {
    // Get current messages
    const messages = getMessagesGetter()()
    
    // Find the last user input (user message that is not a command)
    let lastUserInputIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message?.type === 'user') {
        // Check if this is a regular user message (not a command)
        const content = message.message.content
        if (typeof content === 'string' && 
            !content.startsWith('<command-name>') && 
            !content.startsWith('<bash-input>') && 
            !content.startsWith('<koding-input>')) {
          lastUserInputIndex = i
          break
        }
      }
    }
    
    if (lastUserInputIndex === -1) {
      return 'No previous user input found to rollback to.'
    }
    
    // Interrupt current task if there's an abort controller
    if (context.abortController) {
      context.abortController.abort()
    }
    
    // Clear current messages and set messages up to the last user input
    const messagesToKeep = messages.slice(0, lastUserInputIndex + 1)
    getMessagesSetter()(messagesToKeep)
    
    // Clear context cache
    getContext.cache.clear?.()
    
    // Clear terminal display
    await clearTerminal()
    
    return 'Rolled back to previous user input. Context cleared. Waiting for user instruction.'
  },
  userFacingName() {
    return 'lasti'
  },
} satisfies Command

export default lasti