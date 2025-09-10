import { expect, test, describe } from 'bun:test'
import type { PermissionHandlingOption, ProjectConfig } from '../../src/utils/config/types'
import { DEFAULT_PROJECT_CONFIG } from '../../src/utils/config/defaults'

describe('Permission Handling Configuration', () => {
  test('should define PermissionHandlingOption type correctly', () => {
    const permissionHandling: PermissionHandlingOption = {
      grantSession: true,
      grantProject: true,
      grantOnce: true,
      reject: true,
      skip: true,
      defaultAction: 'grantSession'
    }

    expect(permissionHandling.grantSession).toBe(true)
    expect(permissionHandling.grantProject).toBe(true)
    expect(permissionHandling.grantOnce).toBe(true)
    expect(permissionHandling.reject).toBe(true)
    expect(permissionHandling.skip).toBe(true)
    expect(permissionHandling.defaultAction).toBe('grantSession')
  })

  test('should include permissionHandling in ProjectConfig', () => {
    const projectConfig: ProjectConfig = {
      ...DEFAULT_PROJECT_CONFIG,
      permissionHandling: {
        grantSession: true,
        grantProject: false,
        grantOnce: true,
        reject: false,
        skip: true,
        defaultAction: 'grantOnce'
      }
    }

    expect(projectConfig.permissionHandling).toBeDefined()
    expect(projectConfig.permissionHandling?.grantSession).toBe(true)
    expect(projectConfig.permissionHandling?.grantProject).toBe(false)
    expect(projectConfig.permissionHandling?.grantOnce).toBe(true)
    expect(projectConfig.permissionHandling?.reject).toBe(false)
    expect(projectConfig.permissionHandling?.skip).toBe(true)
    expect(projectConfig.permissionHandling?.defaultAction).toBe('grantOnce')
  })

  test('should include sessionAllowedTools in ProjectConfig', () => {
    const projectConfig: ProjectConfig = {
      ...DEFAULT_PROJECT_CONFIG,
      sessionAllowedTools: ['test-tool-1', 'test-tool-2']
    }

    expect(projectConfig.sessionAllowedTools).toBeDefined()
    expect(Array.isArray(projectConfig.sessionAllowedTools)).toBe(true)
    expect(projectConfig.sessionAllowedTools?.length).toBe(2)
    expect(projectConfig.sessionAllowedTools?.[0]).toBe('test-tool-1')
    expect(projectConfig.sessionAllowedTools?.[1]).toBe('test-tool-2')
  })

  test('should include onceAllowedTools in ProjectConfig', () => {
    const timestamp = Date.now()
    const projectConfig: ProjectConfig = {
      ...DEFAULT_PROJECT_CONFIG,
      onceAllowedTools: {
        'test-tool-1': timestamp,
        'test-tool-2': timestamp + 1000
      }
    }

    expect(projectConfig.onceAllowedTools).toBeDefined()
    expect(typeof projectConfig.onceAllowedTools).toBe('object')
    expect(projectConfig.onceAllowedTools?.['test-tool-1']).toBe(timestamp)
    expect(projectConfig.onceAllowedTools?.['test-tool-2']).toBe(timestamp + 1000)
  })

  test('should have all permission handling options as optional except defaultAction', () => {
    const permissionHandling: PermissionHandlingOption = {
      defaultAction: 'reject'
    }

    expect(permissionHandling.grantSession).toBeUndefined()
    expect(permissionHandling.grantProject).toBeUndefined()
    expect(permissionHandling.grantOnce).toBeUndefined()
    expect(permissionHandling.reject).toBeUndefined()
    expect(permissionHandling.skip).toBeUndefined()
    expect(permissionHandling.defaultAction).toBe('reject')
  })
})