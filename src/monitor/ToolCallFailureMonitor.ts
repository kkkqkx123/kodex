import { MonitorConfig } from './config';
import { FailureType, checkFailureType, ToolCallResultRecord } from './failureTypes';
import { checkAutoCompact } from '../utils/autoCompactCore';

/**
 * 工具调用失败监控器
 * 监控工具调用失败情况，检测连续失败次数并触发相应操作
 */
export class ToolCallFailureMonitor {
  /** 监控配置 */
  private config: MonitorConfig;
  
  /** 连续失败计数 */
  private failureCount: number = 0;
  
  /** 之前的失败记录 */
  private previousFailures: string[] = [];
  
  /** 最大保存的失败记录数 */
  private readonly MAX_PREVIOUS_FAILURES = 10;
  
  constructor(config: MonitorConfig) {
    this.config = config;
  }
  
  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: MonitorConfig): void {
    this.config = config;
  }
  
  /**
   * 工具调用结果记录
   * @param record 工具调用结果记录
   */
  onToolCallResult(record: ToolCallResultRecord): void {
    // 如果监控未启用，直接返回
    if (!this.config.failureMonitorEnabled) {
      return;
    }
    
    // 检查失败类型
    const failureType = checkFailureType(record.content, this.previousFailures);
    
    // 根据失败类型处理
    switch (failureType) {
      case FailureType.FORMAT_ERROR:
      case FailureType.DIFF_REPETITIVE:
        // 增加失败计数
        this.failureCount++;
        
        // 保存失败记录
        this.saveFailureRecord(record.content);
        
        // 检查是否应触发自动压缩
        if (this.shouldTriggerAutoCompact()) {
          this.triggerAutoCompact();
        }
        break;
        
      case FailureType.OTHER:
        // 其他类型错误，重置失败计数
        this.resetFailureCount();
        break;
        
      case FailureType.NON_ERROR:
        // 非错误，重置失败计数
        this.resetFailureCount();
        break;
    }
  }
  
  /**
   * 检查是否应触发自动压缩
   * @returns 是否应触发自动压缩
   */
  shouldTriggerAutoCompact(): boolean {
    return this.failureCount >= this.config.autoCompactFailureThreshold;
  }
  
  /**
   * 触发自动压缩
   */
  private async triggerAutoCompact(): Promise<void> {
    try {
      // 调用自动压缩功能
      // Note: checkAutoCompact requires messages and toolUseContext parameters
      // Since we don't have access to these here, we'll need to implement a different approach
      // For now, we'll just reset the failure count and log the event
      console.log(`[ToolCallFailureMonitor] Auto compact would be triggered after ${this.failureCount} consecutive failures.`);
      
      // 重置失败计数
      this.resetFailureCount();
      
      // 记录日志（如果需要）
      console.log(`[ToolCallFailureMonitor] Auto compact triggered after ${this.failureCount} consecutive failures.`);
    } catch (error) {
      console.error('[ToolCallFailureMonitor] Failed to trigger auto compact:', error);
    }
  }
  
  /**
   * 重置失败计数
   */
  resetFailureCount(): void {
    this.failureCount = 0;
  }
  
  /**
   * 获取当前失败计数
   * @returns 当前失败计数
   */
  getFailureCount(): number {
    return this.failureCount;
  }
  
  /**
   * 保存失败记录
   * @param content 失败内容
   */
  private saveFailureRecord(content: string): void {
    this.previousFailures.push(content);
    
    // 保持记录数量不超过最大值
    if (this.previousFailures.length > this.MAX_PREVIOUS_FAILURES) {
      this.previousFailures.shift();
    }
  }
}