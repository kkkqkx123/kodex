import React from 'react'
import { memoize } from 'lodash-es'
import { logError } from '../utils/log'

// Simple feature flag implementation to replace statsig
export const logEvent = (
  eventName: string,
  metadata: { [key: string]: string | undefined },
): void => {
  // No-op implementation for event logging
  if (process.argv.includes('--debug') || process.argv.includes('-d')) {
    console.log(`[DEBUG] Event: ${eventName}`, metadata)
  }
}

export const checkGate = memoize(async (gateName: string): Promise<boolean> => {
  // Default to false for all gates
  return false
})

export const useStatsigGate = (gateName: string, defaultValue = false) => {
  // Simple React hook implementation
  return defaultValue
}

export const getExperimentValue = memoize(
  async <T>(experimentName: string, defaultValue: T): Promise<T> => {
    return defaultValue
  },
)

export const getDynamicConfig = async <T>(
  configName: string,
  defaultValue: T,
): Promise<T> => {
  return defaultValue
}

export function getGateValues(): Record<string, boolean> {
  return {}
}