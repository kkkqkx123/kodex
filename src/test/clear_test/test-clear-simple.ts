import { clearTerminal, forceClearTerminal, resetTerminal } from '../../utils/terminal';

async function testClearFunctions() {
  console.log('🧪 开始测试清除功能...\n');
  
  // 测试标准清除
  console.log('1. 测试标准清除...');
  try {
    await clearTerminal();
    console.log('✅ 标准清除成功');
  } catch (error) {
    console.error('❌ 标准清除失败:', error);
  }
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试强制清除
  console.log('2. 测试强制清除...');
  try {
    await forceClearTerminal();
    console.log('✅ 强制清除成功');
  } catch (error) {
    console.error('❌ 强制清除失败:', error);
  }
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试重置
  console.log('3. 测试终端重置...');
  try {
    await resetTerminal();
    console.log('✅ 终端重置成功');
  } catch (error) {
    console.error('❌ 终端重置失败:', error);
  }
  
  console.log('\n🎉 所有测试完成！');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testClearFunctions().catch(console.error);
}