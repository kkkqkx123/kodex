import { clearTerminal, forceClearTerminal, resetTerminal } from '../../utils/terminal.js';

async function testClearFunctions() {
  console.log('🧪 开始测试清除功能...\n');
  
  // 生成一些测试输出
  console.log('=== 测试输出开始 ===');
  for (let i = 1; i <= 10; i++) {
    console.log(`测试行 ${i}: 这是第 ${i} 行测试内容，用于验证清除功能`);
  }
  console.log('=== 测试输出结束 ===\n');
  
  console.log('等待2秒后进行标准清除...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    await clearTerminal();
    console.log('✅ 标准清除完成');
  } catch (error) {
    console.error('❌ 标准清除失败:', error);
  }
  
  console.log('再次生成测试输出...');
  for (let i = 1; i <= 5; i++) {
    console.log(`强制测试 ${i}: 这是用于强制清除的测试内容`);
  }
  
  console.log('等待2秒后进行强制清除...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    await forceClearTerminal();
    console.log('✅ 强制清除完成');
  } catch (error) {
    console.error('❌ 强制清除失败:', error);
  }
  
  console.log('生成一些带格式的测试输出...');
  console.log('\x1b[31m红色文本\x1b[0m');
  console.log('\x1b[32m绿色文本\x1b[0m');
  console.log('\x1b[1m粗体文本\x1b[0m');
  
  console.log('等待2秒后进行重置...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    await resetTerminal();
    console.log('✅ 终端重置完成');
  } catch (error) {
    console.error('❌ 终端重置失败:', error);
  }
  
  console.log('\n🎉 所有清除功能测试完成！');
  console.log('如果看到清除后的新内容，说明功能正常');
}

// 直接运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testClearFunctions().catch(console.error);
}