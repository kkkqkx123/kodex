import React, { useState, useEffect } from 'react';
import { render, Text, Box, Static } from 'ink';
import { clearTerminal, forceClearTerminal } from '../../utils/terminal.js';

interface Message {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const TerminalClearTest: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addMessage = (text: string, type: Message['type'] = 'info') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type
    };
    setMessages(prev => [...prev.slice(-9), newMessage]);
  };

  const handleTestClearTerminal = async () => {
    setIsTesting(true);
    addMessage('🧹 测试标准终端清理...', 'info');
    
    try {
      const result = await clearTerminal();
      addMessage(`✅ 标准清理完成: ${result}`, 'success');
    } catch (error) {
      addMessage(`❌ 标准清理失败: ${error}`, 'error');
    }
    
    setIsTesting(false);
  };

  const handleTestForceClearTerminal = async () => {
    setIsTesting(true);
    addMessage('💥 测试强制终端清理...', 'info');
    
    try {
      const result = await forceClearTerminal();
      addMessage(`✅ 强制清理完成: ${result}`, 'success');
    } catch (error) {
      addMessage(`❌ 强制清理失败: ${error}`, 'error');
    }
    
    setIsTesting(false);
  };

  useEffect(() => {
    addMessage('🚀 终端清理测试已启动', 'info');
    addMessage('📊 测试clearTerminal和forceClearTerminal', 'info');
  }, []);

  const getColor = (type: Message['type']) => {
    switch (type) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'yellow';
      default: return 'white';
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text color="cyan" bold>🧹 终端清理功能测试</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color="yellow" bold>📋 测试消息:</Text>
        <Static<Message> items={messages} children={(message, index) => (
          <Box key={message.id}>
            <Text color={getColor(message.type) as any}>
              {message.text}
            </Text>
          </Box>
        )} />
      </Box>

      <Box borderStyle="single" padding={1} marginBottom={1} flexDirection="column">
        <Text color="magenta" bold>🎯 测试场景:</Text>
        <Box flexDirection="column" marginTop={1}>
          <Text color="white">• 标准终端清理：clearTerminal()</Text>
          <Text color="white">• 强制终端清理：forceClearTerminal()</Text>
        </Box>
      </Box>

      <Box borderStyle="single" padding={1} flexDirection="column">
        <Text color="green" bold>🎮 控制按钮:</Text>
        <Box flexDirection="column" marginTop={1}>
          <Text color="cyan">1. 测试标准清理</Text>
          <Text color="cyan">2. 测试强制清理</Text>
          <Text color="red">0. 退出测试</Text>
        </Box>
      </Box>

      {isTesting && (
        <Box marginTop={1}>
          <Text color="yellow" bold>⏳ 测试中...</Text>
        </Box>
      )}
    </Box>
  );
};

export const runTerminalClearTest = () => {
  console.clear();
  console.log('启动终端清理测试...');
  
  const { unmount } = render(<TerminalClearTest />);
  
  const handleKeyPress = (key: string) => {
    switch (key) {
      case '1':
        clearTerminal();
        break;
      case '2':
        forceClearTerminal();
        break;
      case '0':
        unmount();
        console.log('终端测试完成，退出...');
        process.exit(0);
        break;
    }
  };

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (data) => {
    const key = data.toString();
    handleKeyPress(key);
  });

  setTimeout(() => {
    unmount();
    console.log('终端测试超时，自动退出...');
    process.exit(0);
  }, 60000);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runTerminalClearTest();
}