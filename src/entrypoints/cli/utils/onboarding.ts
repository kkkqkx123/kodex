import { getGlobalConfig, saveGlobalConfig } from '../../../utils/config'
import { MACRO } from '../../../constants/macros'
import { clearTerminal } from '../../../utils/terminal'
import { render } from 'ink'
import { Onboarding } from '../../../components/Onboarding'
import { TrustDialog } from '../../../components/TrustDialog'
import { checkHasTrustDialogAccepted } from '../../../utils/config'
import { grantReadPermissionForOriginalDir } from '../../../utils/permissions/filesystem'
import { handleMcprcServerApprovals } from '../../../services/mcpServerApproval'
import React from 'react'

/**
 * Marks the onboarding process as completed in the global configuration
 */
export function completeOnboarding(): void {
  const config = getGlobalConfig()
  saveGlobalConfig({
    ...config,
    hasCompletedOnboarding: true,
    lastOnboardingVersion: MACRO.VERSION,
  })
}

/**
 * Shows the setup screens including onboarding and trust dialog
 * @param safeMode Whether to show the trust dialog
 * @param print Whether in print mode (non-interactive)
 */
export async function showSetupScreens(
  safeMode?: boolean,
  print?: boolean,
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const config = getGlobalConfig()
  if (
    !config.theme ||
    !config.hasCompletedOnboarding // always show onboarding at least once
  ) {
    await clearTerminal()
    await new Promise<void>(resolve => {
      render(
        React.createElement(Onboarding, {
          onDone: async () => {
            completeOnboarding()
            await clearTerminal()
            resolve()
          }
        }),
        {
          exitOnCtrlC: false,
        },
      )
    })
  }

  // In non-interactive mode, only show trust dialog in safe mode
  if (!print && safeMode) {
    if (!checkHasTrustDialogAccepted()) {
      await new Promise<void>(resolve => {
        const onDone = () => {
          // Grant read permission to the current working directory
          grantReadPermissionForOriginalDir()
          resolve()
        }
        render(React.createElement(TrustDialog, { onDone: onDone }), {
          exitOnCtrlC: false,
        })
      })
    }

    // After trust dialog, check for any mcprc servers that need approval
    if (process.env.USER_TYPE === 'ant') {
      await handleMcprcServerApprovals()
    }
  }
}