#!/usr/bin/env node

// 直接测试终端清除功能
const { spawn } = require('child_process');
const path = require('path');

// 模拟终端清除函数
async function testClearFunctions() {
  console.log('🧪 终端清除功能测试开始...\n');
  
  // 生成测试内容
  console.log('=== 测试内容开始 ===');
  for (let i = 1; i <= 5; i++) {
    console.log(`测试行 ${i}: 这是用于验证清除功能的测试内容`);
  }
  console.log('=== 测试内容结束 ===\n');
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('🧹 执行标准终端清除...');
  
  // 使用PowerShell命令清除
  try {
    const { execSync } = require('child_process');
    
    // Windows系统使用cls命令
    if (process.platform === 'win32') {
      execSync('cls', { stdio: 'inherit' });
    } else {
      // Unix系统使用clear命令
      execSync('clear', { stdio: 'inherit' });
    }
    
    console.log('✅ 标准清除完成');
  } catch (error) {
    console.error('❌ 标准清除失败:', error.message);
    
    // 回退到ANSI序列
    console.log('🔄 使用ANSI序列回退方案...');
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
    console.log('✅ ANSI清除完成');
  }
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('💥 执行强制终端清除...');
  try {
    // 使用更激进的清除方式
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H\x1bc');
    console.log('✅ 强制清除完成');
  } catch (error) {
    console.error('❌ 强制清除失败:', error.message);
  }
  
  console.log('\n🎉 所有测试完成！');
  
  // 延迟退出
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// 直接运行
if (require.main === module) {
  testClearFunctions().catch(console.error);
}