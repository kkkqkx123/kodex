# 权限机制文档

## 概述

Kode 项目实现了一个多层级的权限管理系统，用于控制 AI 助手可以使用的工具和命令。该系统支持多种权限类型，包括项目级、会话级和单次权限，并提供了灵活的配置选项。

## 权限类型

### 1. 项目级权限 (Project Level)
- **持久性**: 持久保存，跨会话有效
- **作用域**: 当前项目
- **存储位置**: 
  - `.kode/permissions.json` 文件
  - 项目配置文件中的 `allowedTools` 字段
- **使用场景**: 项目特定的工具授权

### 2. 会话级权限 (Session Level)
- **持久性**: 仅在当前会话中有效
- **作用域**: 当前项目
- **存储位置**: 项目配置文件中的 `sessionAllowedTools` 字段
- **使用场景**: 临时授权，会话结束后失效

### 3. 单次权限 (Once Level)
- **持久性**: 仅一次有效，5秒有效期
- **作用域**: 当前项目
- **存储位置**: 项目配置文件中的 `onceAllowedTools` 字段
- **使用场景**: 一次性授权操作

## 权限优先级

权限检查遵循以下优先级顺序（从高到低）：

1. **项目配置文件中的权限设置**
   - 检查项目配置文件中的 `allowedTools` 字段
   - 通过 `getCurrentProjectConfig()` 加载，项目级配置优先于全局配置

2. **`.kode/permissions.json` 文件中的权限设置**
   - 检查项目级权限配置文件
   - 专门用于存储项目级权限设置

3. **会话权限**
   - 检查 `sessionAllowedTools` 字段
   - 仅在当前会话中有效

4. **单次权限**
   - 检查 `onceAllowedTools` 字段
   - 5秒有效期

## 配置文件优先级

### 项目配置加载顺序
1. **项目级配置文件**（优先级最高）
   - `.kode/config.json`
   - 按顺序加载，后面的配置覆盖前面的配置

2. **全局配置文件**（优先级较低）
   - 当没有项目级配置时，回退到全局配置
   - 全局配置存储在用户的主目录中

### 权限配置文件
- **`.kode/permissions.json`**: 专门存储项目级权限设置
- **项目配置文件**: 存储项目级、会话级和单次权限设置

## 交互式授权处理逻辑

### 权限保存逻辑
当用户通过交互式授权授予权限时，权限会根据类型保存到相应的位置：

1. **项目级权限**:
   - 保存到 `.kode/permissions.json` 文件
   - 同时保存到项目配置文件中的 `allowedTools` 字段

2. **会话级权限**:
   - 保存到项目配置文件中的 `sessionAllowedTools` 字段

3. **单次权限**:
   - 保存到项目配置文件中的 `onceAllowedTools` 字段，包含时间戳

### 权限检查逻辑
在检查工具使用权限时，系统按照优先级顺序依次检查：

1. 项目配置文件中的 `allowedTools`
2. `.kode/permissions.json` 文件中的权限
3. 会话级权限 (`sessionAllowedTools`)
4. 单次权限 (`onceAllowedTools`)

### Bash 工具特殊处理
Bash 工具具有特殊的权限处理逻辑：
- 支持命令前缀匹配
- 支持子命令权限检查
- 对于安全命令（如 `git status`, `pwd` 等）自动授权

## 文件编辑工具权限
文件编辑工具（FileEditTool, FileWriteTool, NotebookEditTool）具有特殊的权限处理：
- 权限仅在内存中存储
- 不持久化到配置文件
- 需要单独的文件系统权限

## 配置文件结构

### 项目配置文件 (ProjectConfig)
```typescript
interface ProjectConfig {
  allowedTools: string[]          // 项目级权限
  sessionAllowedTools?: string[]  // 会话级权限
  onceAllowedTools?: Record<string, number> // 单次权限 (toolKey -> timestamp)
  // ... 其他配置项
}
```

### 项目级权限配置文件 (ProjectPermissionConfig)
```typescript
interface ProjectPermissionConfig {
  allowedTools: string[]          // 项目级权限
  sessionAllowedTools?: string[]  // 会话级权限
  onceAllowedTools?: Record<string, number> // 单次权限
}
```

## 最佳实践

1. **权限分配**: 优先使用项目级权限进行持久化授权
2. **临时授权**: 使用会话级或单次权限处理临时需求
3. **安全性**: 定期审查和清理权限配置
4. **配置管理**: 利用项目配置文件优先级机制进行灵活配置

## 故障排除

1. **权限未生效**: 检查权限优先级顺序，确认权限保存位置
2. **配置未加载**: 验证配置文件路径和格式
3. **权限冲突**: 理解权限优先级，合理分配权限类型