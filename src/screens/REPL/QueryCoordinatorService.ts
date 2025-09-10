import { type Message as MessageType, type AssistantMessage, query } from '../../query.js'
import { type QueryContext, type ToolJSXState } from '../REPL.types'
import { getSystemPrompt } from '../../constants/prompts'
import { getContext } from '../../context'
import { getMaxThinkingTokens } from '../../utils/thinking'
import { ModelManager } from '../../utils/model'
import { getGlobalConfig } from '../../utils/config'
import { processUserInput } from '../../utils/messages'
import { getLastAssistantMessageId } from '../../utils/messages'
import { addToHistory } from '../../history'
import { markProjectOnboardingComplete } from '../../ProjectOnboarding.js'
import { handleHashCommand } from '../../commands/terminalSetup'

export class QueryCoordinatorService {
  private static instance: QueryCoordinatorService | null = null

  static getInstance(): QueryCoordinatorService {
    if (!QueryCoordinatorService.instance) {
      QueryCoordinatorService.instance = new QueryCoordinatorService()
    }
    return QueryCoordinatorService.instance
  }

  async executeQuery(
    newMessages: MessageType[],
    context: QueryContext,
    currentMessages: MessageType[],
    setMessages: (messages: MessageType[]) => void,
    setLoading: (loading: boolean) => void,
    setAbortController: (controller: AbortController | null) => void,
    setToolJSX: (jsx: ToolJSXState) => void,
    getBinaryFeedbackResponse: (m1: AssistantMessage, m2: AssistantMessage) => Promise<any>,
    abortController?: AbortController
  ): Promise<void> {
    let allMessages = [...currentMessages, ...newMessages]
    // Use passed AbortController or create new one
    const controllerToUse = abortController || new AbortController()
    if (!abortController) {
      setAbortController(controllerToUse)
    }

    // Check if this is a Koding request based on last message's options
    const isKodingRequest =
      newMessages.length > 0 &&
      newMessages[0].type === 'user' &&
      'options' in newMessages[0] &&
      newMessages[0].options?.isKodingRequest === true
    setMessages(allMessages)

    // Mark onboarding as complete when any user message is sent to Claude
    markProjectOnboardingComplete()

    // The last message is an assistant message if the user input was a bash command,
    // or if the user input was an invalid slash command.
    const lastMessage = newMessages[newMessages.length - 1]!

    if (lastMessage.type === 'assistant') {
      setAbortController(null)
      setLoading(false)
      return
    }

    const [systemPrompt, appContext, model, maxThinkingTokens] =
      await Promise.all([
        getSystemPrompt(),
        getContext(),
        new ModelManager(getGlobalConfig()).getModelName('main'),
        getMaxThinkingTokens([...currentMessages, lastMessage]),
      ])

    let lastAssistantMessage: MessageType | null = null

    // query the API
    for await (const message of query(
      [...currentMessages, lastMessage],
      systemPrompt,
      appContext,
      // canUseTool function would be passed in
      (toolName, input, onConfirm, onAbort) => {
        // This would be handled by the permission system
        return Promise.resolve({ result: true })
      },
      {
        options: {
          ...context,
          maxThinkingTokens,
          safeMode: context.safeMode ?? false,
          // If this came from Koding mode, pass that along
          isKodingRequest: isKodingRequest || undefined,
        },
        messageId: getLastAssistantMessageId([...currentMessages, lastMessage]),
        readFileTimestamps: {}, // This would be passed in from the component
        abortController: controllerToUse,
        setToolJSX,
      },
      getBinaryFeedbackResponse,
    )) {
      allMessages = [...allMessages, message]
      setMessages(allMessages)

      // Keep track of the last assistant message for Koding mode
      if (message.type === 'assistant') {
        lastAssistantMessage = message
      }
    }

    // If this was a Koding request and we got an assistant message back,
    // save it to AGENTS.md (and CLAUDE.md if exists)
    if (
      isKodingRequest &&
      lastAssistantMessage &&
      lastAssistantMessage.type === 'assistant'
    ) {
      await this.handleKodingMode(lastAssistantMessage)
    }

    setLoading(false)
  }

