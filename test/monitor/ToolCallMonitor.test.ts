import { ToolCallMonitor } from '../../src/monitor/ToolCallMonitor';
import { ToolCallCycleError } from '../../src/monitor/types';

describe('ToolCallMonitor', () => {
  let monitor: ToolCallMonitor;

  beforeEach(() => {
    monitor = new ToolCallMonitor({
      maxCycleSteps: 5,
      maxHistorySteps: 10,
      enabled: true,
      terminateOnCycle: true,
      logLevel: 'silent'
    });
  });

  test('应该正确初始化', () => {
    expect(monitor.isMonitorEnabled()).toBe(true);
    expect(monitor.getStatus().historySize).toBe(0);
  });

  test('应该处理工具调用', () => {
    const record = {
      id: '1',
      name: 'testTool',
      input: { param: 'value' },
      timestamp: Date.now()
    };

    expect(() => {
      monitor.onToolCallStart(record);
    }).not.toThrow();

    expect(monitor.getStatus().historySize).toBe(1);
  });

  test('应该检测循环并终止任务', () => {
    // 创建循环模式: A -> B -> A -> B
    const records = [
      { id: '1', name: 'toolA', input: { param: 'value1' }, timestamp: Date.now() },
      { id: '2', name: 'toolB', input: { param: 'value2' }, timestamp: Date.now() },
      { id: '3', name: 'toolA', input: { param: 'value1' }, timestamp: Date.now() },
      { id: '4', name: 'toolB', input: { param: 'value2' }, timestamp: Date.now() }
    ];

    // 添加前3个记录
    records.slice(0, 3).forEach(record => {
      expect(() => {
        monitor.onToolCallStart(record);
      }).not.toThrow();
    });

    // 添加第4个记录应该触发循环检测并抛出异常
    expect(() => {
      monitor.onToolCallStart(records[3]);
    }).toThrow(ToolCallCycleError);
  });

  test('禁用时不应该检测循环', () => {
    monitor.disable();
    expect(monitor.isMonitorEnabled()).toBe(false);

    const records = [
      { id: '1', name: 'toolA', input: { param: 'value1' }, timestamp: Date.now() },
      { id: '2', name: 'toolB', input: { param: 'value2' }, timestamp: Date.now() },
      { id: '3', name: 'toolA', input: { param: 'value1' }, timestamp: Date.now() },
      { id: '4', name: 'toolB', input: { param: 'value2' }, timestamp: Date.now() }
    ];

    // 即使有循环模式，禁用时也不应该抛出异常
    records.forEach(record => {
      expect(() => {
        monitor.onToolCallStart(record);
      }).not.toThrow();
    });
  });

  test('禁用终止时不应该抛出异常', () => {
    const noTerminateMonitor = new ToolCallMonitor({
      maxCycleSteps: 5,
      maxHistorySteps: 10,
      enabled: true,
      terminateOnCycle: false, // 不终止
      logLevel: 'silent'
    });

    const records = [
      { id: '1', name: 'toolA', input: { param: 'value1' }, timestamp: Date.now() },
      { id: '2', name: 'toolB', input: { param: 'value2' }, timestamp: Date.now() },
      { id: '3', name: 'toolA', input: { param: 'value1' }, timestamp: Date.now() },
      { id: '4', name: 'toolB', input: { param: 'value2' }, timestamp: Date.now() }
    ];

    // 即使有循环模式，不终止时也不应该抛出异常
    records.forEach(record => {
      expect(() => {
        noTerminateMonitor.onToolCallStart(record);
      }).not.toThrow();
    });
  });

  test('应该正确清空历史记录', () => {
    const record = {
      id: '1',
      name: 'testTool',
      input: { param: 'value' },
      timestamp: Date.now()
    };

    monitor.onToolCallStart(record);
    expect(monitor.getStatus().historySize).toBe(1);

    monitor.clearHistory();
    expect(monitor.getStatus().historySize).toBe(0);
  });

  test('应该正确启用和禁用', () => {
    monitor.disable();
    expect(monitor.isMonitorEnabled()).toBe(false);

    monitor.enable();
    expect(monitor.isMonitorEnabled()).toBe(true);
  });

  test('手动检查应该返回正确结果', () => {
    const records = [
      { id: '1', name: 'toolA', input: { param: 'value1' }, timestamp: Date.now() },
      { id: '2', name: 'toolB', input: { param: 'value2' }, timestamp: Date.now() }
    ];

    records.forEach(record => monitor.onToolCallStart(record));

    const result = monitor.manualCycleCheck();
    expect(result.hasCycle).toBe(false);
  });

  test('应该返回正确的状态信息', () => {
    const status = monitor.getStatus();
    expect(status.enabled).toBe(true);
    expect(status.historySize).toBe(0);
    expect(status.config.maxCycleSteps).toBe(5);
  });
});