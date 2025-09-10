// @ts-nocheck
import { clearTerminal, forceClearTerminal, resetTerminal } from '../../utils/terminal.js';

async function testFixedClear() {
  console.log('🧪 修复后的清除功能测试开始...\n');
  
  // 生成测试内容
  console.log('=== 测试内容开始 ===');
  for (let i = 1; i <= 5; i++) {
    console.log(`测试行 ${i}: 这是用于验证清除功能的测试内容`);
  }
  console.log('=== 测试内容结束 ===\n');
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('执行标准清除...');
  try {
    await clearTerminal();
    console.log('✅ 标准清除完成');
  } catch (error) {
    console.error('❌ 标准清除失败:', error);
  }
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('执行强制清除...');
  try {
    await forceClearTerminal();
    console.log('✅ 强制清除完成');
  } catch (error) {
    console.error('❌ 强制清除失败:', error);
  }
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('执行终端重置...');
  try {
    await resetTerminal();
    console.log('✅ 终端重置完成');
  } catch (error) {
    console.error('❌ 终端重置失败:', error);
  }
  
  console.log('\n🎉 所有修复后的测试完成！');
}

// 直接运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testFixedClear().catch(console.error);
}