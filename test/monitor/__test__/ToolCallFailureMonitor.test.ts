import { ToolCallFailureMonitor } from '../../../src/monitor/ToolCallFailureMonitor';
// Note: Bun does not support jest.mock, so we'll test without mocking

describe('ToolCallFailureMonitor', () => {
  let monitor: ToolCallFailureMonitor;
  const defaultConfig = {
    maxCycleSteps: 5,
    maxHistorySteps: 10,
    enabled: true,
    terminateOnCycle: true,
    logLevel: 'silent' as const,
    failureMonitorEnabled: true,
    autoCompactFailureThreshold: 3
  };

  beforeEach(() => {
    monitor = new ToolCallFailureMonitor(defaultConfig);
  });

  test('应该正确初始化', () => {
    expect(monitor.getFailureCount()).toBe(0);
  });

  test('应该正确处理格式错误', () => {
    const record = {
      id: '1',
      name: 'testTool',
      content: 'InputValidationError: Invalid input provided',
      timestamp: Date.now(),
      is_error: true
    };

    monitor.onToolCallResult(record);
    expect(monitor.getFailureCount()).toBe(1);
  });

  test('应该正确处理diff反复错误', () => {
    // 先添加一个格式错误记录，使其被分类为格式错误类型
    const firstRecord = {
      id: '1',
      name: 'testTool',
      content: 'InputValidationError: Invalid input with some content that is longer than twenty characters',
      timestamp: Date.now(),
      is_error: true
    };
    
    monitor.onToolCallResult(firstRecord);
    expect(monitor.getFailureCount()).toBe(1); // 格式错误记录会增加失败计数
    
    // 再添加一个相似的失败记录，前20个字符需要匹配
    const secondRecord = {
      id: '2',
      name: 'testTool',
      content: 'InputValidationError: Invalid input with some content that is longer than twenty characters but different',
      timestamp: Date.now(),
      is_error: true
    };
    
    monitor.onToolCallResult(secondRecord);
    expect(monitor.getFailureCount()).toBe(2); // 第二个记录与第一个记录相似，被分类为diff反复错误
  });

  test('应该正确处理其他类型错误', () => {
    // 先添加一个格式错误
    const formatErrorRecord = {
      id: '0',
      name: 'testTool',
      content: 'InputValidationError: Invalid input provided',
      timestamp: Date.now(),
      is_error: true
    };
    
    monitor.onToolCallResult(formatErrorRecord);
    expect(monitor.getFailureCount()).toBe(1);
    
    // 再添加其他类型错误，确保不包含格式错误关键词
    // 根据实现，OTHER类型错误会重置失败计数
    const record = {
      id: '1',
      name: 'testTool',
      content: 'Some other error occurred without format keywords',
      timestamp: Date.now(),
      is_error: true
    };
    
    monitor.onToolCallResult(record);
    expect(monitor.getFailureCount()).toBe(0); // OTHER类型错误会重置计数
  });

  test('应该正确处理非错误结果', () => {
    // 先添加一个格式错误
    const formatErrorRecord = {
      id: '0',
      name: 'testTool',
      content: 'InputValidationError: Invalid input provided',
      timestamp: Date.now(),
      is_error: true
    };
    
    monitor.onToolCallResult(formatErrorRecord);
    expect(monitor.getFailureCount()).toBe(1);
    
    // 再添加一个非错误结果
    const successRecord = {
      id: '1',
      name: 'testTool',
      content: 'Operation completed successfully',
      timestamp: Date.now(),
      is_error: false
    };
    
    monitor.onToolCallResult(successRecord);
    expect(monitor.getFailureCount()).toBe(0); // 应该重置为0
  });

  test('应该在达到阈值时触发自动压缩', () => {
    const record = {
      id: '1',
      name: 'testTool',
      content: 'InputValidationError: Invalid input provided',
      timestamp: Date.now(),
      is_error: true
    };

    // 添加3个失败记录（达到阈值）
    monitor.onToolCallResult(record);
    monitor.onToolCallResult(record);
    monitor.onToolCallResult(record);
    
    expect(monitor.getFailureCount()).toBe(0); // 应该重置为0
    expect(monitor.shouldTriggerAutoCompact()).toBe(false);
  });

  test('应该在监控禁用时不处理失败', () => {
    const disabledConfig = {
      ...defaultConfig,
      failureMonitorEnabled: false
    };
    
    const disabledMonitor = new ToolCallFailureMonitor(disabledConfig);
    
    const record = {
      id: '1',
      name: 'testTool',
      content: 'InputValidationError: Invalid input provided',
      timestamp: Date.now(),
      is_error: true
    };

    disabledMonitor.onToolCallResult(record);
    expect(disabledMonitor.getFailureCount()).toBe(0);
  });

  test('应该正确更新配置', () => {
    const newConfig = {
      ...defaultConfig,
      autoCompactFailureThreshold: 5
    };
    
    monitor.updateConfig(newConfig);
    
    // 创建一个测试记录
    const record = {
      id: '1',
      name: 'testTool',
      content: 'InputValidationError: Invalid input provided',
      timestamp: Date.now(),
      is_error: true
    };
    
    // 添加4个失败记录
    monitor.onToolCallResult(record);
    monitor.onToolCallResult(record);
    monitor.onToolCallResult(record);
    monitor.onToolCallResult(record);
    
    expect(monitor.getFailureCount()).toBe(4); // 还未达到新阈值
    expect(monitor.shouldTriggerAutoCompact()).toBe(false);
    
    // 再添加一个失败记录
    monitor.onToolCallResult(record);
    expect(monitor.getFailureCount()).toBe(0); // 达到阈值后应该重置
  });
});