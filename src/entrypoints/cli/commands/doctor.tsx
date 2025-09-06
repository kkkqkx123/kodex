import { CommandInterface } from '../types'
import { Command } from '@commander-js/extra-typings'
import { Doctor } from '../../../screens/Doctor'
import { render } from 'ink'
import { logEvent } from '../../../services/featureFlags'
import { PRODUCT_NAME } from '../../../constants/product'
import React from 'react'

export class DoctorCommand implements CommandInterface {
  name = 'doctor'
  description = `Check the health of your ${PRODUCT_NAME} auto-updater`

  configure(program: Command): Command {
    program
      .command('doctor')
      .description(`Check the health of your ${PRODUCT_NAME} auto-updater`)
      .action(async () => {
        logEvent('tengu_doctor_command', {})

        await new Promise<void>(resolve => {
          render(<Doctor onDone={() => resolve()} doctorMode={true} />)
        })
        process.exit(0)
      })
    return program
  }

  async execute(): Promise<void> {
    // This command is handled by the configure method
  }
}