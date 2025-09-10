import type { Command } from '../commands'
import { formatTotalCost } from '../cost-tracker'
import { tokenAccumulator } from '../utils/tokenAccumulator'
import chalk from 'chalk'

const cost = {
  type: 'local',
  name: 'cost',
  description: 'Show the total cost and detailed token statistics of the current session',
  isEnabled: true,
  isHidden: false,
  async call() {
    // Get basic cost information
    const basicCost = formatTotalCost()
    
    // Get detailed token statistics
    const detailedStats = tokenAccumulator.formatStatistics()
    
    // Combine both outputs with a separator
    return chalk.grey(
      basicCost + '\n\n' + detailedStats
    )
  },
  userFacingName() {
    return 'cost'
  },
} satisfies Command

export default cost
