// CLI 模块类型定义
import { Command } from '@commander-js/extra-typings';

/**
 * 命令接口定义
 */
export interface CommandInterface {
  /** 命令名称 */
  name: string;
  
  /** 命令描述 */
  description: string;
  
  /** 命令配置函数 */
  configure: (program: Command) => Command;
  
  /** 命令执行函数 */
  execute: (args: any) => Promise<void> | void;
}

/**
 * 命令注册器接口
 */
export interface CommandRegistry {
  /** 注册命令 */
  register: (command: CommandInterface) => void;
  
  /** 获取所有已注册命令 */
  getAll: () => CommandInterface[];
  
  /** 根据名称获取命令 */
  getByName: (name: string) => CommandInterface | undefined;
}

/**
 * CLI 配置选项
 */
export interface CliOptions {
  /** 工作目录 */
  cwd?: string;
  
  /** 安全模式 */
  safeMode?: boolean;
  
  /** 打印模式 */
  print?: boolean;
  
  /** 详细模式 */
  verbose?: boolean;
}