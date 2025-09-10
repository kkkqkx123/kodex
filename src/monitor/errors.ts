/**
 * 工具调用监控模块错误定义
 */

export class MonitorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MonitorError';
  }
}

export class ConfigLoadError extends MonitorError {
  constructor(message: string) {
    super(`配置加载失败: ${message}`);
    this.name = 'ConfigLoadError';
  }
}

export class ConfigSaveError extends MonitorError {
  constructor(message: string) {
    super(`配置保存失败: ${message}`);
    this.name = 'ConfigSaveError';
  }
}

export class InvalidConfigError extends MonitorError {
  constructor(field: string, value: any) {
    super(`无效配置: 字段 ${field} 的值 ${value} 无效`);
    this.name = 'InvalidConfigError';
  }
}

export class HistoryOverflowError extends MonitorError {
  constructor(maxSize: number) {
    super(`历史记录溢出: 超过最大大小 ${maxSize}`);
    this.name = 'HistoryOverflowError';
  }
}

export class CycleDetectionError extends MonitorError {
  constructor(message: string) {
    super(`循环检测错误: ${message}`);
    this.name = 'CycleDetectionError';
  }
}