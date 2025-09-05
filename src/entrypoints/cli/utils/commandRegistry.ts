// 命令注册器实现
import { CommandInterface, CommandRegistry } from '../types';

/**
 * 命令注册器实现类
 */
class CommandRegistryImpl implements CommandRegistry {
  private commands: Map<string, CommandInterface> = new Map();

  register(command: CommandInterface): void {
    if (this.commands.has(command.name)) {
      throw new Error(`命令 ${command.name} 已存在`);
    }
    this.commands.set(command.name, command);
  }

  getAll(): CommandInterface[] {
    return Array.from(this.commands.values());
  }

  getByName(name: string): CommandInterface | undefined {
    return this.commands.get(name);
  }
}

// 创建全局命令注册器实例
export const commandRegistry = new CommandRegistryImpl();

/**
 * 注册命令的快捷函数
 */
export function registerCommand(command: CommandInterface): void {
  commandRegistry.register(command);
}

/**
 * 获取所有已注册命令
 */
export function getAllCommands(): CommandInterface[] {
  return commandRegistry.getAll();
}

/**
 * 根据名称获取命令
 */
export function getCommandByName(name: string): CommandInterface | undefined {
  return commandRegistry.getByName(name);
}