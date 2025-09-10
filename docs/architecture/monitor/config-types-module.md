# Config & Types 配置与类型模块

## 概述

配置与类型模块提供监控系统的类型定义、配置管理和错误处理功能，确保系统的类型安全和配置一致性。

## 核心组件详解

### ConfigManager - 配置管理器

#### 功能描述
管理监控系统的配置，提供配置的加载、保存、验证和默认值处理功能。

#### 主要方法
- **loadConfig()**: 异步加载配置
- **loadConfigSync()**: 同步加载配置
- **saveConfig(config)**: 保存配置
- **getConfig()**: 获取当前配置
- **getConfigPath()**: 获取配置文件路径

#### 技术特点
- 支持同步和异步操作
- 自动创建默认配置
- 配置验证和规范化
- 安全的错误处理

### 类型定义系统

#### ToolCallRecord - 工具调用记录
```typescript
interface ToolCallRecord {
  id: string;           // 工具调用ID
  name: string;        // 工具名称
  input: any;          // 工具输入参数
  timestamp: number;   // 调用时间戳
  responseId?: string; // 关联的响应ID
}
```

#### MonitorConfig - 监控配置
```typescript
interface MonitorConfig {
  maxCycleSteps: number;                 // 最大循环检测步长
  maxHistorySteps: number;               // 最大历史记录步数
  enabled: boolean;                      // 是否启用监控
  terminateOnCycle: boolean;            // 检测到循环时是否终止任务
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug'; // 日志级别
  
  // 失败监控配置
  failureMonitorEnabled: boolean;       // 失败监控是否启用
  autoCompactFailureThreshold: number;  // 触发自动压缩的连续失败次数
}
```

#### CycleDetectionResult - 循环检测结果
```typescript
interface CycleDetectionResult {
  hasCycle: boolean;    // 是否检测到循环
  cycleLength?: number; // 循环步长
  cycleStartIndex?: number; // 循环开始位置
}
```

#### ToolCallResultRecord - 工具调用结果记录
```typescript
interface ToolCallResultRecord {
  id: string;           // 工具调用ID
  name: string;        // 工具名称
  content: string;     // 工具调用结果内容
  timestamp: number;   // 调用时间戳
  is_error: boolean;   // 是否为错误
  responseId?: string; // 关联的响应ID
}
```

### 错误处理系统

#### ToolCallCycleError - 循环错误
```typescript
class ToolCallCycleError extends Error {
  public readonly cycleLength: number; // 检测到的循环步长
  
  constructor(cycleLength: number) {
    super(`工具调用循环检测到循环，步长: ${cycleLength}`);
    this.name = 'ToolCallCycleError';
    this.cycleLength = cycleLength;
  }
}
```

## 默认配置

### DEFAULT_CONFIG
```typescript
const DEFAULT_CONFIG: MonitorConfig = {
  maxCycleSteps: 5,
  maxHistorySteps: 10,
  enabled: true,
  terminateOnCycle: true,
  logLevel: 'warn',
  
  failureMonitorEnabled: true,
  autoCompactFailureThreshold: 3
};
```

## 配置文件管理

### 配置文件位置
```typescript
// 配置文件路径
~/.kode/monitor/config.json
```

### 配置文件格式
```json
{
  "maxCycleSteps": 5,
  "maxHistorySteps": 10,
  "enabled": true,
  "terminateOnCycle": true,
  "logLevel": "warn",
  "failureMonitorEnabled": true,
  "autoCompactFailureThreshold": 3
}
```

## 配置验证

### 验证规则
- **maxCycleSteps**: 必须为大于0的数字，最大限制20
- **maxHistorySteps**: 必须为大于0的数字，最大限制50
- **enabled**: 必须为布尔值
- **terminateOnCycle**: 必须为布尔值
- **logLevel**: 必须为指定的日志级别之一
- **failureMonitorEnabled**: 必须为布尔值
- **autoCompactFailureThreshold**: 必须为大于0的数字

### 验证流程
1. 加载用户配置
2. 合并默认配置
3. 验证每个配置项
4. 应用限制和规范化
5. 返回验证后的配置

## 错误处理

### 配置加载错误
- 文件不存在时创建默认配置
- JSON解析错误时使用默认配置
- 文件权限错误时记录警告

### 配置保存错误
- 目录创建失败错误
- 文件写入错误
- 权限不足错误

## 性能优化

### 配置缓存
- 内存中缓存当前配置
- 减少文件读取次数
- 支持配置热更新

### 异步操作
- 异步文件操作避免阻塞
- 支持并发配置访问
- 错误隔离机制

## 扩展指南

### 添加新的配置项
```typescript
// 扩展 MonitorConfig 接口
interface MonitorConfig {
  // ... 现有配置项
  newConfigOption: string;
}

// 更新默认配置
const DEFAULT_CONFIG: MonitorConfig = {
  // ... 现有默认值
  newConfigOption: 'default_value'
};

// 添加验证逻辑
private static validateConfig(config: any): MonitorConfig {
  const validated = { ...DEFAULT_CONFIG };
  
  if (typeof config.newConfigOption === 'string') {
    validated.newConfigOption = config.newConfigOption;
  }
  
  return validated;
}
```

### 自定义配置存储
```typescript
class CustomConfigManager extends ConfigManager {
  static async loadConfig(): Promise<MonitorConfig> {
    // 实现自定义配置加载逻辑
    // 可以从数据库、环境变量或其他来源加载配置
  }
  
  static async saveConfig(config: Partial<MonitorConfig>): Promise<void> {
    // 实现自定义配置保存逻辑
  }
}
```

### 类型扩展
```typescript
// 扩展工具调用记录
interface ExtendedToolCallRecord extends ToolCallRecord {
  additionalField: string;
  metadata?: any;
}

// 扩展监控配置
interface ExtendedMonitorConfig extends MonitorConfig {
  advancedOptions: AdvancedOptions;
}
```

## 使用示例

```typescript
import { ConfigManager, DEFAULT_CONFIG } from '../monitor/config';

// 异步加载配置
const config = await ConfigManager.loadConfig();
console.log('当前配置:', config);

// 同步加载配置（适用于构造函数等场景）
const syncConfig = ConfigManager.loadConfigSync();

// 更新配置
await ConfigManager.saveConfig({
  maxHistorySteps: 20,
  logLevel: 'info'
});

// 获取配置文件路径
const configPath = ConfigManager.getConfigPath();
console.log('配置文件位置:', configPath);
```

## 最佳实践

1. **配置优先级**: 运行时配置 > 用户配置 > 默认配置
2. **错误处理**: 始终处理配置加载可能失败的情况
3. **类型安全**: 使用 TypeScript 接口确保配置类型安全
4. **性能考虑**: 在性能敏感场景使用同步加载，其他场景使用异步加载
5. **可测试性**: 通过依赖注入支持配置管理的测试