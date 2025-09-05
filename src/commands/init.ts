import type { Command } from '../commands'
import { markProjectOnboardingComplete } from '../ProjectOnboarding'
import { PROJECT_FILE } from '../constants/product'
import { loadCustomPrompt, getCommandMetadata } from '../utils/configLoader'

const DEFAULT_INIT_PROMPT = `Please analyze this codebase and create a {project_file} file containing:
1. Build/lint/test commands - especially for running a single test
2. Code style guidelines including imports, formatting, types, naming conventions, error handling, etc.

The file you create will be given to agentic coding agents (such as yourself) that operate in this repository. Make it about 20 lines long.
If there's already a {project_file}, improve it.
If there are Cursor rules (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), make sure to include them.`

const command = {
  type: 'prompt',
  name: 'init',
  description: `Initialize a new ${PROJECT_FILE} file with codebase documentation`,
  isEnabled: true,
  isHidden: false,

  progressMessage: 'analyzing your codebase',
  userFacingName() {
    return 'init'
  },
  async getPromptForCommand(_args: string) {
    // Mark onboarding as complete when init command is run
    markProjectOnboardingComplete()
    
    // 加载自定义提示词
    const metadata = getCommandMetadata('init', true)
    const customPrompt = loadCustomPrompt('init', metadata)
    const initPrompt = customPrompt || DEFAULT_INIT_PROMPT
    
    // 替换项目文件占位符
    const promptWithArgs = initPrompt.replace(/{project_file}/g, PROJECT_FILE)

    return [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: promptWithArgs,
          },
        ],
      },
    ]
  },
} satisfies Command

export default command
