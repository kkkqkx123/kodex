import { existsSync, readFileSync, writeFileSync } from 'fs'
import { cloneDeep, pick } from 'lodash-es'
import { ConfigParseError } from '../errors'
import { debug as debugLogger } from '../debugLogger'
import { logEvent } from '../../services/featureFlags'
import type { GlobalConfig, ProjectConfig, AutoUpdaterStatus } from './types'
import { DEFAULT_GLOBAL_CONFIG, GLOBAL_CONFIG_KEYS, PROJECT_CONFIG_KEYS } from './defaults'
import { GLOBAL_CLAUDE_FILE } from '../env'

// Flag to track if config reading is allowed
let configReadingAllowed = false

export function enableConfigs(): void {
  // Any reads to configuration before this flag is set show an console warning
  // to prevent us from adding config reading during module initialization
  configReadingAllowed = true
  // We only check the global config because currently all the configs share a file
  getConfig(
    GLOBAL_CLAUDE_FILE,
    DEFAULT_GLOBAL_CONFIG,
    true /* throw on invalid */,
  )
}

export function getConfig<A>(
  file: string,
  defaultConfig: A,
  throwOnInvalid?: boolean,
): A {
  // 简化配置访问逻辑，移除复杂的时序检查

  debugLogger.state('CONFIG_LOAD_START', {
    file,
    fileExists: String(existsSync(file)),
    throwOnInvalid: String(!!throwOnInvalid),
  })

  if (!existsSync(file)) {
    debugLogger.state('CONFIG_LOAD_DEFAULT', {
      file,
      reason: 'file_not_exists',
      defaultConfigKeys: Object.keys(defaultConfig as object).join(', '),
    })
    return cloneDeep(defaultConfig)
  }

  try {
    const fileContent = readFileSync(file, 'utf-8')
    debugLogger.state('CONFIG_FILE_READ', {
      file,
      contentLength: String(fileContent.length),
      contentPreview:
        fileContent.substring(0, 100) + (fileContent.length > 100 ? '...' : ''),
    })

    try {
      const parsedConfig = JSON.parse(fileContent)
      debugLogger.state('CONFIG_JSON_PARSED', {
        file,
        parsedKeys: Object.keys(parsedConfig).join(', '),
      })

      // Handle backward compatibility - remove logic for deleted fields
      const finalConfig = {
        ...cloneDeep(defaultConfig),
        ...parsedConfig,
      }

      debugLogger.state('CONFIG_LOAD_SUCCESS', {
        file,
        finalConfigKeys: Object.keys(finalConfig as object).join(', '),
      })

      return finalConfig
    } catch (error) {
      // Throw a ConfigParseError with the file path and default config
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      debugLogger.error('CONFIG_JSON_PARSE_ERROR', {
        file,
        errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        contentLength: String(fileContent.length),
      })

      throw new ConfigParseError(errorMessage, file, defaultConfig)
    }
  } catch (error: unknown) {
    // Re-throw ConfigParseError if throwOnInvalid is true
    if (error instanceof ConfigParseError && throwOnInvalid) {
      debugLogger.error('CONFIG_PARSE_ERROR_RETHROWN', {
        file,
        throwOnInvalid: String(throwOnInvalid),
        errorMessage: error.message,
      })
      throw error
    }

    debugLogger.warn('CONFIG_FALLBACK_TO_DEFAULT', {
      file,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      action: 'using_default_config',
    })

    return cloneDeep(defaultConfig)
  }
}

export function saveConfig<A extends object>(
  file: string,
  config: A,
  defaultConfig: A,
): void {
  // Filter out any values that match the defaults
  const filteredConfig = Object.fromEntries(
    Object.entries(config).filter(
      ([key, value]) =>
        JSON.stringify(value) !== JSON.stringify(defaultConfig[key as keyof A]),
    ),
  )
  writeFileSync(file, JSON.stringify(filteredConfig, null, 2), 'utf-8')
}

export function isAutoUpdaterStatus(value: string): value is AutoUpdaterStatus {
  return ['disabled', 'enabled', 'no_permissions', 'not_configured'].includes(
    value as AutoUpdaterStatus,
  )
}

export function isGlobalConfigKey(key: string): key is keyof GlobalConfig {
  return GLOBAL_CONFIG_KEYS.includes(key as typeof GLOBAL_CONFIG_KEYS[number])
}

export function isProjectConfigKey(key: string): key is keyof ProjectConfig {
  return PROJECT_CONFIG_KEYS.includes(key as typeof PROJECT_CONFIG_KEYS[number])
}

