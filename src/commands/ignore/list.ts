import { Subcommand } from './subcommand'
import { getCwd } from '../../utils/state'
import * as path from 'path'
import * as fs from 'fs'

const listSubcommand: Subcommand = {
  name: 'list',
  description: '列出当前项目的所有忽略规则',
  aliases: ['ls'],
  async call(args, context) {
    const cwd = getCwd()
    
    try {
      // 广度优先搜索所有忽略文件
      const ignoreFiles = await findIgnoreFilesBFS(cwd)
      
      if (ignoreFiles.length === 0) {
        console.log('📝 未找到任何忽略文件 (.gitignore 或 .kodeignore)')
        return ''
      }
      
      console.log('📋 项目忽略规则列表\n')
      
      let totalFiles = 0
      let totalRules = 0
      
      for (const { relativePath, filePath } of ignoreFiles) {
        console.log(`📁 ${relativePath}`)
        console.log(''.padEnd(50, '-'))
        
        // 读取文件内容并过滤注释和空行
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        
        // 过滤规则：移除注释（# 和 //）和空行
        const filteredLines = lines
          .map(line => line.trim())
          .filter(line => {
            // 移除注释
            let cleanLine = line
            if (cleanLine.includes('//')) {
              cleanLine = cleanLine.split('//')[0].trim()
            }
            if (cleanLine.includes('#')) {
              cleanLine = cleanLine.split('#')[0].trim()
            }
            // 只保留非空行
            return cleanLine.length > 0
          })
        
        if (filteredLines.length === 0) {
          console.log('   (无有效规则)')
        } else {
          filteredLines.forEach(line => {
            // 如果行包含注释标记，只显示注释前的部分
            let displayLine = line
            if (displayLine.includes('//')) {
              displayLine = displayLine.split('//')[0].trim()
            }
            if (displayLine.includes('#')) {
              displayLine = displayLine.split('#')[0].trim()
            }
            console.log(`  ${displayLine}`)
          })
        }
        
        console.log('') // 空行分隔
        totalFiles++
        totalRules += filteredLines.length
      }
      
      console.log(''.padEnd(50, '-'))
      console.log(`📊 总计: ${totalFiles} 个文件, ${totalRules} 条规则`)
      
    } catch (error) {
      console.error('❌ 获取忽略规则失败:', error)
      process.exit(1)
    }
    
    return ''
  }
}

// 广度优先搜索忽略文件
async function findIgnoreFilesBFS(rootPath: string): Promise<{ filePath: string; relativePath: string; depth: number }[]> {
  const result: { filePath: string; relativePath: string; depth: number }[] = []
  const queue: { dirPath: string; depth: number }[] = [{ dirPath: rootPath, depth: 0 }]
  const visited = new Set<string>()
  
  while (queue.length > 0) {
    const { dirPath, depth } = queue.shift()!
    
    if (visited.has(dirPath)) continue
    visited.add(dirPath)
    
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true })
      
      // 检查当前目录的忽略文件
      const gitignorePath = path.join(dirPath, '.gitignore')
      const kodeignorePath = path.join(dirPath, '.kodeignore')
      
      if (fs.existsSync(gitignorePath)) {
        result.push({
          filePath: gitignorePath,
          relativePath: path.relative(rootPath, gitignorePath),
          depth
        })
      }
      
      if (fs.existsSync(kodeignorePath)) {
        result.push({
          filePath: kodeignorePath,
          relativePath: path.relative(rootPath, kodeignorePath),
          depth
        })
      }
      
      // 将子目录加入队列（广度优先）
      for (const file of files) {
        if (file.isDirectory()) {
          const subDirPath = path.join(dirPath, file.name)
          if (!shouldSkipDirectory(file.name) && !visited.has(subDirPath)) {
            queue.push({ dirPath: subDirPath, depth: depth + 1 })
          }
        }
      }
    } catch (error) {
      // 忽略权限错误等
      if ((error as NodeJS.ErrnoException).code !== 'EACCES') {
        console.warn(`扫描目录失败: ${dirPath}`, error)
      }
    }
  }
  
  // 同一深度的文件按名称排序
  result.sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth
    }
    return a.relativePath.localeCompare(b.relativePath)
  })
  
  return result
}

// 判断是否应该跳过目录
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = [
    'node_modules', '.git', '.svn', '.hg',
    'dist', 'build', 'coverage',
    '.next', '.nuxt', '.cache'
  ]
  return skipDirs.includes(dirName.toLowerCase())
}

export default listSubcommand