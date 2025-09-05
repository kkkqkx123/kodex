import { Command } from '../commands'
import { createCommandConfig, initCommandConfig } from '../utils/configTemplate'
import { getCwd } from '../utils/state'
import { join } from 'path'
import { homedir } from 'os'

const configCmd: Command = {
  type: 'local',
  name: 'config-cmd',
  description: 'Manage command configurations and templates',
  isEnabled: true,
  isHidden: false,
  async call(args: string) {
    const [subcommand, commandName, scope] = args.trim().split(' ')
    
    switch (subcommand) {
      case 'init':
        initCommandConfig()
        return '✅ Command configuration directories initialized'
        
      case 'create':
        if (!commandName) {
          return '❌ Please specify a command name. Usage: /config-cmd create <command> [global|project]'
        }
        
        const createdPath = createCommandConfig(
          commandName, 
          true, 
          scope === 'global' ? 'global' : 'project'
        )
        
        if (createdPath) {
          return `✅ Configuration file created: ${createdPath}`
        } else {
          return `⚠️ Configuration file already exists for ${commandName}`
        }
        
      case 'paths':
        const home = homedir()
        const cwd = getCwd()
        
        return `
📁 Command configuration search paths:

Global:
  ${join(home, '.kode', 'commands')}
  ${join(home, '.claude', 'commands')}

Project:
  ${join(cwd, '.kode', 'commands')}
  ${join(cwd, '.claude', 'commands')}

💡 Use /config-cmd create <command> to generate templates
`
      
      default:
        return `
🛠️ Command Configuration Manager

Usage:
  /config-cmd init              - Initialize configuration directories
  /config-cmd create <command>  - Create config template for command
  /config-cmd create <command> global - Create in global scope
  /config-cmd paths             - Show all search paths

💡 Commands with requiresReasoning=true will scan for custom prompts
💡 Commands with requiresReasoning=false will skip config scanning
`
    }
  },
  userFacingName() {
    return 'config-cmd'
  }
}

export default configCmd