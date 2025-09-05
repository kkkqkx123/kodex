import { Subcommand } from './subcommand'
import { refreshIgnoreRules } from '../../context'
import { getCwd } from '../../utils/state'

const refreshSubcommand: Subcommand = {
  name: 'refresh',
  description: '刷新项目中的所有忽略规则',
  async call(args, context) {
    const cwd = getCwd()
    let output = ''
    
    try {
      output += '🔄 正在刷新忽略规则...\n'
      
      const result = await refreshIgnoreRules(cwd)
      
      if (result.success) {
        output += '✅ 忽略规则刷新成功！\n'
        output += `📁 扫描文件: ${result.filesScanned}\n`
        output += `📋 加载规则: ${result.rulesLoaded}\n`
        output += `⏱️  耗时: ${result.duration}ms\n`
      } else {
        output += '❌ 忽略规则刷新失败\n'
        return output
      }
    } catch (error) {
      output += `❌ 忽略规则刷新失败: ${error}\n`
      return output
    }
    
    return output
  }
}

export default refreshSubcommand