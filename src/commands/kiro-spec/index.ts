import { Command } from '../../commands'
import { getMessagesSetter } from '../../messages'
import { Message } from '../../query'
import * as React from 'react'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { UUID } from 'crypto'

const kiroSpec = {
  type: 'local',
  name: 'kiro-spec',
  description: 'Create comprehensive specification documents for development projects',
  isEnabled: true,
  isHidden: false,
  async call(args, context) {
    const { setForkConvoWithMessagesOnTheNextRender } = context
    
    // 解析参数获取项目描述
    const projectDescription = args.trim()
    if (!projectDescription) {
      return 'Please provide a project description. Usage: kiro-spec [project description]'
    }

    // 读取提示词文件内容
    let promptContent = ''
    try {
      // 使用绝对路径确保在打包后也能正确读取
      const baseDir = process.cwd()
      const specFilePath = join(baseDir, 'src', 'commands', 'prompt', 'kiro-spec', 'spec.md')
      const createSteeringFilePath = join(baseDir, 'src', 'commands', 'prompt', 'kiro-spec', 'create-steering-documents.md')
      
      // 读取主要的提示词文件
      const [specContent, steeringContent] = await Promise.all([
        readFile(specFilePath, 'utf-8'),
        readFile(createSteeringFilePath, 'utf-8')
      ])
      
      // 提取关键信息用于提示词
      const specSummary = specContent.split('\n').slice(0, 10).join('\n') + '...'
      const steeringSummary = steeringContent.split('\n').slice(0, 10).join('\n') + '...'
      
      promptContent = `Based on the Kiro specification framework:

SPECIFICATION GUIDELINES:
${specSummary}

STEERING DOCUMENT TEMPLATES:
${steeringSummary}

I will follow these standards to create comprehensive project documentation.`
    } catch (error) {
      console.warn('Failed to read prompt files:', error.message)
      promptContent = 'Using Kiro specification framework to create comprehensive project documentation including requirements, design, implementation plan, and project standards.'
    }

    // 创建spec文档的提示信息，注入提示词内容
    const specMessage: Message = {
      type: 'assistant',
      uuid: randomUUID() as UUID,
      costUSD: 0,
      durationMs: 0,
      message: {
        id: randomUUID(),
        model: '<synthetic>',
        role: 'assistant',
        stop_reason: 'stop_sequence',
        stop_sequence: '',
        type: 'message',
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: undefined,
          server_tool_use: undefined,
          service_tier: undefined,
        },
        content: [
          {
            type: 'text',
            text: `Creating specification documents for: ${projectDescription}
              
${promptContent}
              
Let me analyze your project requirements and create the appropriate documentation.`,
            citations: []
          }
        ],
      }
    }

    // 设置消息以触发spec创建流程
    setForkConvoWithMessagesOnTheNextRender([specMessage])
    
    return `Starting specification creation for: ${projectDescription}`
  },
  userFacingName() {
    return 'kiro-spec'
  },
} satisfies Command

export default kiroSpec