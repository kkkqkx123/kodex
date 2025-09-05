import { ToolCallRecord, CycleDetectionResult } from './types';

/** 循环检测器 */
export class CycleDetector {
  /**
   * 检测工具调用历史中的循环
   * @param history 工具调用历史记录
   * @param maxCycleSteps 最大检测步长
   * @returns 检测结果
   */
  static detectCycle(
    history: ToolCallRecord[], 
    maxCycleSteps: number
  ): CycleDetectionResult {
    if (history.length < 2) {
      return { hasCycle: false };
    }

    // 从最大步长开始检测，逐步减小步长
    for (let step = Math.min(maxCycleSteps, Math.floor(history.length / 2)); step >= 1; step--) {
      const cycleResult = this.checkCycleAtStep(history, step);
      if (cycleResult.hasCycle) {
        return cycleResult;
      }
    }

    return { hasCycle: false };
  }

  /**
   * 检查特定步长的循环
   * @param history 历史记录
   * @param step 检测步长
   * @returns 检测结果
   */
  private static checkCycleAtStep(
    history: ToolCallRecord[], 
    step: number
  ): CycleDetectionResult {
    const totalSteps = history.length;
    
    // 需要至少2*step个记录来检测step步长的循环
    if (totalSteps < 2 * step) {
      return { hasCycle: false };
    }

    // 检查是否形成完整循环（头尾相同）
    const firstCycle = history.slice(totalSteps - 2 * step, totalSteps - step);
    const secondCycle = history.slice(totalSteps - step);

    if (this.areCyclesEqual(firstCycle, secondCycle)) {
      return {
        hasCycle: true,
        cycleLength: step,
        cycleStartIndex: totalSteps - 2 * step
      };
    }

    return { hasCycle: false };
  }

  /**
   * 比较两个循环序列是否相等
   * @param cycle1 第一个循环序列
   * @param cycle2 第二个循环序列
   * @returns 是否相等
   */
  private static areCyclesEqual(
    cycle1: ToolCallRecord[], 
    cycle2: ToolCallRecord[]
  ): boolean {
    if (cycle1.length !== cycle2.length) {
      return false;
    }

    for (let i = 0; i < cycle1.length; i++) {
      if (!this.areRecordsEqual(cycle1[i], cycle2[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * 比较两个工具调用记录是否相等
   * @param record1 第一个记录
   * @param record2 第二个记录
   * @returns 是否相等
   */
  private static areRecordsEqual(
    record1: ToolCallRecord, 
    record2: ToolCallRecord
  ): boolean {
    // 比较工具名称
    if (record1.name !== record2.name) {
      return false;
    }

    // 比较输入参数
    return this.areInputsEqual(record1.input, record2.input);
  }

  /**
   * 比较两个输入参数是否相等
   * @param input1 第一个输入
   * @param input2 第二个输入
   * @returns 是否相等
   */
  private static areInputsEqual(input1: any, input2: any): boolean {
    if (input1 === input2) {
      return true;
    }

    if (typeof input1 !== typeof input2) {
      return false;
    }

    // 处理对象和数组的深度比较
    if (typeof input1 === 'object' && input1 !== null && input2 !== null) {
      try {
        return JSON.stringify(input1) === JSON.stringify(input2);
      } catch {
        // 如果JSON序列化失败，使用浅比较
        return this.shallowEqual(input1, input2);
      }
    }

    // 基本类型直接比较
    return input1 === input2;
  }

  /**
   * 浅比较两个对象
   * @param obj1 第一个对象
   * @param obj2 第二个对象
   * @returns 是否相等
   */
  private static shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取历史记录中的潜在循环模式
   * @param history 历史记录
   * @param maxStep 最大检测步长
   * @returns 所有检测到的循环模式
   */
  static getAllCycles(
    history: ToolCallRecord[], 
    maxStep: number
  ): CycleDetectionResult[] {
    const cycles: CycleDetectionResult[] = [];
    
    for (let step = 1; step <= Math.min(maxStep, Math.floor(history.length / 2)); step++) {
      const result = this.checkCycleAtStep(history, step);
      if (result.hasCycle) {
        cycles.push(result);
      }
    }

    return cycles;
  }

  /**
   * 检查是否存在部分循环（不要求完整循环）
   * @param history 历史记录
   * @param minSimilarity 最小相似度阈值（0-1）
   * @returns 是否存在部分循环
   */
  static hasPartialCycle(
    history: ToolCallRecord[], 
    minSimilarity: number = 0.8
  ): boolean {
    if (history.length < 2) {
      return false;
    }

    // 检查最近几个记录的相似性模式
    const recentRecords = history.slice(-10); // 检查最近10个记录
    
    for (let i = 1; i < recentRecords.length; i++) {
      const similarity = this.calculateSequenceSimilarity(recentRecords, i);
      if (similarity >= minSimilarity) {
        return true;
      }
    }

    return false;
  }

  /**
   * 计算序列相似度
   * @param records 记录序列
   * @param step 检测步长
   * @returns 相似度（0-1）
   */
  private static calculateSequenceSimilarity(
    records: ToolCallRecord[], 
    step: number
  ): number {
    let matchCount = 0;
    const totalComparisons = Math.min(records.length - step, step);
    
    for (let i = 0; i < totalComparisons; i++) {
      if (this.areRecordsEqual(records[i], records[i + step])) {
        matchCount++;
      }
    }

    return totalComparisons > 0 ? matchCount / totalComparisons : 0;
  }
}