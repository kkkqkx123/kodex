import { Command } from '../commands'
import { findSubcommand } from '../utils/subcommandRegistry'
import { ignoreSubcommands } from './ignore/index'

const ignoreCommand: Command = {
  name: 'ignore',
  description: 'Manage project ignore rules',
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return 'ignore'
  },
  type: 'local',
  async call(args, context) {
    // Parse subcommand
    const subcommandName = args.trim().split(' ')[0]
    
    if (!subcommandName) {
      console.log('Usage: ignore <subcommand>')
      console.log('Available subcommands:')
      ignoreSubcommands.forEach(sub => {
        console.log(`  ${sub.name} - ${sub.description}${sub.aliases ? ` (aliases: ${sub.aliases.join(', ')})` : ''}`)
      })
      return ''
    }
    
    // Find subcommand
    const subcommand = findSubcommand('ignore', subcommandName)
    
    if (subcommand) {
      // Dynamically import and execute subcommand
      const subcommandModule = await import(`./ignore/${subcommandName}`)
      return await subcommandModule.default.call(args, context)
    } else {
      console.log(`Unknown subcommand: ${subcommandName}`)
      console.log('Available subcommands:')
      ignoreSubcommands.forEach(sub => {
        console.log(`  ${sub.name} - ${sub.description}${sub.aliases ? ` (aliases: ${sub.aliases.join(', ')})` : ''}`)
      })
      return ''
    }
  }
}

export default ignoreCommand