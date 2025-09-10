import { setCwd, setOriginalCwd } from '../../../utils/state'
import { grantReadPermissionForOriginalDir } from '../../../utils/permissions/filesystem'
import { cleanupOldMessageFilesInBackground } from '../../../utils/cleanup'
import { getContext } from '../../../context'
import { getGlobalConfig, saveGlobalConfig, getCurrentProjectConfig } from '../../../utils/config'
import { logEvent } from '../../../services/featureFlags'
import { render } from 'ink'
import { Doctor } from '../../../screens/Doctor'
import React from 'react'

/**
 * Sets up the CLI environment
 * @param cwd The current working directory
 * @param safeMode Whether to run in safe mode
 */
export async function setup(cwd: string, safeMode?: boolean): Promise<void> {
  // Set both current and original working directory if --cwd was provided
  if (cwd !== process.cwd()) {
    setOriginalCwd(cwd)
  }
  await setCwd(cwd)

  // Always grant read permissions for original working dir
  grantReadPermissionForOriginalDir()
  
  // Start watching agent configuration files for changes
  const { startAgentWatcher } = await import('../../../utils/agentLoader')
  await startAgentWatcher(() => {
    // Cache is already cleared in the watcher, just log
    console.log('✅ Agent configurations hot-reloaded')
  })

  // If --safe mode is enabled, prevent root/sudo usage for security
  if (safeMode) {
    // Check if running as root/sudo on Unix-like systems
    if (
      process.platform !== 'win32' &&
      typeof process.getuid === 'function' &&
      process.getuid() === 0
    ) {
      console.error(
        `--safe mode cannot be used with root/sudo privileges for security reasons`,
      )
      process.exit(1)
    }
  }

  if (process.env.NODE_ENV === 'test') {
    return
  }

  cleanupOldMessageFilesInBackground()
  
  // Pre-fetch context data with timeout protection
  if (process.env.KODE_QUICK_START !== 'true') {
    getContext().catch(err => {
      console.warn('Context loading failed:', err.message)
    })
  } else {
    console.log('Quick start mode: Skipping directory scanning')
  }

  // Migrate old iterm2KeyBindingInstalled config to new shiftEnterKeyBindingInstalled
  const globalConfig = getGlobalConfig()
  if (
    globalConfig.iterm2KeyBindingInstalled === true &&
    globalConfig.shiftEnterKeyBindingInstalled !== true
  ) {
    const updatedConfig = {
      ...globalConfig,
      shiftEnterKeyBindingInstalled: true,
    }
    // Remove the old config property
    delete updatedConfig.iterm2KeyBindingInstalled
    saveGlobalConfig(updatedConfig)
  }

  // Check for last session's cost and duration
  const projectConfig = getCurrentProjectConfig()
  if (
    projectConfig.lastCost !== undefined &&
    projectConfig.lastDuration !== undefined
  ) {
    logEvent('tengu_exit', {
      last_session_cost: String(projectConfig.lastCost),
      last_session_api_duration: String(projectConfig.lastAPIDuration),
      last_session_duration: String(projectConfig.lastDuration),
      last_session_id: projectConfig.lastSessionId,
    })
  }

  // Check auto-updater permissions
  const autoUpdaterStatus = globalConfig.autoUpdaterStatus ?? 'not_configured'
  if (autoUpdaterStatus === 'not_configured') {
    logEvent('tengu_setup_auto_updater_not_configured', {})
    await new Promise<void>(resolve => {
      render(React.createElement(Doctor, { onDone: () => resolve() }))
    })
  }
}