  async processUserInput(
    input: string,
    mode: 'bash' | 'prompt' | 'koding',
    setToolJSX: (jsx: ToolJSXState) => void,
    options: {
      commands: any[]
      forkNumber: number
      messageLogName: string
      tools: any[]
      verbose: boolean
      maxThinkingTokens: number
    },
    messageId: string | null,
    setForkConvoWithMessagesOnTheNextRender: (messages: MessageType[] | null) => void,
    readFileTimestamps: { [filename: string]: number },
    abortController: AbortController
  ): Promise<MessageType[]> {
    return await processUserInput(
      input,
      mode,
      setToolJSX,
      {
        abortController,
        options,
        messageId,
        setForkConvoWithMessagesOnTheNextRender,
        readFileTimestamps,
      },
      null,
    )
  }

  private async handleKodingMode(lastAssistantMessage: AssistantMessage): Promise<void> {
    try {
      const content =
        typeof lastAssistantMessage.message.content === 'string'
          ? lastAssistantMessage.message.content
          : lastAssistantMessage.message.content
            .filter(block => block.type === 'text')
            .map(block => (block.type === 'text' ? block.text : ''))
            .join('\n')

      // Add the content to AGENTS.md (and CLAUDE.md if exists)
      if (content && content.trim().length > 0) {
        handleHashCommand(content)
      }
    } catch (error) {
      console.error('Error saving response to project docs:', error)
    }
  }

  async handleInitialPrompt(
    initialPrompt: string,
    commands: any[],
    forkNumber: number,
    messageLogName: string,
    tools: any[],
    verbose: boolean,
    currentMessages: MessageType[],
    setMessages: (messages: MessageType[]) => void,
    setLoading: (loading: boolean) => void,
    setAbortController: (controller: AbortController | null) => void,
    setToolJSX: (jsx: ToolJSXState) => void,
    setForkConvoWithMessagesOnTheNextRender: (messages: MessageType[] | null) => void,
    readFileTimestamps: { [filename: string]: number },
    getBinaryFeedbackResponse: (m1: AssistantMessage, m2: AssistantMessage) => Promise<any>
  ): Promise<void> {
    let allMessages = [...currentMessages]
    if (!initialPrompt) {
      return
    }

    setLoading(true)

    const newAbortController = new AbortController()
    setAbortController(newAbortController)

    // Force fresh config read to ensure model switching works
    const model = new ModelManager(getGlobalConfig()).getModelName('main')
    const newMessages = await this.processUserInput(
      initialPrompt,
      'prompt',
      setToolJSX,
      {
        commands,
        forkNumber,
        messageLogName,
        tools,
        verbose,
        maxThinkingTokens: 0,
      },
      getLastAssistantMessageId(currentMessages),
      setForkConvoWithMessagesOnTheNextRender,
      readFileTimestamps,
      newAbortController,
    )

    if (newMessages.length) {
      for (const message of newMessages) {
        if (message.type === 'user') {
          addToHistory(initialPrompt)
          // TODO: setHistoryIndex
        }
      }
      setMessages(allMessages)

      // The last message is an assistant message if the user input was a bash command,
      // or if the user input was an invalid slash command.
      const lastMessage = newMessages[newMessages.length - 1]!
      if (lastMessage.type === 'assistant') {
        setAbortController(null)
        setLoading(false)
        return
      }

      const [systemPrompt, context, model, maxThinkingTokens] =
        await Promise.all([
          getSystemPrompt(),
          getContext(),
          new ModelManager(getGlobalConfig()).getModelName('main'),
          getMaxThinkingTokens([...currentMessages, ...newMessages]),
        ])

      for await (const message of query(
        [...currentMessages, ...newMessages],
        systemPrompt,
        context,
        // canUseTool function would be passed in
        (toolName, input, onConfirm, onAbort) => {
          // This would be handled by the permission system
          return Promise.resolve({ result: true })
        },
        {
          options: {
            commands,
            forkNumber,
            messageLogName,
            tools,
            verbose,
            safeMode: false, // This would be passed in
            maxThinkingTokens,
          },
          messageId: getLastAssistantMessageId([...currentMessages, ...newMessages]),
          readFileTimestamps,
          abortController: newAbortController,
          setToolJSX,
        },
        getBinaryFeedbackResponse,
      )) {
        allMessages = [...allMessages, message]
        setMessages(allMessages)
      }
    } else {
      addToHistory(initialPrompt)
      // TODO: setHistoryIndex
    }

    // Fix: Clean up state after onInit completion
    setLoading(false)
    setAbortController(null)
  }
}