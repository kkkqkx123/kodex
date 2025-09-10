import { Command } from '../commands'
import { getMessagesGetter } from '../messages'
import { getContext } from '../context'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const context = {
  type: 'local',
  name: 'context',
  description: 'Export full context to .kode/context_export/ file with filename format of MMDD_HHMM_UUID',
  isEnabled: true,
  isHidden: false,
  async call(_, context: any) {
    try {
      // Get current messages
      const messages = getMessagesGetter()()
      
      // Get current context
      const currentContext = await getContext()
      
      // Create export data
      const exportData = {
        timestamp: new Date().toISOString(),
        messages: messages,
        context: currentContext,
        exportId: randomUUID()
      }
      
      // Create export directory if it doesn't exist
      const exportDir = join('.kode', 'context_export')
      if (!existsSync(exportDir)) {
        mkdirSync(exportDir, { recursive: true })
      }
      
      // Create filename with timestamp and UUID in format: month day _ hour minute _ UUID
      const now = new Date()
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      const hour = now.getHours().toString().padStart(2, '0')
      const minute = now.getMinutes().toString().padStart(2, '0')
      const filename = `${month}${day}_${hour}${minute}_${randomUUID()}.json`
      const filepath = join(exportDir, filename)
      
      // Write export data to file
      writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8')
      
      return `Context exported successfully to: ${filepath}`
    } catch (error) {
      return `Failed to export context: ${error instanceof Error ? error.message : String(error)}`
    }
  },
  userFacingName() {
    return 'context'
  },
} satisfies Command

export default context