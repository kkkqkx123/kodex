/**
 * 工具调用循环检测模块入口
 */

import { ToolCallMonitor } from './ToolCallMonitor';
import { ToolCallFailureMonitor } from './ToolCallFailureMonitor';
import { MonitorConfig, ToolCallRecord } from './types';

export { ToolCallMonitor } from './ToolCallMonitor';
export { ToolCallFailureMonitor } from './ToolCallFailureMonitor';
export { ToolCallHistory } from './ToolCallHistory';
export { CycleDetector } from './CycleDetector';
export { ConfigManager } from './config';

export type { ToolCallRecord, MonitorConfig, CycleDetectionResult } from './types';
export { ToolCallCycleError } from './types';

// 工具调用失败监控相关导出
export { FailureType, type ToolCallResultRecord } from './failureTypes';
export type { ToolCallFailureMonitor as ToolCallFailureMonitorType };

export {
  MonitorError,
  ConfigLoadError,
  ConfigSaveError,
  InvalidConfigError,
  HistoryOverflowError,
  CycleDetectionError
} from './errors';

// 全局监控器实例（单例模式）
let globalMonitor: ToolCallMonitor | null = null;
let globalFailureMonitor: ToolCallFailureMonitor | null = null;

/**
 * 获取全局监控器实例
 */
export function getGlobalMonitor(): ToolCallMonitor {
  if (!globalMonitor) {
    globalMonitor = new ToolCallMonitor();
  }
  return globalMonitor;
}

/**
 * 获取全局失败监控器实例
 */
export function getGlobalFailureMonitor(): ToolCallFailureMonitor {
  if (!globalFailureMonitor) {
    const monitor = getGlobalMonitor();
    globalFailureMonitor = new ToolCallFailureMonitor(monitor.getConfig());
  }
  return globalFailureMonitor;
}

/**
 * 初始化监控模块
 * @param config 可选配置
 */
export async function initializeMonitor(config?: Partial<MonitorConfig>): Promise<ToolCallMonitor> {
  if (!globalMonitor) {
    globalMonitor = new ToolCallMonitor(config);
  } else if (config) {
    await globalMonitor.updateConfig(config);
  }

  // 初始化失败监控器
  getGlobalFailureMonitor();

  return globalMonitor;
}

/**
 * 销毁全局监控器
 */
export function destroyMonitor(): void {
  globalMonitor = null;
  globalFailureMonitor = null;
}

/**
 * 检查监控模块是否已初始化
 */
export function isMonitorInitialized(): boolean {
  return globalMonitor !== null;
}

/**
 * 工具调用监控装饰器
 * @param record 工具调用记录
 */
export function monitorToolCall(record: ToolCallRecord): void {
  if (globalMonitor) {
    globalMonitor.onToolCallStart(record);
  }
}

/**
 * 快速启用监控
 */
export function enableMonitoring(): void {
  const monitor = getGlobalMonitor();
  monitor.enable();
}

/**
 * 快速禁用监控
 */
export function disableMonitoring(): void {
  const monitor = getGlobalMonitor();
  monitor.disable();
}

/**
 * 手动检查循环
 */
export function checkForCycles(): { hasCycle: boolean; cycleLength?: number } {
  const monitor = getGlobalMonitor();
  return monitor.manualCycleCheck();
}

/**
 * 获取监控状态
 */
export function getMonitorStatus(): {
  enabled: boolean;
  historySize: number;
  config: MonitorConfig;
  lastCycleCheck?: { hasCycle: boolean; cycleLength?: number };
  failureCount?: number;
} {
  const monitor = getGlobalMonitor();
  const status = monitor.getStatus();
  
  // 添加失败监控状态
  const failureMonitor = globalFailureMonitor;
  if (failureMonitor) {
    // Create a new object with the failureCount property
    return {
      ...status,
      failureCount: failureMonitor.getFailureCount()
    };
  }
  
  return status;
}

// 默认导出全局监控器
export default getGlobalMonitor();