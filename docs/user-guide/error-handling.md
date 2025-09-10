# 错误处理系统指南

## 概述

Kode CLI 已更新其错误处理系统，现在提供简洁的错误摘要而非冗长的堆栈跟踪，使终端输出更加清晰易读。

## 新的错误输出格式

### 标准格式
```
❌ ErrorType: 错误消息
💡 建议：针对此错误的解决建议
```

### 示例
```
❌ Error: 文件未找到: config.json
💡 建议：请检查文件路径是否正确或文件是否存在

❌ PermissionError: 权限被拒绝
💡 建议：请检查文件权限或使用管理员权限运行

❌ NetworkError: 连接超时
💡 建议：请检查网络连接或稍后重试
```

## 功能特点

### 1. 智能错误分类
- **文件相关错误**：自动识别并提供文件路径检查建议
- **权限相关错误**：提示检查文件权限或管理员权限
- **网络相关错误**：建议检查网络连接
- **命令相关错误**：提示检查命令语法
- **超时错误**：建议稍后重试或增加超时时间

### 2. 简洁输出
- 移除冗长的堆栈跟踪
- 提供关键错误信息
- 给出明确的解决建议

### 3. 保留调试信息
- 完整错误信息仍记录在日志文件中
- 调试模式下可查看详细信息
- 不影响错误追踪和问题定位

## 使用方式

### 在代码中使用

#### 基本错误输出
```typescript
import { formatErrorBrief } from './src/utils/errorSummary';

try {
  // 某些操作
} catch (error) {
  console.error(formatErrorBrief(error));
}
```

#### 统一控制台输出
```typescript
import { printError, printWarning, printInfo } from './src/utils/consoleError';

// 错误输出
printError(error, 'ContextName');

// 警告输出  
printWarning('配置文件缺失，使用默认值', 'Config');

// 信息输出
printInfo('操作成功完成', 'Task');
```

#### 静默错误处理
```typescript
import { silentError } from './src/utils/consoleError';

// 非关键错误，只在调试模式显示
silentError(error, 'OptionalOperation');
```

### 调试模式

在调试模式下，可以通过以下方式查看详细错误信息：

```bash
# 使用调试参数运行
node cli.js --debug

# 或设置开发环境
NODE_ENV=development node cli.js
```

## 配置选项

### 环境变量

- `NODE_ENV=development`: 显示详细错误信息
- `DEBUG=true`: 启用调试模式
- `VERBOSE=true`: 显示更多上下文信息

### 日志文件

完整错误信息仍然记录在以下位置：
- Windows: `%APPDATA%\kode-cli\logs\errors.json`
- macOS: `~/Library/Application Support/kode-cli/logs/errors.json`
- Linux: `~/.config/kode-cli/logs/errors.json`

## 迁移指南

### 从旧版本迁移

1. **替换 console.error**: 将直接使用的 `console.error(error)` 替换为 `printError(error, context)`
2. **更新错误格式化**: 使用 `formatErrorBrief(error)` 替代手动格式化
3. **添加上下文信息**: 为错误添加上下文标签，便于问题定位

### 示例迁移

**旧代码：**
```typescript
console.error('操作失败:', error.message);
console.error(error.stack);
```

**新代码：**
```typescript
import { printError } from './src/utils/consoleError';
printError(error, 'FileOperation');
```

## 最佳实践

### 1. 分类处理
```typescript
import { summarizeError } from './src/utils/errorSummary';

const summary = summarizeError(error);
if (isNonCriticalError(error)) {
  silentError(error, 'BackgroundTask');
} else {
  printError(error, 'MainTask');
}
```

### 2. 用户友好提示
```typescript
import { formatErrorBrief } from './src/utils/errorSummary';

// 为用户显示简洁信息
console.error(formatErrorBrief(error));

// 同时记录完整信息用于调试
logError(error); // 记录到文件
```

### 3. 上下文增强
```typescript
import { printError } from './src/utils/consoleError';

// 提供有意义的上下文
printError(error, 'GitCommand');
printError(error, 'FileSystem');
printError(error, 'NetworkAPI');
```

## 故障排除

### 查看详细错误

如果需要查看完整错误信息：

1. 检查日志文件
2. 使用调试模式运行
3. 查看 Sentry 报告（如已配置）

### 自定义错误处理

可以扩展错误摘要系统：

```typescript
import { summarizeError } from './src/utils/errorSummary';

function customErrorHandler(error: unknown) {
  const summary = summarizeError(error);
  
  // 添加自定义逻辑
  if (summary.type === 'CustomError') {
    summary.suggestion = '请联系技术支持';
  }
  
  return summary;
}
```

## 相关文件

- `src/utils/errorSummary.ts`: 错误摘要核心逻辑
- `src/utils/consoleError.ts`: 统一控制台输出
- `src/utils/log.ts`: 日志记录（保留完整信息）