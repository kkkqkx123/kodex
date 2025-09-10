/**
 * 工具调用循环检测模块类型定义
 */

export interface ToolCallRecord {
  /** 工具调用ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** 工具输入参数 */
  input: any;
  /** 调用时间戳 */
  timestamp: number;
  /** 关联的响应ID */
  responseId?: string;
}

export interface MonitorConfig {
  /** 最大循环检测步长（默认5） */
  maxCycleSteps: number;
  /** 最大历史记录步数（默认10） */
  maxHistorySteps: number;
  /** 是否启用监控 */
  enabled: boolean;
  /** 检测到循环时是否终止任务 */
  terminateOnCycle: boolean;
  /** 日志级别 */
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug';
  
  // 失败监控相关配置
  /** 工具调用失败监控是否启用 */
  failureMonitorEnabled: boolean;
  /** 触发自动压缩的连续失败次数 */
  autoCompactFailureThreshold: number;
}

export class ToolCallCycleError extends Error {
  /** 检测到的循环步长 */
  public readonly cycleLength: number;
  
  constructor(cycleLength: number) {
    super(`工具调用循环检测到循环，步长: ${cycleLength}`);
    this.name = 'ToolCallCycleError';
    this.cycleLength = cycleLength;
  }
}

export interface CycleDetectionResult {
  /** 是否检测到循环 */
  hasCycle: boolean;
  /** 循环步长（如果检测到） */
  cycleLength?: number;
  /** 循环开始位置 */
  cycleStartIndex?: number;
}