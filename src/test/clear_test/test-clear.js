// 简单的清除功能测试
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testClearFunctions() {
  console.log('🧪 开始测试清除功能...');
  console.log('在真实环境中测试...\n');
  
  // 打印一些测试内容
  console.log('测试内容1: 这是一些测试输出');
  console.log('测试内容2: 更多测试数据');
  console.log('测试内容3: 应该被清除的内容\n');
  
  console.log('等待3秒后进行清除...');
  
  // 等待3秒
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 使用ANSI序列清除
  console.log('\x1b[2J\x1b[3J\x1b[H');
  
  console.log('✅ 清除完成！');
  console.log('如果看到清除后的新内容，说明清除功能正常');
}

testClearFunctions().catch(console.error);