import { clearTerminal, forceClearTerminal, resetTerminal } from '../../utils/terminal';

// 模拟AI输出内容
interface AIMessage {
  type: string;
  message: { content: string };
  uuid: string;
}

interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
  id: string;
}

// 模拟生成AI响应
function simulateAIResponse(): string {
  return `
🤖 AI: Hello! I'm here to help you with your development tasks.
    I can assist with code review, debugging, and various programming challenges.
    
    Here's what I can do:
    • Analyze your code for potential issues
    • Suggest improvements and optimizations
    • Help debug complex problems
    • Provide detailed explanations
    
    Let me know how I can assist you today!
  `;
}

// 模拟工具调用
function simulateToolCall(): ToolCall {
  return {
    name: 'search_codebase',
    parameters: {
      query: 'terminal cleanup functions',
      include_pattern: ['*.js', '*.ts'],
      max_results: 10
    },
    id: 'tool_12345'
  };
}

// 模拟警告信息
function simulateWarning(): string {
  return `
⚠️  WARNING: Terminal cleanup may affect user experience
    Location: src/utils/terminal.ts:45
    Issue: Static components not being properly cleared
    
    Recommendation: Use forceClearTerminal() for stubborn content
  `;
}

// 模拟错误信息
function simulateError(): string {
  return `
❌ ERROR: Failed to clear terminal content
    Type: ClearTerminalError
    Message: Unable to clear Static components
    Stack: Error: Static component cleanup failed
           at clearTerminal (src/utils/terminal.ts:78)
           at processTicksAndRejections (node:internal/process/task_queues:95)
  `;
}

// 测试标准清理
async function testStandardClear(): Promise<void> {
  console.log('\n🧹 Testing standard terminal cleanup...');
  console.log(simulateAIResponse());
  console.log('Tool call:', JSON.stringify(simulateToolCall(), null, 2));
  console.log(simulateWarning());
  
  console.log('Performing standard cleanup...');
  await clearTerminal();
  console.log('✅ Standard cleanup completed');
}

// 测试强制清理
async function testForceClear(): Promise<void> {
  console.log('\n💥 Testing force terminal cleanup...');
  console.log(simulateAIResponse());
  console.log(simulateError());
  console.log('Tool call:', JSON.stringify(simulateToolCall(), null, 2));
  
  console.log('Performing force cleanup...');
  await forceClearTerminal();
  console.log('✅ Force cleanup completed');
}

// 测试重置终端
async function testResetTerminal(): Promise<void> {
  console.log('\n🔄 Testing terminal reset...');
  console.log(simulateAIResponse());
  console.log(simulateWarning());
  console.log(simulateError());
  
  console.log('Resetting terminal...');
  await resetTerminal();
  console.log('✅ Terminal reset completed');
}

// 模拟REPL场景
async function simulateREPLScenario(): Promise<void> {
  console.log('\n🎯 Simulating REPL cleanup scenario...');
  
  // 模拟用户输入
  console.log('> User: Can you help me debug this issue?');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟AI响应
  console.log(simulateAIResponse());
  console.log('Tool call:', JSON.stringify(simulateToolCall(), null, 2));
  
  // 模拟工具执行
  console.log('🔍 Searching codebase...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 模拟结果
  console.log('Found 5 relevant files');
  console.log(simulateWarning());
  
  // 清理终端
  console.log('Cleaning up terminal...');
  await clearTerminal();
  console.log('✅ REPL scenario cleanup completed');
}

// 压力测试
async function stressTest(): Promise<void> {
  console.log('\n🔥 Running stress test...');
  
  const iterations = 5;
  for (let i = 1; i <= iterations; i++) {
    console.log(`\nStress test iteration ${i}/${iterations}:`);
    console.log(simulateAIResponse());
    
    if (i % 3 === 0) {
      await forceClearTerminal();
      console.log('Used forceClearTerminal()');
    } else if (i % 2 === 0) {
      await resetTerminal();
      console.log('Used resetTerminal()');
    } else {
      await clearTerminal();
      console.log('Used clearTerminal()');
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('✅ Stress test completed');
}

// 运行所有测试
async function runAllTests(): Promise<void> {
  console.log('🚀 AI Output Cleanup Test Suite');
  console.log('Testing terminal cleanup with realistic AI outputs...\n');
  
  try {
    await testStandardClear();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testForceClear();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testResetTerminal();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await simulateREPLScenario();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await stressTest();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testStandardClear,
  testForceClear,
  testResetTerminal,
  simulateREPLScenario,
  stressTest,
  runAllTests
};