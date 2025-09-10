// Test script for the new bash permission system
import { bashPermissionManager } from '../../src/utils/bashPermissions'

console.log('=== Testing New Bash Permission System ===\n')

// Test cases
const testCommands = [
  'del test.txt',
  'rm test.txt',
  'git status',
  'git commit -m "test"',
  'npm install',
  'bun run dev',
  'curl https://example.com',
  'ls -la',
  'format c:',
  'node test.js',
  'python script.py'
]

console.log('1. Testing command permissions with current config:')
testCommands.forEach(cmd => {
  const result = bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
})

console.log('\n2. Testing prefix permission management:')

// Add a test prefix permission
bashPermissionManager.addPrefixPermission({
  prefix: 'git',
  allowed: true,
  description: 'Allow all git commands'
}, 'project')

console.log('   Added "git" prefix permission')

// Test git command again
const gitResult = bashPermissionManager.isCommandAllowed('git push origin main')
console.log(`   git push origin main: ${gitResult.allowed ? 'ALLOWED' : 'BLOCKED'}`)

console.log('\n3. Testing configuration structure:')

const config = bashPermissionManager.getMergedConfig()
console.log(`   Strict mode: ${config.strictMode}`)
console.log(`   Override banned commands: ${config.overrideBannedCommands?.join(', ') || 'none'}`)
console.log(`   Globally allowed commands: ${config.globallyAllowedCommands?.join(', ') || 'none'}`)
console.log(`   Prefix permissions: ${config.prefixPermissions?.length || 0}`)

console.log('\n4. Testing configuration hierarchy:')
console.log('   Project config path: .kode/bashPermissions.json')
console.log('   Global config path: ~/.kode/bashPermissions.json')
console.log('   Priority: Project > Global > Default')

console.log('\n=== Test Complete ===')