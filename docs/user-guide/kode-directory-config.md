# 项目级.kode目录配置支持

## 概述

Kode支持项目级的`.kode`目录配置，这使得项目级别的配置更加灵活和强大。

## 配置优先级

配置加载遵循以下优先级顺序（从高到低）：

1. **项目级.kode配置** (`./.kode/config.json`) - **最高优先级**
2. **全局配置** (`~/.kode.json` 或环境变量指定的配置)

## 配置文件格式

### .kode/config.json
```json
{
  "allowedTools": ["tool1", "tool2", "tool3"],
  "projectName": "my-project",
  "priority": "high",
  "customSettings": {
    "maxTokens": 4000,
    "temperature": 0.7
  }
}
```



## 配置合并规则

Kode支持`.kode/config.json`配置。

## 示例场景

### 场景1: 只有.kode配置
```bash
项目根目录/
├── .kode/
│   └── config.json
└── src/
```

**结果**: 使用.kode配置



## 支持的配置字段

### 工具权限配置
- `allowedTools`: 允许使用的工具列表
- `disabledTools`: 禁用的工具列表

### 项目设置
- `projectName`: 项目名称
- `maxTokens`: 最大token数
- `temperature`: 温度参数

### 高级配置
- `trustDialogAccepted`: 是否接受信任对话框
- `dontCrawlDirectory`: 是否禁止目录爬取

## 迁移指南

### 配置目录

Kode使用`.kode`目录进行配置：



## 最佳实践

1. **使用.kode作为主要配置**: 优先使用`.kode`目录获得最高优先级
2. **保持配置简洁**: 避免不必要的配置覆盖
3. **版本控制**: 将.kode/config.json加入版本控制
4. **环境特定配置**: 使用环境变量来覆盖特定环境的配置

## 故障排除

### 常见问题

1. **配置不生效**: 检查文件路径和JSON格式是否正确
2. **优先级问题**: 确认配置文件的优先级顺序
3. **权限问题**: 确保有读写配置文件的权限

### 调试方法

启用详细日志输出：
```bash
export DEBUG=kode:config*
kode your-command
```

## API参考

### loadProjectConfig()

加载项目级配置。

**返回值**: `Record<string, any> | null`

**示例**:
```typescript
import { loadProjectConfig } from '../utils/configLoader';

const config = loadProjectConfig();
if (config) {
  console.log('项目配置:', config);
}
```

### getProjectConfigSearchPaths()

获取项目配置搜索路径，按优先级排序。

**返回值**: `string[]`

**示例**:
```typescript
import { getProjectConfigSearchPaths } from '../utils/configLoader';

const paths = getProjectConfigSearchPaths();
console.log('配置搜索路径:', paths);
```

## 版本历史

- **v1.0.0**: 初始支持项目级.kode目录配置
- **v1.0.1**: 增强配置合并逻辑，修复优先级问题

## 相关链接

- [权限配置文档](./permission-configuration.md)
- [全局配置指南](../develop/configuration.md)
- [工具系统概述](../architecture/tools-system.md)