import type { Command } from '../commands'
import { formatTotalCost } from '../cost-tracker'
import { tokenAccumulator } from '../utils/tokenAccumulator'

const exit = {
  type: 'local',
  name: 'exit',
  description: 'Show the total cost and duration of the current session, then exit the process',
  isEnabled: true,
  isHidden: false,
  async call() {
    const costInfo = formatTotalCost()
    const tokenStats = tokenAccumulator.formatStatistics()
    
    // Combine cost info and token statistics
    const combinedInfo = `${costInfo}\n\n${tokenStats}`
    
    // Clear input and terminal line before exiting
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1b[K')
    }
    // Use setTimeout to allow the message to be displayed before exiting
    setTimeout(() => {
      process.exit(0)
    }, 100)
    return combinedInfo
  },
  userFacingName() {
    return 'exit'
  },
} satisfies Command

export default exit