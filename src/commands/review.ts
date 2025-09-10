import { Command } from '../commands'
import { BashTool } from '../tools/BashTool/BashTool'
import { loadCustomPrompt, getCommandMetadata } from '../utils/configLoader'

const DEFAULT_REVIEW_PROMPT = `
You are an expert code reviewer. Follow these steps:

1. If no PR number is provided in the args, use BashTool("gh pr list") to show open PRs
2. If a PR number is provided, use BashTool("gh pr view <number>") to get PR details
3. Use BashTool("gh pr diff <number>") to get the diff
4. Analyze the changes and provide a thorough code review that includes:
   - Overview of what the PR does
   - Analysis of code quality and style
   - Specific suggestions for improvements
   - Any potential issues or risks

Keep your review concise but thorough. Focus on:
- Code correctness
- Following project conventions
- Performance implications
- Test coverage
- Security considerations

Format your review with clear sections and bullet points.

PR number: {args}
`

export default {
  type: 'prompt',
  name: 'review',
  description: 'Review a pull request',
  isEnabled: true,
  isHidden: false,

  progressMessage: 'reviewing pull request',
  userFacingName() {
    return 'review'
  },
  async getPromptForCommand(args) {
    // 加载自定义提示词
    const metadata = getCommandMetadata('review', true)
    const customPrompt = loadCustomPrompt('review', metadata)
    const reviewPrompt = customPrompt || DEFAULT_REVIEW_PROMPT

    // 替换参数占位符
    const promptWithArgs = reviewPrompt.replace('{args}', args || 'No PR number provided')

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
