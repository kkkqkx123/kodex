import React, { useState, useEffect } from 'react';
import { render, Text, Box } from 'ink';
import { clearTerminal, forceClearTerminal } from '../../utils/terminal.js';

const SimpleClearTest: React.FC = () => {
  const [status, setStatus] = useState<string>('准备中...');
  const [testStep, setTestStep] = useState<number>(0);

  useEffect(() => {
    const runTests = async () => {
      // 步骤1: 显示初始内容
      setStatus('🧪 正在生成测试内容...');
      setTestStep(1);
      
      console.log('=== 测试内容开始 ===');
      for (let i = 1; i <= 3; i++) {
        console.log(`测试行 ${i}: 清除功能验证`);
      }
      console.log('=== 测试内容结束 ===');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 步骤2: 测试标准清除
      setStatus('🧹 执行标准终端清除...');
      setTestStep(2);
      
      try {
        await clearTerminal();
        setStatus('✅ 标准清除完成');
      } catch (error) {
        setStatus(`❌ 标准清除失败: ${error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 步骤3: 测试强制清除
      setStatus('💥 执行强制终端清除...');
      setTestStep(3);
      
      try {
        await forceClearTerminal();
        setStatus('✅ 强制清除完成');
      } catch (error) {
        setStatus(`❌ 强制清除失败: ${error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 步骤4: 完成
      setStatus('🎉 所有测试完成！');
      setTestStep(4);
      
      // 3秒后退出
      setTimeout(() => {
        process.exit(0);
      }, 3000);
    };

    runTests();
  }, []);

  return (
    <Box flexDirection="column" padding={2}>
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text color="cyan" bold>🧹 终端清除功能测试</Text>
      </Box>
      
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text color="yellow">{status}</Text>
      </Box>
      
      <Box flexDirection="column">
        <Text color="green">测试步骤:</Text>
        <Text color={testStep >= 1 ? 'green' : 'gray'}>  1. 生成测试内容</Text>
        <Text color={testStep >= 2 ? 'green' : 'gray'}>  2. 标准清除测试</Text>
        <Text color={testStep >= 3 ? 'green' : 'gray'}>  3. 强制清除测试</Text>
        <Text color={testStep >= 4 ? 'green' : 'gray'}>  4. 测试完成</Text>
      </Box>
    </Box>
  );
};

export const runSimpleClearTest = () => {
  console.clear();
  console.log('🚀 启动简化版终端清除测试...\n');
  
  const { unmount } = render(<SimpleClearTest />);
  
  // 设置超时保护，30秒后强制退出
  setTimeout(() => {
    try {
      unmount();
    } catch (e) {
      // 忽略卸载错误
    }
    console.log('\n⏰ 测试超时，自动退出...');
    process.exit(0);
  }, 30000);
};

// 直接运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runSimpleClearTest();
}