export function getConfigForCLI(key: string, global: boolean): unknown {
  logEvent('tengu_config_get', {
    key,
    global: global?.toString() ?? 'false',
  })
  if (global) {
    if (!isGlobalConfigKey(key)) {
      console.error(
        `Error: '${key}' is not a valid config key. Valid keys are: ${GLOBAL_CONFIG_KEYS.join(', ')}`,
      )
      process.exit(1)
    }
    // Use getConfig directly to avoid circular dependency
    const config = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
    return config[key]
  } else {
    if (!isProjectConfigKey(key)) {
      console.error(
        `Error: '${key}' is not a valid config key. Valid keys are: ${PROJECT_CONFIG_KEYS.join(', ')}`,
      )
      process.exit(1)
    }
    // Use getConfig directly to avoid circular dependency
    const config = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
    const absolutePath = require('path').resolve(require('../state').getCwd())
    return config.projects?.[absolutePath]?.[key]
  }
}

export function setConfigForCLI(
  key: string,
  value: unknown,
  global: boolean,
): void {
  logEvent('tengu_config_set', {
    key,
    global: global?.toString() ?? 'false',
  })
  if (global) {
    if (!isGlobalConfigKey(key)) {
      console.error(
        `Error: Cannot set '${key}'. Only these keys can be modified: ${GLOBAL_CONFIG_KEYS.join(', ')}`,
      )
      process.exit(1)
    }

    if (key === 'autoUpdaterStatus' && !isAutoUpdaterStatus(value as string)) {
      console.error(
        `Error: Invalid value for autoUpdaterStatus. Must be one of: disabled, enabled, no_permissions, not_configured`,
      )
      process.exit(1)
    }

    // Use getConfig and saveConfig directly to avoid circular dependency
    const currentConfig = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
    saveConfig(
      GLOBAL_CLAUDE_FILE,
      {
        ...currentConfig,
        [key]: value,
      },
      DEFAULT_GLOBAL_CONFIG,
    )
  } else {
    if (!isProjectConfigKey(key)) {
      console.error(
        `Error: Cannot set '${key}'. Only these keys can be modified: ${PROJECT_CONFIG_KEYS.join(', ')}. Did you mean --global?`,
      )
      process.exit(1)
    }
    // Use getConfig and saveConfig directly to avoid circular dependency
    const currentConfig = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
    const absolutePath = require('path').resolve(require('../state').getCwd())
    saveConfig(
      GLOBAL_CLAUDE_FILE,
      {
        ...currentConfig,
        projects: {
          ...currentConfig.projects,
          [absolutePath]: {
            ...(currentConfig.projects?.[absolutePath] || {}),
            [key]: value,
          },
        },
      },
      DEFAULT_GLOBAL_CONFIG,
    )
  }
  // Wait for the output to be flushed, to avoid clearing the screen.
  setTimeout(() => {
    // Without this we hang indefinitely.
    process.exit(0)
  }, 100)
}

export function deleteConfigForCLI(key: string, global: boolean): void {
  logEvent('tengu_config_delete', {
    key,
    global: global?.toString() ?? 'false',
  })
  if (global) {
    if (!isGlobalConfigKey(key)) {
      console.error(
        `Error: Cannot delete '${key}'. Only these keys can be modified: ${GLOBAL_CONFIG_KEYS.join(', ')}`,
      )
      process.exit(1)
    }
    // Use getConfig and saveConfig directly to avoid circular dependency
    const currentConfig = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
    delete currentConfig[key]
    saveConfig(
      GLOBAL_CLAUDE_FILE,
      currentConfig,
      DEFAULT_GLOBAL_CONFIG,
    )
  } else {
    if (!isProjectConfigKey(key)) {
      console.error(
        `Error: Cannot delete '${key}'. Only these keys can be modified: ${PROJECT_CONFIG_KEYS.join(', ')}. Did you mean --global?`,
      )
      process.exit(1)
    }
    // Use getConfig and saveConfig directly to avoid circular dependency
    const currentConfig = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
    const absolutePath = require('path').resolve(require('../state').getCwd())
    const projectConfig = currentConfig.projects?.[absolutePath] || {}
    delete projectConfig[key]
    saveConfig(
      GLOBAL_CLAUDE_FILE,
      {
        ...currentConfig,
        projects: {
          ...currentConfig.projects,
          [absolutePath]: projectConfig,
        },
      },
      DEFAULT_GLOBAL_CONFIG,
    )
  }
}

export function listConfigForCLI(global: true): GlobalConfig
export function listConfigForCLI(global: false): ProjectConfig
export function listConfigForCLI(global: boolean): object {
  logEvent('tengu_config_list', {
    global: global?.toString() ?? 'false',
  })
  if (global) {
    // Use getConfig directly to avoid circular dependency
    const currentConfig = pick(getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG), GLOBAL_CONFIG_KEYS)
    return currentConfig
  } else {
    // Use getConfig directly to avoid circular dependency
    const config = getConfig(GLOBAL_CLAUDE_FILE, DEFAULT_GLOBAL_CONFIG)
    const absolutePath = require('path').resolve(require('../state').getCwd())
    const projectConfig = config.projects?.[absolutePath] || {}
    return pick(projectConfig, PROJECT_CONFIG_KEYS)
  }
}

// Import these functions from other modules to avoid circular dependencies
// These imports are at the bottom to avoid circular dependency issues