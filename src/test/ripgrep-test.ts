import { ripGrep } from '../utils/ripgrep'
import { resolve } from 'path'

async function testRipGrep() {
  try {
    const testPath = resolve('src/test/grep-test')
    console.log('Testing basic search for "test" in', testPath)
    const results = await ripGrep(['-i', 'test'], testPath, new AbortController().signal)
    console.log('Results:', results)
    
    console.log('\nTesting glob pattern "*.ts"')
    const tsResults = await ripGrep(['-i', '--glob', '*.ts', 'test'], testPath, new AbortController().signal)
    console.log('TS Results:', tsResults)
    
    console.log('\nTesting multi-extension glob pattern "*.{ts,tsx}"')
    const multiResults = await ripGrep(['-i', '--glob', '*.{ts,tsx}', 'test'], testPath, new AbortController().signal)
    console.log('Multi-extension Results:', multiResults)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testRipGrep()