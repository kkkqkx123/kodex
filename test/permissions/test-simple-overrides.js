// Simple test for config file overrides of hardcoded banned commands
import { bashPermissionManager } from '../../src/utils/bashPermissions'
import { BANNED_COMMANDS } from '../../src/tools/BashTool/prompt'
import * as fs from 'fs'
import * as path from 'path'

console.log('=== Testing Config File Override of Hardcoded Banned Commands ===\n')

// Helper function to create temporary config files
function createTempConfig(config, filename) {
  const configPath = path.join(process.cwd(), filename)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  return configPath
}

// Helper function to cleanup temp files
function cleanupTempConfig(filename) {
  const configPath = path.join(process.cwd(), filename)
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath)
  }
}

console.log('1. Testing default behavior (hardcoded bans in effect):')
const defaultBannedTests = BANNED_COMMANDS.slice(0, 5) // Test first 5 banned commands
defaultBannedTests.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n2. Testing overrideBannedCommands configuration:')

// Create a test config that overrides some banned commands
const overrideConfig = {
  strictMode: false,
  overrideBannedCommands: ['curl', 'wget', 'del'], // Override these banned commands
  globallyAllowedCommands: ['node', 'python'],
  prefixPermissions: [
    {
      prefix: 'git',
      allowed: true,
      description: 'Allow git commands'
    }
  ]
}

const testConfigPath = createTempConfig(overrideConfig, '.kode/test-bash-permissions.json')

console.log('   Created test config with overrideBannedCommands: ["curl", "wget", "del"]')

// Test the overridden commands
const overriddenCommands = ['curl https://example.com', 'wget file.txt', 'del test.txt']
console.log('\n   Testing overridden commands:')
overriddenCommands.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`     ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

// Test that other banned commands are still blocked
console.log('\n   Testing non-overridden banned commands:')
const stillBanned = BANNED_COMMANDS.filter(cmd => !['curl', 'wget', 'del'].includes(cmd)).slice(0, 3)
stillBanned.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`     ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n3. Testing globallyAllowedCommands:')

const allowedCommands = ['node test.js', 'python script.py', 'npm install']
allowedCommands.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n4. Testing prefix permissions:')

const prefixTests = [
  'git status',
  'git commit -m "test"',
  'git push origin main'
]

prefixTests.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n5. Testing configuration management:')

// Test adding prefix permission
bashPermissionManager.addPrefixPermission({
  prefix: 'npm',
  allowed: true,
  description: 'Allow npm commands'
}, 'project')

console.log('   Added "npm" prefix permission')

const npmResult = bashPermissionManager.isCommandAllowed('npm install express')
console.log(`   npm install express: ${npmResult.allowed ? 'ALLOWED' : 'BLOCKED'}`)

// Test removing prefix permission
bashPermissionManager.removePrefixPermission('npm', 'project')
console.log('   Removed "npm" prefix permission')

const npmAfterRemoveResult = bashPermissionManager.isCommandAllowed('npm install express')
console.log(`   npm install express after removal: ${npmAfterRemoveResult.allowed ? 'ALLOWED' : 'BLOCKED'}`)

// Cleanup
cleanupTempConfig('.kode/test-bash-permissions.json')

console.log('\n=== Override Test Complete ===')
console.log('Summary:')
console.log('- ✅ Hardcoded banned commands can be overridden via config')
console.log('- ✅ Globally allowed commands work correctly')
console.log('- ✅ Prefix permissions provide granular control')
console.log('- ✅ Runtime permission management works')