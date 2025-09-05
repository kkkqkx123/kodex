import React from 'react'
import bug from './commands/bug'
import clear from './commands/clear'
import compact from './commands/compact'
import config from './commands/config'
import configCmd from './commands/config-cmd'
import cost from './commands/cost'
import exit from './commands/exit'
import ctx_viz from './commands/ctx_viz'
import doctor from './commands/doctor'
import help from './commands/help'
import init from './commands/init'
import ignore from './commands/ignore'
import kiroSpec from './commands/kiro-spec'
import listen from './commands/listen'
import login from './commands/login'
import logout from './commands/logout'
import mcp from './commands/mcp'
import * as modelModule from './commands/model'
import modelstatus from './commands/modelstatus'
import onboarding from './commands/onboarding'
import pr_comments from './commands/pr_comments'
import quit from './commands/quit'
import refreshCommands from './commands/refreshCommands'
import releaseNotes from './commands/release-notes'
import review from './commands/review'
import terminalSetup from './commands/terminalSetup'
import { Tool, ToolUseContext } from './Tool'
import resume from './commands/resume'
import agents from './commands/agents'
import todo from './commands/todo'
import lastreq from './commands/lastreq'
import undo from './commands/undo'
import lasti from './commands/lasti'
import context from './commands/context'
import { getMCPCommands } from './services/mcpClient'
import { loadCustomCommands } from './services/customCommands'
import { enhanceCommandWithConfig } from './utils/commandConfig'
import type { MessageParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { memoize } from 'lodash-es'
import type { Message } from './query'
import { isAnthropicAuthEnabled } from './utils/auth'

type PromptCommand = {
  type: 'prompt'
  progressMessage: string
  argNames?: string[]
  getPromptForCommand(args: string): Promise<MessageParam[]>
}

type LocalCommand = {
  type: 'local'
  call(
    args: string,
    context: {
      options: {
        commands: Command[]
        tools: Tool[]
        slowAndCapableModel: string
      }
      abortController: AbortController
      setForkConvoWithMessagesOnTheNextRender: (
        forkConvoWithMessages: Message[],
      ) => void
    },
  ): Promise<string>
}

type LocalJSXCommand = {
  type: 'local-jsx'
  call(
    onDone: (result?: string) => void,
    context: ToolUseContext & {
      setForkConvoWithMessagesOnTheNextRender: (
        forkConvoWithMessages: Message[],
      ) => void
    },
  ): Promise<React.ReactNode>
}

export type Command = {
  description: string
  isEnabled: boolean
  isHidden: boolean
  name: string
  aliases?: string[]
  userFacingName(): string
} & (PromptCommand | LocalCommand | LocalJSXCommand)

const INTERNAL_ONLY_COMMANDS = [ctx_viz, resume, listen]

// Declared as a function so that we don't run this until getCommands is called,
// since underlying functions read from config, which can't be read at module initialization time
const COMMANDS = memoize((): Command[] => [
  enhanceCommandWithConfig(agents, false),
  enhanceCommandWithConfig(clear, false),
  enhanceCommandWithConfig(compact, true),
  enhanceCommandWithConfig(config, false),
  enhanceCommandWithConfig(configCmd, false),
  enhanceCommandWithConfig(cost, false),
  enhanceCommandWithConfig(exit, false),
  enhanceCommandWithConfig(quit, false),
  enhanceCommandWithConfig(doctor, false),
  enhanceCommandWithConfig(help, false),
  enhanceCommandWithConfig(init, false),
  enhanceCommandWithConfig(ignore, false),
  enhanceCommandWithConfig(kiroSpec, false),
  enhanceCommandWithConfig(mcp, false),
  enhanceCommandWithConfig(todo, false),
  enhanceCommandWithConfig({
    description: modelModule.description,
    isEnabled: modelModule.isEnabled,
    isHidden: modelModule.isHidden,
    name: modelModule.name,
    type: modelModule.type,
    call: modelModule.call,
    userFacingName: modelModule.userFacingName,
  }, false),
  enhanceCommandWithConfig(modelstatus, false),
  enhanceCommandWithConfig(onboarding, false),
  enhanceCommandWithConfig(pr_comments, false),
  enhanceCommandWithConfig(refreshCommands, false),
  enhanceCommandWithConfig(releaseNotes, false),
  enhanceCommandWithConfig(bug, true),
  enhanceCommandWithConfig(review, true),
  enhanceCommandWithConfig(terminalSetup, false),
  enhanceCommandWithConfig(lastreq, false),
  enhanceCommandWithConfig(undo, false),
  enhanceCommandWithConfig(lasti, false),
  enhanceCommandWithConfig(context, false),
  ...(isAnthropicAuthEnabled() ? [enhanceCommandWithConfig(logout, false), enhanceCommandWithConfig(login(), false)] : []),
  ...INTERNAL_ONLY_COMMANDS.map(cmd => enhanceCommandWithConfig(cmd, false)),
])

export const getCommands = memoize(async (): Promise<Command[]> => {
  const [mcpCommands, customCommands] = await Promise.all([
    getMCPCommands(),
    loadCustomCommands(),
  ])

  return [...mcpCommands, ...customCommands, ...COMMANDS()].filter(
    _ => _.isEnabled,
  )
})

export function hasCommand(commandName: string, commands: Command[]): boolean {
  return commands.some(
    _ => _.userFacingName() === commandName || _.aliases?.includes(commandName),
  )
}

export function getCommand(commandName: string, commands: Command[]): Command {
  const command = commands.find(
    _ => _.userFacingName() === commandName || _.aliases?.includes(commandName),
  ) as Command | undefined
  if (!command) {
    throw ReferenceError(
      `Command ${commandName} not found. Available commands: ${commands
        .map(_ => {
          const name = _.userFacingName()
          return _.aliases ? `${name} (aliases: ${_.aliases.join(', ')})` : name
        })
        .join(', ')}`,
    )
  }

  return command
}
