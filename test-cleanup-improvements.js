#!/usr/bin/env node

/**
 * 测试清理机制改进的脚本
 * 验证新的清理函数是否正常工作
 */

const { clearTerminal, completeTerminalCleanup, ultraTerminalCleanup, clearScrollBuffer, smartTerminalCleanup } = require('./dist/utils/terminal.js');

async function testCleanupFunctions() {
  console.log('🧪 开始测试清理机制改进...\n');
  
  try {
    console.log('1. 测试标准清理...');
    await clearTerminal();
    console.log('✅ 标准清理完成\n');
    
    console.log('2. 测试完整清理...');
    await completeTerminalCleanup();
    console.log('✅ 完整清理完成\n');
    
    console.log('3. 测试超激进清理...');
    await ultraTerminalCleanup();
    console.log('✅ 超激进清理完成\n');
    
    console.log('4. 测试滚动缓冲区清理...');
    await clearScrollBuffer();
    console.log('✅ 滚动缓冲区清理完成\n');
    
    console.log('5. 测试智能清理（模拟少量内容）...');
    await smartTerminalCleanup(3);
    console.log('✅ 智能清理（少量内容）完成\n');
    
    console.log('6. 测试智能清理（模拟大量内容）...');
    await smartTerminalCleanup(15);
    console.log('✅ 智能清理（大量内容）完成\n');
    
    console.log('🎉 所有清理测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testCleanupFunctions();
}