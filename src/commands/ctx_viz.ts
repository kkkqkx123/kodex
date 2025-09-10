import type { Command } from '../commands'
import type { Tool } from '../Tool'
import { getSystemPrompt } from '../constants/prompts'
import { getContext } from '../context'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { getMessagesGetter } from '../messages'
import { PROJECT_FILE } from '../constants/product'
import { calculateContextStatistics } from '../utils/contextStatistics'
import { getCurrentModelContextLimit } from '../utils/model'
// Quick and dirty estimate of bytes per token for rough token counts
const BYTES_PER_TOKEN = 4

interface Section {
  title: string
  content: string
}

interface ToolSummary {
  name: string
  description: string
}

function getContextSections(text: string): Section[] {
  const sections: Section[] = []

  // Find first <context> tag
  const firstContextIndex = text.indexOf('<context')

  // Everything before first tag is Core Sysprompt
  if (firstContextIndex > 0) {
    const coreSysprompt = text.slice(0, firstContextIndex).trim()
    if (coreSysprompt) {
      sections.push({
        title: 'Core Sysprompt',
        content: coreSysprompt,
      })
    }
  }

  let currentPos = firstContextIndex
  let nonContextContent = ''

  const regex = /<context\s+name="([^"]*)">([\s\S]*?)<\/context>/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Collect text between context tags
    if (match.index > currentPos) {
      nonContextContent += text.slice(currentPos, match.index)
    }

    const [, name = 'Unnamed Section', content = ''] = match
    sections.push({
      title: name === 'codeStyle' ? `CodeStyle + ${PROJECT_FILE}'s` : name,
      content: content.trim(),
    })

    currentPos = match.index + match[0].length
  }

  // Collect remaining text after last tag
  if (currentPos < text.length) {
    nonContextContent += text.slice(currentPos)
  }

  // Add non-contextualized content if present
  const trimmedNonContext = nonContextContent.trim()
  if (trimmedNonContext) {
    sections.push({
      title: 'Non-contextualized Content',
      content: trimmedNonContext,
    })
  }

  return sections
}

function formatTokenCount(bytes: number): string {
  const tokens = bytes / BYTES_PER_TOKEN
  const k = tokens / 1000
  return `${Math.round(k * 10) / 10}k`
}

function formatByteCount(bytes: number): string {
  const kb = bytes / 1024
  return `${Math.round(kb * 10) / 10}kb`
}

function createSummaryTable(
  systemText: string,
  systemSections: Section[],
  tools: ToolSummary[],
  messages: unknown,
): string {
    const messagesStr = JSON.stringify(messages)
    const toolsStr = JSON.stringify(tools)
  
    // Calculate total for percentages
    const total = systemText.length + toolsStr.length + messagesStr.length
    const getPercentage = (n: number) => `${Math.round((n / total) * 100)}%`
  
    // Define column widths
    const colWidths = [30, 12, 12, 10]
    
    // Helper function to pad strings
    const pad = (str: string, width: number) => str.padEnd(width)
    
    // Helper function to create a separator line
    const separator = '├' + '─'.repeat(colWidths[0]) + '┼' + '─'.repeat(colWidths[1]) + '┼' + '─'.repeat(colWidths[2]) + '┼' + '─'.repeat(colWidths[3]) + '┤'
    
    // Helper function to create a row
    const createRow = (cols: string[]) => {
      return '│' + cols.map((col, i) => pad(col, colWidths[i])).join('│') + '│'
    }
    
    let output = ''
    
    // Header
    output += '┌' + '─'.repeat(colWidths[0]) + '┬' + '─'.repeat(colWidths[1]) + '┬' + '─'.repeat(colWidths[2]) + '┬' + '─'.repeat(colWidths[3]) + '┐\n'
    output += createRow(['Component', 'Tokens', 'Size', '% Used']) + '\n'
    output += separator + '\n'
    
    // System prompt and its sections
    output += createRow([
      'System prompt',
      formatTokenCount(systemText.length),
      formatByteCount(systemText.length),
      getPercentage(systemText.length),
    ]) + '\n'
    
    for (const section of systemSections) {
      output += createRow([
        `  ${section.title}`,
        formatTokenCount(section.content.length),
        formatByteCount(section.content.length),
        getPercentage(section.content.length),
      ]) + '\n'
    }
  
    // Tools
    output += createRow([
      'Tool definitions',
      formatTokenCount(toolsStr.length),
      formatByteCount(toolsStr.length),
      getPercentage(toolsStr.length),
    ]) + '\n'
    
    for (const tool of tools) {
      output += createRow([
        `  ${tool.name}`,
        formatTokenCount(tool.description.length),
        formatByteCount(tool.description.length),
        getPercentage(tool.description.length),
      ]) + '\n'
    }
  
    // Messages and total
    output += createRow([
      'Messages',
      formatTokenCount(messagesStr.length),
      formatByteCount(messagesStr.length),
      getPercentage(messagesStr.length),
    ]) + '\n'
    
    output += separator + '\n'
    output += createRow(['Total', formatTokenCount(total), formatByteCount(total), '100%']) + '\n'
    output += '└' + '─'.repeat(colWidths[0]) + '┴' + '─'.repeat(colWidths[1]) + '┴' + '─'.repeat(colWidths[2]) + '┴' + '─'.repeat(colWidths[3]) + '┘'
  
    return output
  }
