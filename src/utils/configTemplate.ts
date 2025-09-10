import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { getCwd } from './state'

/**
 * 生成命令配置模板
 */
export function generateCommandConfigTemplate(commandName: string, usesLLMApi: boolean = true) {
  const template = {
    name: commandName,
    description: `Configuration for ${commandName} command`,
    enabled: true,
    usesLLMApi,
    prompt: null as string | null,
    customSettings: {}
  }

  if (usesLLMApi) {
    template.prompt = `// 自定义${commandName}命令的提示词模板
// 支持以下占位符：
// {args} - 命令参数
// {project_file} - 项目配置文件名

请输入您的自定义提示词...`
  }

  return JSON.stringify(template, null, 2)
}

/**
 * 初始化命令配置目录结构
 */
export function initCommandConfig() {
  const home = homedir()
  const cwd = getCwd()

  const dirs = [
    join(home, '.kode', 'commands'),
    join(cwd, '.kode', 'commands')
  ]

  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  })
}

/**
 * 为指定命令创建配置文件
 */
export function createCommandConfig(commandName: string, usesLLMApi: boolean = true, scope: 'global' | 'project' = 'project') {
  const home = homedir()
  const cwd = getCwd()

  const baseDir = scope === 'global' ? home : cwd
  const configDir = join(baseDir, '.kode', 'commands')
  
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  const configPath = join(configDir, `${commandName}.json`)
  const template = generateCommandConfigTemplate(commandName, usesLLMApi)

  if (!existsSync(configPath)) {
    writeFileSync(configPath, template)
    return configPath
  }

  return null
}

/**
 * 获取所有命令的配置示例
 */
export function getAllCommandConfigs() {
  return {
    compact: {
      enabled: true,
      prompt: `自定义的compact提示词内容`
    },
    todo: {
      enabled: true,
      customSettings: {
        autoUpdate: true,
        showProgress: true
      }
    },
    bug: {
      enabled: true,
      customSettings: {
        template: "bug-report.md"
      }
    }
  }
}