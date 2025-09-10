#!/usr/bin/env node

// 简单的清除功能测试脚本
console.log('🧪 测试清除功能实现');
console.log('====================');

// 测试ANSI序列
console.log('\n测试1: 标准ANSI清除序列');
console.log('生成测试内容...');
console.log('测试行1: 这是第一行测试内容');
console.log('测试行2: 这是第二行测试内容');
console.log('测试行3: 这是第三行测试内容');

setTimeout(() => {
  console.log('\n执行清除...');
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
  console.log('✅ 清除完成！');
  
  console.log('\n测试2: 强制清除序列');
  console.log('生成更多测试内容...');
  for (let i = 1; i <= 5; i++) {
    console.log(`强制测试 ${i}: 用于强制清除的内容`);
  }
  
  setTimeout(() => {
    console.log('\n执行强制清除...');
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m');
    console.log('✅ 强制清除完成！');
    
    console.log('\n测试3: 重置序列');
    console.log('生成带样式的测试内容...');
    console.log('\x1b[31m红色文本\x1b[0m');
    console.log('\x1b[32m绿色文本\x1b[0m');
    console.log('\x1b[1m粗体文本\x1b[0m');
    
    setTimeout(() => {
      console.log('\n执行重置...');
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m\x1b[?1049l');
      console.log('✅ 重置完成！');
      
      console.log('\n🎉 所有清除功能测试完成');
      console.log('测试脚本结束');
    }, 2000);
  }, 2000);
}, 2000);