const command: Command = {
  name: 'ctx-viz',
  description:
    'Show token usage breakdown for the current conversation context',
  isEnabled: true,
  isHidden: false,
  type: 'local',

  userFacingName() {
    return this.name
  },

  async call(_args: string, cmdContext: { options: { tools: Tool[] } }) {
    // Get tools and system prompt with injected context
    const [systemPromptRaw, sysContext] = await Promise.all([
      getSystemPrompt(),
      getContext(),
    ])
  
    const rawTools = cmdContext.options.tools
  
    // Full system prompt with context sections injected
    let systemPrompt = systemPromptRaw.join('\n')
    for (const [name, content] of Object.entries(sysContext)) {
      systemPrompt += `\n<context name="${name}">${content}</context>`
    }
  
    // Get full tool definitions including prompts, schemas, and descriptions
    const tools = await Promise.all(rawTools.map(async t => {
      // Get full prompt and schema
      const fullPrompt = t.prompt({ safeMode: false })
      const schema = JSON.stringify(
        'inputJSONSchema' in t && t.inputJSONSchema
          ? t.inputJSONSchema
          : zodToJsonSchema(t.inputSchema),
      )
      
      // Get tool description (handle both sync and async)
      let toolDescription = ''
      if (typeof t.description === 'function') {
        try {
          const descResult = t.description()
          toolDescription = descResult instanceof Promise ? await descResult : descResult
        } catch (error) {
          toolDescription = 'Error getting description'
        }
      } else if (typeof t.description === 'string') {
        toolDescription = t.description
      }

      return {
        name: t.name,
        description: `${toolDescription}\n\n${fullPrompt}\n\nSchema:\n${schema}`,
      }
    }))
  
    // Get current messages from REPL
    const messages = getMessagesGetter()()
  
    // Calculate real token usage using the context statistics module
    const contextLimit = getCurrentModelContextLimit()
    const contextStats = await calculateContextStatistics(messages, cmdContext.options.tools, contextLimit)
    
    // Add a summary row with real token usage
    const summaryRow = [
      'Real Token Usage',
      `${contextStats.totalTokens.toLocaleString()} tokens`,
      '',
      `${contextStats.percentUsed}%`
    ]
  
    const sections = getContextSections(systemPrompt)
    const tableOutput = createSummaryTable(systemPrompt, sections, tools, messages)
    
    // Add the real token usage summary to the output
    return `${tableOutput}\n\nReal Token Usage: ${contextStats.totalTokens.toLocaleString()} tokens (${contextStats.percentUsed}% of context limit)`
  },
}

export default command
