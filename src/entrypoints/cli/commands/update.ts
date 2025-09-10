import { CommandInterface } from '../types'
import { Command } from '@commander-js/extra-typings'
import { checkGate, logEvent } from '../../../services/featureFlags'
import { GATE_USE_EXTERNAL_UPDATER } from '../../../constants/betas'
import { getLatestVersion, installGlobalPackage } from '../../../utils/autoUpdater'
import { MACRO } from '../../../constants/macros'
import { PRODUCT_NAME } from '../../../constants/product'

export class UpdateCommand implements CommandInterface {
  name = 'update'
  description = 'Check for updates and install if available'

  configure(program: Command): Command {
    program
      .command('update')
      .description('Check for updates and install if available')
      .action(async () => {
        const useExternalUpdater = await checkGate(GATE_USE_EXTERNAL_UPDATER)
        if (useExternalUpdater) {
          // The external updater intercepts calls to "claude update", which means if we have received
          // this command at all, the extenral updater isn't installed on this machine.
          console.log(`This version of ${PRODUCT_NAME} is no longer supported.`)
          process.exit(0)
        }

        logEvent('tengu_update_check', {})
        console.log(`Current version: ${MACRO.VERSION}`)
        console.log('Checking for updates...')

        const latestVersion = await getLatestVersion()

        if (!latestVersion) {
          console.error('Failed to check for updates')
          process.exit(1)
        }

        if (latestVersion === MACRO.VERSION) {
          console.log(`${PRODUCT_NAME} is up to date`)
          process.exit(0)
        }

        console.log(`New version available: ${latestVersion}`)
        console.log('Installing update...')

        const status = await installGlobalPackage()

        switch (status) {
          case 'success':
            console.log(`Successfully updated to version ${latestVersion}`)
            break
          case 'no_permissions':
            console.error('Error: Insufficient permissions to install update')
            console.error('Try running with sudo or fix npm permissions')
            process.exit(1)
            break
          case 'install_failed':
            console.error('Error: Failed to install update')
            process.exit(1)
            break
          case 'in_progress':
            console.error(
              'Error: Another instance is currently performing an update',
            )
            console.error('Please wait and try again later')
            process.exit(1)
            break
        }
        process.exit(0)
      })
    return program
  }

  async execute(): Promise<void> {
    // This command is handled by the configure method
  }
}