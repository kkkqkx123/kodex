import { ToolCallHistory } from '../../src/monitor/ToolCallHistory';
import { ToolCallRecord } from '../../src/monitor/types';

describe('ToolCallHistory', () => {
  let history: ToolCallHistory;

  beforeEach(() => {
    history = new ToolCallHistory(5); // 最大5步历史记录
  });

  test('应该正确添加记录', () => {
    const record: ToolCallRecord = {
      id: '1',
      name: 'testTool',
      input: { param: 'value' },
      timestamp: Date.now()
    };

    history.add(record);
    expect(history.length).toBe(1);
    expect(history.getAll()[0]).toEqual(record);
  });

  test('应该限制历史记录长度', () => {
    for (let i = 0; i < 10; i++) {
      history.add({
        id: `${i}`,
        name: 'testTool',
        input: { index: i },
        timestamp: Date.now()
      });
    }

    expect(history.length).toBe(5); // 应该只保留最后5个记录
    expect(history.getAll()[0].id).toBe('5'); // 第一个记录应该是第5个
    expect(history.getAll()[4].id).toBe('9'); // 最后一个记录应该是第9个
  });

  test('应该正确获取最近步骤', () => {
    for (let i = 0; i < 5; i++) {
      history.add({
        id: `${i}`,
        name: 'testTool',
        input: { index: i },
        timestamp: Date.now()
      });
    }

    const recent = history.getRecentSteps(3);
    expect(recent.length).toBe(3);
    expect(recent[0].id).toBe('2'); // 第2个记录
    expect(recent[2].id).toBe('4'); // 第4个记录
  });

  test('应该正确清空历史记录', () => {
    history.add({
      id: '1',
      name: 'testTool',
      input: {},
      timestamp: Date.now()
    });

    expect(history.length).toBe(1);
    history.clear();
    expect(history.length).toBe(0);
  });

  test('应该正确设置最大步数', () => {
    // 先添加一些记录
    for (let i = 0; i < 5; i++) {
      history.add({
        id: `${i}`,
        name: 'testTool',
        input: { index: i },
        timestamp: Date.now()
      });
    }

    history.setMaxSteps(3);
    expect(history.length).toBe(3); // 应该截断到3个记录
    expect(history.getAll()[0].id).toBe('2'); // 第一个记录应该是第2个
  });

  test('应该正确比较输入参数', () => {
    const record1: ToolCallRecord = {
      id: '1',
      name: 'testTool',
      input: { param: 'value', nested: { deep: 'value' } },
      timestamp: Date.now()
    };

    const record2: ToolCallRecord = {
      id: '2',
      name: 'testTool',
      input: { param: 'value', nested: { deep: 'value' } },
      timestamp: Date.now()
    };

    const record3: ToolCallRecord = {
      id: '3',
      name: 'testTool',
      input: { param: 'different' },
      timestamp: Date.now()
    };

    history.add(record1);
    expect(history.contains(record2)).toBe(true); // 相同输入
    expect(history.contains(record3)).toBe(false); // 不同输入
  });
});