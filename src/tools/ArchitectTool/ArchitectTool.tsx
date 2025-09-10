import type { TextBlock } from '@anthropic-ai/sdk/resources/index.mjs'
import { Box } from 'ink'
import * as React from 'react'
import { z } from 'zod'
import type { Tool, ToolUseContext } from '../../Tool' // Removed ExtendedToolUseContext from here
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage'
import { HighlightedCode } from '../../components/HighlightedCode'
import { getContext } from '../../context'
import { Message, query } from '../../query' // query and Message are from here
import { lastX } from '../../utils/generators'
import { createUserMessage } from '../../utils/messages'
import { BashTool } from '../BashTool/BashTool'
// Removed FileReadTool and FileWriteTool due to type incompatibility
import { GlobTool } from '../GlobTool/GlobTool'
import { GrepTool } from '../GrepTool/GrepTool'
import { LSTool } from '../LsTool/lsTool'
import { ARCHITECT_SYSTEM_PROMPT, DESCRIPTION } from './prompt'
import { hasPermissionsToUseTool } from '../../permissions'

// Local definition to match src/query.ts's ExtendedToolUseContext
// This is necessary because src/query.ts's ExtendedToolUseContext is not exported
// and differs significantly from src/Tool.ts's ExtendedToolUseContext.
interface ExtendedToolUseContextForQuery extends ToolUseContext {
  options: {
    commands: any[];
    forkNumber: number;
    messageLogName: string;
    tools: Tool[];
    verbose: boolean;
    safeMode: boolean;
    maxThinkingTokens: number;
    isKodingRequest?: boolean;
    model?: string; // Simplified for this local type to avoid extra import, string is compatible
    slowAndCapableModel?: string;
    kodingContext?: string;
    isCustomCommand?: boolean;
  };
  setToolJSX: (jsx: any) => void;
  requestId?: string;
}

// Filter out tools that have incompatible renderResultForAssistant signatures or are not primarily text-based,
// as ArchitectTool is designed to process text outputs for its reasoning.
const FS_EXPLORATION_TOOLS: Tool[] = [
  BashTool,
  LSTool,
  GlobTool,
  GrepTool,
]

const inputSchema = z.strictObject({
  prompt: z
    .string()
    .describe('The technical request or coding task to analyze'),
  context: z
    .string()
    .describe('Optional context from previous conversation or system state')
    .optional(),
})

export const ArchitectTool = {
  name: 'Architect',
  async description() {
    return DESCRIPTION
  },
  inputSchema,
  isReadOnly() {
    return true
  },
  isConcurrencySafe() {
    return true // ArchitectTool is read-only, safe for concurrent execution
  },
  userFacingName() {
    return 'Architect'
  },
  async isEnabled() {
    return false
  },
  needsPermissions() {
    return false
  },
  async *call(input, toolUseContext: ToolUseContext) {
    const { abortController, readFileTimestamps } = toolUseContext;

    // Ensure toolUseContext.options is always an object, even if undefined
    const baseOptions = toolUseContext.options ?? {};

    // Prepare ExtendedToolUseContextForQuery['options'] with all required fields and defaults
    const extendedOptions: ExtendedToolUseContextForQuery['options'] = {
      commands: baseOptions.commands ?? [],
      forkNumber: baseOptions.forkNumber ?? 0,
      messageLogName: baseOptions.messageLogName ?? 'architect-tool',
      tools: baseOptions.tools ?? [], // Ensure tools is an array
      verbose: baseOptions.verbose ?? false,
      safeMode: baseOptions.safeMode ?? false,
      maxThinkingTokens: baseOptions.maxThinkingTokens ?? 2000, // Default value
      // Conditionally add optional properties if they exist in baseOptions
      ...((baseOptions as any).isKodingRequest !== undefined && { isKodingRequest: (baseOptions as any).isKodingRequest }),
      ...((baseOptions as any).model !== undefined && { model: (baseOptions as any).model }),
      ...((baseOptions as any).slowAndCapableModel !== undefined && { slowAndCapableModel: (baseOptions as any).slowAndCapableModel }),
      ...((baseOptions as any).kodingContext !== undefined && { kodingContext: (baseOptions as any).kodingContext }),
      ...((baseOptions as any).isCustomCommand !== undefined && { isCustomCommand: (baseOptions as any).isCustomCommand }),
    };

    // Prepare ExtendedToolUseContextForQuery for the query function
    const extendedToolUseContext: ExtendedToolUseContextForQuery = {
      messageId: toolUseContext.messageId,
      agentId: toolUseContext.agentId,
      safeMode: toolUseContext.safeMode,
      abortController: toolUseContext.abortController,
      readFileTimestamps: readFileTimestamps ?? {},
      responseState: toolUseContext.responseState,
      setToolJSX: () => { }, // Provide a no-op setToolJSX as it's required
      options: extendedOptions, // Use the fully defined extendedOptions
      // requestId is on ExtendedToolUseContext in query.ts, but not on ToolUseContext.
      // We need to copy it if it's there from the incoming toolUseContext (which might be ExtendedToolUseContext from another tool)
      ...((toolUseContext as any).requestId !== undefined && { requestId: (toolUseContext as any).requestId }),
    };

    const content = input.context
      ? `<context>${input.context}</context>\n\n${input.prompt}`
      : input.prompt

    const userMessage = createUserMessage(content)

    const messages: Message[] = [userMessage]

    // Filter tools to those compatible with Architect's output processing
    const allowedTools = (extendedToolUseContext.options.tools ?? []).filter(_ =>
      FS_EXPLORATION_TOOLS.map(_ => _.name).includes(_.name),
    )
    extendedToolUseContext.options.tools = allowedTools; // Assign filtered tools back to options


    const lastResponse = await lastX(
      query(
        messages,
        [ARCHITECT_SYSTEM_PROMPT],
        await getContext(),
        hasPermissionsToUseTool,
        extendedToolUseContext, // Pass the prepared ExtendedToolUseContextForQuery
      ),
    )

    if (lastResponse.type !== 'assistant') {
      throw new Error(`Invalid response from API`)
    }

    // Ensure data is typed as TextBlock[] for renderResultForAssistant
    const data = lastResponse.message.content.filter(_ => _.type === 'text') as TextBlock[]
    yield {
      type: 'result',
      data,
      resultForAssistant: this.renderResultForAssistant(data),
    }
  },
  async prompt() {
    return DESCRIPTION
  },
  renderResultForAssistant(data: TextBlock[]) { // Explicitly type data
    return data.map((block) => block.text).join('\n')
  },
  renderToolUseMessage(input) {
    return Object.entries(input)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')
  },
  renderToolResultMessage(content: TextBlock[]) { // Explicitly type content
    return (
      <Box flexDirection="column" gap={1}>
        <HighlightedCode
          code={content.map(_ => _.text).join('\n')}
          language="markdown"
        />
      </Box>
    )
  },
  renderToolUseRejectedMessage() {
    return <FallbackToolUseRejectedMessage />
  },
} satisfies Tool<typeof inputSchema, TextBlock[]>
