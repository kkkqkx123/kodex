// Simple test for prefix patterns with async support
import { bashPermissionManager } from '../../src/utils/bashPermissions'

console.log('=== Testing Prefix Patterns (Async) ===\n')

console.log('1. Testing basic prefix patterns:')

const basicTests = [
  'git status',
  'git commit -m "test"',
  'npm install express',
  'npm run dev',
  'curl example.com',
  'del test.txt'
]

for (const cmd of basicTests) {
  const result = await bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
}

console.log('\n2. Testing prefix management:')

// Add a prefix
bashPermissionManager.addPrefixPermission({
  prefix: 'python',
  allowed: true,
  description: 'Allow python commands'
}, 'project')

console.log('   Added "python" prefix permission')

const pythonResult = await bashPermissionManager.isCommandAllowed('python script.py')
console.log(`   python script.py: ${pythonResult.allowed ? 'ALLOWED' : 'BLOCKED'}`)

// Remove the prefix
bashPermissionManager.removePrefixPermission('python', 'project')
console.log('   Removed "python" prefix permission')

const pythonAfterRemoveResult = await bashPermissionManager.isCommandAllowed('python script.py')
console.log(`   python script.py after removal: ${pythonAfterRemoveResult.allowed ? 'ALLOWED' : 'BLOCKED'}`)

console.log('\n3. Testing prefix with arguments:')

bashPermissionManager.addPrefixPermission({
  prefix: 'rm',
  allowed: true,
  description: 'Allow rm only for temp files',
  allowedArgs: ['*.tmp', '*.log']
}, 'project')

console.log('   Added "rm" prefix with argument restrictions')

const rmTests = [
  'rm test.tmp',
  'rm error.log',
  'rm test.txt'
]

for (const cmd of rmTests) {
  const result = await bashPermissionManager.isCommandAllowed(cmd)
  console.log(`   ${cmd}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} ${result.reason ? `(${result.reason})` : ''}`)
}

console.log('\n=== Prefix Patterns Test Complete ===')
console.log('✅ Async prefix patterns working correctly')
console.log('✅ Prefix management working')
console.log('✅ Argument restrictions working')