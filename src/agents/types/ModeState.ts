// ModeState.ts - 代理模式状态类型定义
// TODO: 根据实际需求完善此类型定义

export interface ModeState {
  // 模式名称
  mode: string;
  // 模式配置
  config?: Record<string, any>;
  // 模式是否激活
  active: boolean;
  // 模式特定的其他属性
  [key: string]: any;
}