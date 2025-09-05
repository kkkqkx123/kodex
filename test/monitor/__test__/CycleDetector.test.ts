import { CycleDetector } from '../../../src/monitor/CycleDetector';
import { ToolCallRecord } from '../../../src/monitor/types';

describe('CycleDetector', () => {
  const createRecord = (id: string, name: string, input: any = {}): ToolCallRecord => ({
    id,
    name,
    input,
    timestamp: Date.now()
  });

  test('应该检测到2步长循环', () => {
    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA', { param: 'value1' }),
      createRecord('2', 'toolB', { param: 'value2' }),
      createRecord('3', 'toolA', { param: 'value1' }), // 循环开始
      createRecord('4', 'toolB', { param: 'value2' })  // 循环结束
    ];

    const result = CycleDetector.detectCycle(history, 5);
    expect(result.hasCycle).toBe(true);
    expect(result.cycleLength).toBe(2);
  });

  test('应该检测到3步长循环', () => {
    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA', { param: 'value1' }),
      createRecord('2', 'toolB', { param: 'value2' }),
      createRecord('3', 'toolC', { param: 'value3' }),
      createRecord('4', 'toolA', { param: 'value1' }), // 循环开始
      createRecord('5', 'toolB', { param: 'value2' }),
      createRecord('6', 'toolC', { param: 'value3' })  // 循环结束
    ];

    const result = CycleDetector.detectCycle(history, 5);
    expect(result.hasCycle).toBe(true);
    expect(result.cycleLength).toBe(3);
  });

  test('不应该检测部分匹配', () => {
    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA', { param: 'value1' }),
      createRecord('2', 'toolB', { param: 'value2' }),
      createRecord('3', 'toolA', { param: 'value1' }), // 类似但不完全相同
      createRecord('4', 'toolB', { param: 'different' }) // 不同输入
    ];

    const result = CycleDetector.detectCycle(history, 5);
    expect(result.hasCycle).toBe(false);
  });

  test('不应该检测单个记录', () => {
    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA', { param: 'value1' })
    ];

    const result = CycleDetector.detectCycle(history, 5);
    expect(result.hasCycle).toBe(false);
  });

  test('应该处理最大步长限制', () => {
    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA'),
      createRecord('2', 'toolB'),
      createRecord('3', 'toolC'),
      createRecord('4', 'toolD'),
      createRecord('5', 'toolE'),
      createRecord('6', 'toolA'), // 超过最大步长5，不应该检测
      createRecord('7', 'toolB'),
      createRecord('8', 'toolC'),
      createRecord('9', 'toolD'),
      createRecord('10', 'toolE')
    ];

    const result = CycleDetector.detectCycle(history, 5);
    expect(result.hasCycle).toBe(true);
    expect(result.cycleLength).toBe(5);
  });

  test('应该检测复杂对象输入', () => {
    const complexInput = { 
      nested: { 
        array: [1, 2, 3], 
        value: 'test' 
      } 
    };

    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA', complexInput),
      createRecord('2', 'toolB', { simple: 'value' }),
      createRecord('3', 'toolA', complexInput), // 相同复杂输入
      createRecord('4', 'toolB', { simple: 'value' })
    ];

    const result = CycleDetector.detectCycle(history, 5);
    expect(result.hasCycle).toBe(true);
    expect(result.cycleLength).toBe(2);
  });

  test('应该返回所有检测到的循环', () => {
    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA'),
      createRecord('2', 'toolB'),
      createRecord('3', 'toolA'), // 2步长循环
      createRecord('4', 'toolB'),
      createRecord('5', 'toolA'), // 另一个2步长循环
      createRecord('6', 'toolB')
    ];

    const allCycles = CycleDetector.getAllCycles(history, 5);
    expect(allCycles.length).toBeGreaterThan(0);
    expect(allCycles.every(cycle => cycle.hasCycle)).toBe(true);
  });

  test('应该检测部分循环相似性', () => {
    const history: ToolCallRecord[] = [
      createRecord('1', 'toolA'),
      createRecord('2', 'toolB'),
      createRecord('3', 'toolA'), // 相似但不完全相同
      createRecord('4', 'toolB'),
      createRecord('5', 'toolA'), // 继续相似模式
      createRecord('6', 'toolB')
    ];

    const hasPartial = CycleDetector.hasPartialCycle(history, 0.7);
    expect(hasPartial).toBe(true);
  });
});