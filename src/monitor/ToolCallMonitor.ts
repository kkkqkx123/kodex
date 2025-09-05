import { ToolCallRecord, MonitorConfig, ToolCallCycleError } from './types';
import { ToolCallHistory } from './ToolCallHistory';
import { CycleDetector } from './CycleDetector';
import { ConfigManager } from './config';
import { ToolCallFailureMonitor } from './ToolCallFailureMonitor';

/** 工具调用监控器 */
export class ToolCallMonitor {
  private history: ToolCallHistory;
  private config: MonitorConfig;
  private isEnabled: boolean;
  private failureMonitor: ToolCallFailureMonitor;

  constructor(config?: Partial<MonitorConfig>) {
    this.config = { ...ConfigManager.loadConfigSync(), ...config };
    this.history = new ToolCallHistory(this.config.maxHistorySteps);
    this.isEnabled = this.config.enabled;
    this.failureMonitor = new ToolCallFailureMonitor(this.config);
  }

  /**
   * 工具调用开始时调用
   * @param record 工具调用记录
   */
  onToolCallStart(record: ToolCallRecord): void {
    if (!this.isEnabled) {
      return;
    }

    // 添加工具调用记录到历史
    this.history.add(record);

    // 检测循环
    this.detectAndHandleCycle();
  }

  /**
   * 工具调用结果时调用
   * @param record 工具调用结果记录
   */
  onToolCallResult(record: any): void {
    if (!this.isEnabled) {
      return;
    }

    // 将结果传递给失败监控器
    this.failureMonitor.onToolCallResult(record);
  }

  /**
   * 检测并处理循环
   */
  private detectAndHandleCycle(): void {
    const recentHistory = this.history.getRecentSteps(this.config.maxHistorySteps);
    
    if (recentHistory.length < 2) {
      return; // 需要至少2个记录才能检测循环
    }

    const detectionResult = CycleDetector.detectCycle(recentHistory, this.config.maxCycleSteps);

    if (detectionResult.hasCycle && detectionResult.cycleLength) {
      this.handleCycleDetected(detectionResult.cycleLength);
    }
  }

  /**
   * 处理检测到的循环
   * @param cycleLength 循环步长
   */
  private handleCycleDetected(cycleLength: number): void {
    this.log('warn', `检测到工具调用循环，步长: ${cycleLength}`);

    if (this.config.terminateOnCycle) {
      this.log('error', '终止当前任务');
      this.terminateTask(cycleLength);
    }
  }

  /**
   * 终止当前任务
   * @param cycleLength 循环步长
   */
  private terminateTask(cycleLength: number): void {
    throw new ToolCallCycleError(cycleLength);
  }

  /**
   * 启用监控
   */
  enable(): void {
    this.isEnabled = true;
    this.log('info', '工具调用监控已启用');
  }

  /**
   * 禁用监控
   */
  disable(): void {
    this.isEnabled = false;
    this.log('info', '工具调用监控已禁用');
  }

  /**
   * 更新配置
   * @param newConfig 新配置
   */
  async updateConfig(newConfig: Partial<MonitorConfig>): Promise<void> {
    try {
      await ConfigManager.saveConfig(newConfig);
      this.config = { ...this.config, ...newConfig };
      
      // 更新历史记录最大步数
      if (newConfig.maxHistorySteps !== undefined) {
        this.history.setMaxSteps(newConfig.maxHistorySteps);
      }
      
      // 更新失败监控器配置
      this.failureMonitor.updateConfig(this.config);

      this.log('info', '监控配置已更新');
    } catch (error) {
      this.log('error', `更新配置失败: ${error.message}`);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  /**
   * 获取历史记录
   */
  getHistory(): ToolCallRecord[] {
    return this.history.getAll();
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.history.clear();
    this.log('info', '历史记录已清空');
  }

  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志消息
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex <= currentLevelIndex) {
      const timestamp = new Date().toISOString();
      const logMessage = `[ToolCallMonitor] [${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'info':
          console.info(logMessage);
          break;
        case 'debug':
          console.debug(logMessage);
          break;
      }
    }
  }

  /**
   * 检查监控器是否启用
   */
  isMonitorEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 手动触发循环检测
   * @returns 检测结果
   */
  manualCycleCheck(): { hasCycle: boolean; cycleLength?: number } {
    if (!this.isEnabled) {
      return { hasCycle: false };
    }

    const recentHistory = this.history.getRecentSteps(this.config.maxHistorySteps);
    const detectionResult = CycleDetector.detectCycle(recentHistory, this.config.maxCycleSteps);

    if (detectionResult.hasCycle) {
      this.log('warn', `手动检测到循环，步长: ${detectionResult.cycleLength}`);
    }

    return {
      hasCycle: detectionResult.hasCycle,
      cycleLength: detectionResult.cycleLength
    };
  }

  /**
   * 获取监控器状态
   */
  getStatus(): {
    enabled: boolean;
    historySize: number;
    config: MonitorConfig;
    lastCycleCheck?: { hasCycle: boolean; cycleLength?: number };
  } {
    return {
      enabled: this.isEnabled,
      historySize: this.history.length,
      config: this.getConfig(),
      lastCycleCheck: this.manualCycleCheck()
    };
  }
}