import { type Tool } from '../../Tool'
import { getTools, getReadOnlyTools } from '../../tools'
import { TaskTool } from './TaskTool'
import { BashTool } from '../BashTool/BashTool'
import { FileWriteTool } from '../FileWriteTool/FileWriteTool'
import { FileEditTool } from '../FileEditTool/FileEditTool'
import { NotebookEditTool } from '../NotebookEditTool/NotebookEditTool'
import { GlobTool } from '../GlobTool/GlobTool'
import { FileReadTool } from '../FileReadTool/FileReadTool'
import { getModelManager } from '../../utils/model'
import { getActiveAgents } from '../../utils/agentLoader'

export async function getTaskTools(safeMode: boolean): Promise<Tool[]> {
  // No recursive tasks, yet..
  return (await (!safeMode ? getTools() : getReadOnlyTools())).filter(
    _ => _.name !== TaskTool.name,
  )
}

export async function getPrompt(safeMode: boolean): Promise<string> {
  const agents = await getActiveAgents()
  
  const agentDescriptions = agents.map(agent => {
    const toolsStr = Array.isArray(agent.tools) 
      ? agent.tools.join(', ')
      : '*'
    return `- ${agent.agentType}: ${agent.whenToUse} (Tools: ${toolsStr})`
  }).join('\n')
  
  return `Launch specialized agents for complex tasks.

Available agent types:
${agentDescriptions}

## Required Input Format
Must use JSON object with these required fields:

\`\`\`json
{
  "description": "string (detailed task description)",
  "prompt": "string (specific instructions for subagent)",
  "subagent_type": "string (must match available agent types above)"
}
\`\`\`

## Usage Guidelines
- Use for complex multi-step tasks requiring specialized expertise
- Launch multiple agents concurrently when possible
- Provide detailed, self-contained prompts for autonomous execution
- Agents are stateless - include all necessary context in the prompt
- Specify exactly what information the agent should return

## Example Usage

### Code Review Task
\`\`\`json
{
  "description": "Review the prime number function for correctness and efficiency",
  "prompt": "Analyze this prime number function for:
1. Algorithm correctness
2. Edge case handling
3. Time complexity
4. Potential optimizations
5. Code style improvements",
  "subagent_type": "code-reviewer"
}
\`\`\`

### Documentation Task
\`\`\`json
{
  "description": "Create comprehensive API documentation for user authentication endpoints",
  "prompt": "Document all user authentication endpoints including:
- Request/response formats
- Error codes and handling
- Security considerations
- Usage examples with curl commands",
  "subagent_type": "documentation-writer"
}
\`\`\`

When to use the Agent tool:
- When you are instructed to execute custom slash commands. Use the Agent tool with the slash command invocation as the entire prompt. The slash command can take arguments. For example: Task(description="Check the file", prompt="/check-file path/to/file.py")

When NOT to use the Agent tool:
- If you want to read a specific file path, use the ${FileReadTool.name} or ${GlobTool.name} tool instead of the Agent tool, to find the match more quickly
- If you are searching for a specific class definition like "class Foo", use the ${GlobTool.name} tool instead, to find the match more quickly
- If you are searching for code within a specific file or set of 2-3 files, use the ${FileReadTool.name} tool instead of the Agent tool, to find the match more quickly
- Other tasks that are not related to the agent descriptions above

Usage notes:
1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses
2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.
3. Each agent invocation is stateless. You will not be able to send additional messages to the agent, nor will the agent be able to communicate with you outside of its final report. Therefore, your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to write code or just to do research (search, file reads, web fetches, etc.), since it is not aware of the user's intent
6. If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first. Use your judgement.

Example usage:

<example_agent_descriptions>
"code-reviewer": use this agent after you are done writing a signficant piece of code
"greeting-responder": use this agent when to respond to user greetings with a friendly joke
</example_agent_description>

<example>
user: "Please write a function that checks if a number is prime"
assistant: Sure let me write a function that checks if a number is prime
assistant: First let me use the ${FileWriteTool.name} tool to write a function that checks if a number is prime
assistant: I'm going to use the ${FileWriteTool.name} tool to write the following code:
<code>
function isPrime(n) {
  if (n <= 1) return false
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false
  }
  return true
}
</code>
<commentary>
Since a signficant piece of code was written and the task was completed, now use the code-reviewer agent to review the code
</commentary>
assistant: Now let me use the code-reviewer agent to review the code
assistant: Uses the Task tool to launch the with the code-reviewer agent 
</example>

<example>
user: "Hello"
<commentary>
Since the user is greeting, use the greeting-responder agent to respond with a friendly joke
</commentary>
assistant: "I'm going to use the Task tool to launch the with the greeting-responder agent"
</example>`
}
