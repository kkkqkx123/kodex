# Statsig 服务分析文档

现在已经被src\services\featureFlags.ts代替

## 概述

Statsig 是 Kode 项目中用于功能开关管理和事件追踪的服务模块，基于 @statsig/js-client 库实现。

## 文件结构

### 1. statsig.ts
**位置**: `src/services/statsig.ts`
**功能**: 主服务文件，提供 Statsig 客户端功能

#### 主要功能
- **功能开关管理**: `checkGate`, `useStatsigGate`
- **事件追踪**: `logEvent` 方法
- **实验配置**: `getExperimentValue`, `getDynamicConfig`
- **环境感知**: 自动识别 CI、测试环境

#### 关键特性
- 使用 `memoize` 进行性能优化
- 支持 React Hooks (`useStatsigGate`)
- 丰富的元数据收集（会话ID、用户类型、环境信息等）
- 调试模式支持

### 2. statsigStorage.ts
**位置**: `src/services/statsigStorage.ts`
**功能**: 本地存储提供器实现

#### 主要功能
- 文件系统存储实现 `StorageProvider` 接口
- 内存缓存机制
- 自动目录管理 (`~/.kode/statsig/`)
- 完善的错误处理

## 技术实现

### 依赖库
- `@statsig/js-client`: 核心 Statsig 客户端
- `@statsig/client-core`: 存储提供器接口
- `lodash-es`: 工具函数
- `chalk`: 终端输出美化

### 存储机制
- 使用文件系统持久化数据
- 内存缓存提高读取性能
- URL 编码文件名避免冲突
- 支持环境变量配置目录位置

## 核心功能状态

**当前状态**: 大部分功能被注释掉，返回默认值

### 已禁用的功能
- `checkGate`: 始终返回 `true`
- `useStatsigGate`: 始终返回 `true`
- `getExperimentValue`: 始终返回默认值
- `getDynamicConfig`: 始终返回默认值
- `logEvent`: 事件记录被注释

### 仍活跃的功能
- 初始化流程 (`initializeStatsig`)
- 存储提供器 (`FileSystemStorageProvider`)
- 错误日志记录

## 集成点

### 环境配置
- `STATSIG_CLIENT_KEY`: 客户端密钥
- `KODE_CONFIG_DIR`/`CLAUDE_CONFIG_DIR`: 配置目录环境变量
- `CONFIG_BASE_DIR`: 基础配置目录

### 工具集成
- `env`: 环境信息工具
- `getUser`: 用户信息获取
- `getBetas`: Beta 功能获取
- `getIsGit`: Git 仓库检测
- `getModelManager`: 模型管理

## 重要性评估

### 非核心功能
- ✅ 不影响主要业务逻辑
- ✅ 可安全移除或禁用
- ✅ 主要用于监控和调试

### 潜在价值
- 🔧 A/B 测试框架
- 📊 用户行为分析
- 🎚️ 功能灰度发布
- 🔍 产品数据分析

## 建议

1. **保持现状**: 当前注释状态适合开发环境
2. **按需启用**: 生产环境需要时再启用相关功能
3. **密钥配置**: 启用前需要配置正确的 `STATSIG_CLIENT_KEY`
4. **监控评估**: 启用后监控性能和资源使用情况

## 相关文件

- `src/constants/keys.ts`: 包含 `STATSIG_CLIENT_KEY`
- `src/constants/product.ts`: 包含 `CONFIG_BASE_DIR`
- `src/utils/env.ts`: 环境检测工具
- `src/utils/user.ts`: 用户信息工具

---
*文档生成时间: 2024年*
*分析基于代码版本: 当前HEAD*