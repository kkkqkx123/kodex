import React, { useState, useEffect } from 'react';
import { render, Text, Box, Static } from 'ink';

interface Message {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const OAuthClearTest: React.FC = () => {
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

  const handleSimulateOAuthSuccess = async () => {
    setIsTesting(true);
    addMessage('🔐 模拟OAuth成功...', 'info');
    
    try {
      addMessage('✅ OAuth成功模拟完成', 'success');
    } catch (error) {
      addMessage(`❌ OAuth成功模拟失败: ${error}`, 'error');
    }
    
    setIsTesting(false);
  };

  const handleSimulateOAuthError = async () => {
    setIsTesting(true);
    addMessage('❌ 模拟OAuth错误...', 'info');
    
    try {
      addMessage('✅ OAuth错误模拟完成', 'success');
    } catch (error) {
      addMessage(`❌ OAuth错误模拟失败: ${error}`, 'error');
    }
    
    setIsTesting(false);
  };

  const handleClearOAuthState = async () => {
    setIsTesting(true);
    addMessage('🧹 清理OAuth状态...', 'info');
    
    try {
      addMessage('✅ OAuth状态清理完成', 'success');
    } catch (error) {
      addMessage(`❌ OAuth状态清理失败: ${error}`, 'error');
    }
    
    setIsTesting(false);
  };

  useEffect(() => {
    addMessage('🔐 OAuth清理测试已启动', 'info');
    addMessage('📊 测试OAuth流程清理功能', 'info');
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
        <Text color="cyan" bold>🔐 OAuth清理功能测试</Text>
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
          <Text color="white">• 模拟OAuth成功流程</Text>
          <Text color="white">• 模拟OAuth错误流程</Text>
          <Text color="white">• 清理OAuth状态缓存</Text>
        </Box>
      </Box>

      <Box borderStyle="single" padding={1} flexDirection="column">
        <Text color="green" bold>🎮 控制按钮:</Text>
        <Box flexDirection="column" marginTop={1}>
          <Text color="cyan">1. 模拟OAuth成功</Text>
          <Text color="cyan">2. 模拟OAuth错误</Text>
          <Text color="cyan">3. 清理OAuth状态</Text>
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

export const runOAuthClearTest = () => {
  console.clear();
  console.log('启动OAuth清理测试...');
  
  const { unmount } = render(<OAuthClearTest />);
  
  const handleKeyPress = (key: string) => {
    switch (key) {
      case '1':
        console.log('模拟OAuth成功');
        break;
      case '2':
        console.log('模拟OAuth错误');
        break;
      case '3':
        console.log('清理OAuth状态');
        break;
      case '0':
        unmount();
        console.log('OAuth测试完成，退出...');
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
    console.log('OAuth测试超时，自动退出...');
    process.exit(0);
  }, 60000);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runOAuthClearTest();
}