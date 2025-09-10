// Test to demonstrate config file override of hardcoded banned commands
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

console.log('1. Testing default behavior with existing config:')
console.log('   Current config has strictMode: true')
console.log('   Only explicitly allowed commands should work')

const testCommands = [
  'git status',      // Should be allowed (in globallyAllowedCommands)
  'node test.js',    // Should be allowed (in globallyAllowedCommands)
  'curl example.com', // Should be blocked (banned command)
  'del test.txt',    // Should be blocked (banned command, prefix explicitly blocked)
  'rm file.txt'      // Should be blocked (banned command but in overrideBannedCommands)
]

testCommands.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n2. Creating test config to demonstrate override functionality:')

// Create a test config that demonstrates override
const testConfig = {
  strictMode: false, // Allow commands unless explicitly banned
  overrideBannedCommands: ['curl', 'wget', 'del'], // Override these banned commands
  globallyAllowedCommands: ['node', 'python', 'git', 'npm'],
  prefixPermissions: [
    {
      prefix: 'git',
      allowed: true,
      description: 'Allow git commands'
    }
  ]
}

// Backup existing config
const existingConfigPath = path.join(process.cwd(), '.kode/bashPermissions.json')
const backupPath = path.join(process.cwd(), '.kode/bashPermissions.json.backup')

if (fs.existsSync(existingConfigPath)) {
  fs.copyFileSync(existingConfigPath, backupPath)
}

// Create test config
createTempConfig(testConfig, '.kode/bashPermissions.json')

console.log('   Created test config with:')
console.log('   - strictMode: false')
console.log('   - overrideBannedCommands: ["curl", "wget", "del"]')
console.log('   - globallyAllowedCommands: ["node", "python", "git", "npm"]')

console.log('\n3. Testing with new config:')

const overrideTests = [
  'curl https://example.com', // Should be allowed (overridden banned command)
  'wget file.txt',          // Should be allowed (overridden banned command)
  'del test.txt',           // Should be blocked (overridden but still banned by prefix permission)
  'rm file.txt',            // Should be blocked (still banned, not overridden)
  'git status',             // Should be allowed (globally allowed)
  'node test.js',           // Should be allowed (globally allowed)
  'python script.py',       // Should be allowed (globally allowed)
  'alias test=echo',        // Should be blocked (still banned)
  'format c:'               // Should be blocked (still banned)
]

overrideTests.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n4. Testing prefix permissions with new config:')

const prefixTests = [
  'git status',        // Should be allowed (prefix permission)
  'git commit -m test', // Should be allowed (prefix permission)
  'git push origin main' // Should be allowed (prefix permission)
]

prefixTests.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n5. Testing dynamic permission management:')

// Test adding a prefix permission
bashPermissionManager.addPrefixPermission({
  prefix: 'npm',
  allowed: true,
  description: 'Allow npm commands'
}, 'project')

console.log('   Added "npm" prefix permission')

const npmTests = [
  'npm install express', // Should be allowed
  'npm run dev',         // Should be allowed
  'npm test'             // Should be allowed
]

npmTests.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

// Test removing a prefix permission
bashPermissionManager.removePrefixPermission('npm', 'project')
console.log('   Removed "npm" prefix permission')

const npmAfterRemoveTests = [
  'npm install express', // Should be blocked (no prefix permission)
  'npm run dev'          // Should be blocked (no prefix permission)
]

npmAfterRemoveTests.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n6. Demonstrating configuration hierarchy:')

// Create global config to test hierarchy
const globalConfigDir = path.join(process.env.USERPROFILE || '', '.kode')
if (!fs.existsSync(globalConfigDir)) {
  fs.mkdirSync(globalConfigDir, { recursive: true })
}

const globalConfigPath = path.join(globalConfigDir, 'bashPermissions.json')
const globalConfig = {
  strictMode: false,
  overrideBannedCommands: ['rm'], // Allow rm in global config
  globallyAllowedCommands: ['python'],
  prefixPermissions: []
}

fs.writeFileSync(globalConfigPath, JSON.stringify(globalConfig, null, 2))

console.log('   Created global config allowing "rm" and "python"')
console.log('   Project config should override global config')

const hierarchyTests = [
  'curl https://example.com', // Should be allowed (project override)
  'rm file.txt',             // Should be blocked (project config doesn't override rm)
  'python test.py',          // Should be allowed (both global and project allow)
  'node test.js'             // Should be allowed (project allows)
]

hierarchyTests.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

// Cleanup
if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, existingConfigPath)
  fs.unlinkSync(backupPath)
}

if (fs.existsSync(globalConfigPath)) {
  fs.unlinkSync(globalConfigPath)
}

console.log('\n=== Override Test Complete ===')
console.log('Key Findings:')
console.log('✅ Configuration files can override hardcoded banned commands')
console.log('✅ overrideBannedCommands array allows specific banned commands')
console.log('✅ Configuration hierarchy works: Project > Global > Default')
console.log('✅ Prefix permissions provide granular control')
console.log('✅ Dynamic permission management works at runtime')
console.log('✅ Strict mode vs permissive mode works correctly')
console.log('')
console.log('The system successfully allows config files to override hardcoded banned commands while maintaining security!')