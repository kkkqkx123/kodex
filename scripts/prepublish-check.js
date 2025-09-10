#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Pre-publish checks...\n');

// Check required files
const requiredFiles = ['cli.js', 'package.json', 'yoga.wasm', '.npmrc'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles.join(', '));
  console.error('   Run "bun run build" first');
  process.exit(1);
}

// Check cli.js is executable (skip on Windows as it doesn't use Unix permissions)
if (process.platform !== 'win32') {
  const cliStats = fs.statSync('cli.js');
  if (!(cliStats.mode & 0o100)) {
    console.error('❌ cli.js is not executable');
    process.exit(1);
  }
}

// Check package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (!pkg.bin || !pkg.bin.kode) {
  console.error('❌ Missing bin field in package.json');
  process.exit(1);
}

// Skip bundled check if SKIP_BUNDLED_CHECK is set (for publish workaround)
if (process.env.SKIP_BUNDLED_CHECK !== 'true') {
  if (!pkg.bundledDependencies || !pkg.bundledDependencies.includes('tsx')) {
    console.error('❌ tsx not in bundledDependencies');
    process.exit(1);
  }
}

console.log('✅ All checks passed!');
console.log('\n📋 Package info:');
console.log(`   Name: ${pkg.name}`);
console.log(`   Version: ${pkg.version}`);
console.log(`   Main: ${pkg.main}`);
console.log(`   Bin: kode -> ${pkg.bin.kode}`);
console.log('\n🚀 Ready to publish!');
console.log('   Run: npm publish');