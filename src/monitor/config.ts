import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { MonitorConfig } from './types';

// Promisify fs functions for async operations
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

// Re-export MonitorConfig for external use
export type { MonitorConfig };

/** 默认配置 */
export const DEFAULT_CONFIG: MonitorConfig = {
  maxCycleSteps: 5,
  maxHistorySteps: 10,
  enabled: true,
  terminateOnCycle: true,
  logLevel: 'warn',
  
  // 失败监控相关默认配置
  failureMonitorEnabled: true,
  autoCompactFailureThreshold: 3
};

/** 配置管理器 */
export class ConfigManager {
  /** 获取配置文件路径 */
  static getConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, '.kode', 'monitor', 'config.json');
  }

  /** 加载配置 */
  static async loadConfig(): Promise<MonitorConfig> {
    try {
      const configPath = this.getConfigPath();
      
      // 确保配置文件目录存在
      await mkdirAsync(path.dirname(configPath), { recursive: true });
      
      // 如果配置文件不存在，创建默认配置
      try {
        await accessAsync(configPath, fs.constants.F_OK);
      } catch (err) {
        // 文件不存在，创建默认配置
        await writeFileAsync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
        return DEFAULT_CONFIG;
      }
      
      // 读取并验证配置
      const userConfigContent = await readFileAsync(configPath, 'utf8');
      const userConfig = JSON.parse(userConfigContent);
      return this.validateConfig(userConfig);
      
    } catch (error) {
      console.warn('加载监控配置失败，使用默认配置:', error.message);
      return DEFAULT_CONFIG;
    }
  }

  /** 同步加载配置（用于构造函数等同步场景） */
  static loadConfigSync(): MonitorConfig {
    try {
      const configPath = this.getConfigPath();
      
      // 确保配置文件目录存在
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      
      // 如果配置文件不存在，创建默认配置
      try {
        fs.accessSync(configPath, fs.constants.F_OK);
      } catch (err) {
        // 文件不存在，创建默认配置
        fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
        return DEFAULT_CONFIG;
      }
      
      // 读取并验证配置
      const userConfigContent = fs.readFileSync(configPath, 'utf8');
      const userConfig = JSON.parse(userConfigContent);
      return this.validateConfig(userConfig);
      
    } catch (error) {
      console.warn('同步加载监控配置失败，使用默认配置:', error.message);
      return DEFAULT_CONFIG;
    }
  }

  /** 验证配置 */
  private static validateConfig(config: any): MonitorConfig {
    const validated: MonitorConfig = { ...DEFAULT_CONFIG };
    
    if (typeof config.maxCycleSteps === 'number' && config.maxCycleSteps > 0) {
      validated.maxCycleSteps = Math.min(config.maxCycleSteps, 20); // 限制最大步长
    }
    
    if (typeof config.maxHistorySteps === 'number' && config.maxHistorySteps > 0) {
      validated.maxHistorySteps = Math.min(config.maxHistorySteps, 50); // 限制历史记录长度
    }
    
    if (typeof config.enabled === 'boolean') {
      validated.enabled = config.enabled;
    }
    
    if (typeof config.terminateOnCycle === 'boolean') {
      validated.terminateOnCycle = config.terminateOnCycle;
    }
    
    if (['silent', 'error', 'warn', 'info', 'debug'].includes(config.logLevel)) {
      validated.logLevel = config.logLevel;
    }
    
    // 验证失败监控相关配置
    if (typeof config.failureMonitorEnabled === 'boolean') {
      validated.failureMonitorEnabled = config.failureMonitorEnabled;
    }
    
    if (typeof config.autoCompactFailureThreshold === 'number' && config.autoCompactFailureThreshold > 0) {
      validated.autoCompactFailureThreshold = config.autoCompactFailureThreshold;
    }
    
    return validated;
  }

  /** 保存配置 */
  static async saveConfig(config: Partial<MonitorConfig>): Promise<void> {
    try {
      const configPath = this.getConfigPath();
      const currentConfig = await this.loadConfig();
      const mergedConfig = { ...currentConfig, ...config };
      
      await mkdirAsync(path.dirname(configPath), { recursive: true });
      await writeFileAsync(configPath, JSON.stringify(mergedConfig, null, 2), 'utf8');
      
    } catch (error) {
      console.error('保存监控配置失败:', error.message);
      throw error;
    }
  }

  /** 获取当前配置 */
  static async getConfig(): Promise<MonitorConfig> {
    return this.loadConfig();
  }
}