import { Command } from '../commands'
import { getMessagesGetter, getMessagesSetter } from '../messages'
import { createUserMessage } from '../utils/messages'
import { getContext } from '../context'

const lastreq = {
  type: 'local',
  name: 'lastreq',
  description: 'Force interrupt LLM agent, terminate current task, rollback to previous API request, add prompt content to previous context, and automatically reissue API request',
  isEnabled: true,
  isHidden: false,
  async call(args: string, context: any) {
    // Get current messages
    const messages = getMessagesGetter()()
    
    // Find the last API request (user message that is not a command)
    let lastUserMessageIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message?.type === 'user') {
        // Check if this is a regular user message (not a command)
        const content = message.message?.content
        if (content && typeof content === 'string' &&
            !content.startsWith('<command-name>') &&
            !content.startsWith('<bash-input>') &&
            !content.startsWith('<koding-input>')) {
          lastUserMessageIndex = i
          break
        }
      }
    }
    
    if (lastUserMessageIndex === -1) {
      return 'No previous API request found to rollback to.'
    }
    
    // Get the last user message
    const lastUserMessage = messages[lastUserMessageIndex]
    
    // Interrupt current task if there's an abort controller
    if (context.abortController) {
      context.abortController.abort()
    }
    
    // Clear current messages and set messages up to the last user message
    const messagesToKeep = messages.slice(0, lastUserMessageIndex + 1)
    getMessagesSetter()(messagesToKeep)
    
    // Clear context cache
    getContext.cache.clear?.()
    
    // Add the new prompt content to the last user message context
    if (args.trim()) {
      const updatedMessages = [...messagesToKeep]
      // Create a new user message with the additional context
      const newMessage = createUserMessage(`${lastUserMessage?.type === 'user' && typeof lastUserMessage.message?.content === 'string' ? lastUserMessage.message.content : ''}\n\nAdditional context: ${args}`)
      updatedMessages.push(newMessage)
      getMessagesSetter()(updatedMessages)
    }
    
    // Automatically reissue the API request by returning empty string
    // The system will process the updated messages automatically
    return 'Rolled back to previous API request and reissuing with additional context...'
  },
  userFacingName() {
    return 'lastreq'
  },
} satisfies Command

export default lastreq