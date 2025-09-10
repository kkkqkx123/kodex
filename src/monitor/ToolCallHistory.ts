import { ToolCallRecord } from './types';

/** 工具调用历史记录管理器 */
export class ToolCallHistory {
  private history: ToolCallRecord[] = [];
  private maxSteps: number;

  constructor(maxSteps: number = 10) {
    this.maxSteps = maxSteps;
  }

  /** 添加工具调用记录 */
  add(record: ToolCallRecord): void {
    // 只保留工具调用部分，过滤掉非工具调用的文本描述
    const toolCallRecord: ToolCallRecord = {
      id: record.id,
      name: record.name,
      input: record.input,
      timestamp: record.timestamp,
      responseId: record.responseId
    };

    this.history.push(toolCallRecord);
    
    // 保持历史记录长度不超过最大值
    if (this.history.length > this.maxSteps) {
      this.history.shift();
    }
  }

  /** 获取最近N步的历史记录 */
  getRecentSteps(count: number): ToolCallRecord[] {
    return this.history.slice(-Math.min(count, this.history.length));
  }

  /** 获取完整历史记录 */
  getAll(): ToolCallRecord[] {
    return [...this.history];
  }

  /** 获取历史记录长度 */
  get length(): number {
    return this.history.length;
  }

  /** 清空历史记录 */
  clear(): void {
    this.history = [];
  }

  /** 设置最大历史记录步数 */
  setMaxSteps(maxSteps: number): void {
    this.maxSteps = maxSteps;
    
    // 如果当前历史记录超过新的最大值，截断
    if (this.history.length > this.maxSteps) {
      this.history = this.history.slice(-this.maxSteps);
    }
  }

  /** 查找特定工具调用记录 */
  findByName(name: string): ToolCallRecord[] {
    return this.history.filter(record => record.name === name);
  }

  /** 查找特定响应ID的记录 */
  findByResponseId(responseId: string): ToolCallRecord | undefined {
    return this.history.find(record => record.responseId === responseId);
  }

  /** 检查是否包含特定工具调用 */
  contains(record: ToolCallRecord): boolean {
    return this.history.some(
      existing => 
        existing.name === record.name && 
        this.isInputEqual(existing.input, record.input)
    );
  }

  /** 比较两个输入是否相等 */
  private isInputEqual(input1: any, input2: any): boolean {
    if (input1 === input2) return true;
    if (typeof input1 !== typeof input2) return false;
    
    if (typeof input1 === 'object' && input1 !== null && input2 !== null) {
      return JSON.stringify(input1) === JSON.stringify(input2);
    }
    
    return input1 === input2;
  }
}