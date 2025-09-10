# 权限配置指南

## 概述

Kode 采用多级权限控制系统，允许您精确控制 AI 可以使用的工具和操作。权限系统支持安全模式下的细粒度控制，确保您的项目安全。

## 权限级别

### 1. 安全模式控制
- **安全模式启用时**: 所有工具使用都需要明确权限
- **安全模式禁用时**: 允许所有工具使用（默认宽松模式）

### 2. 工具权限类型
- **无需权限**: 只读操作，如文件读取、目录列表
- **会话权限**: 当前会话临时批准的权限
- **持久权限**: 跨会话保存的批准权限
- **始终询问**: 关键操作需要明确批准

## 配置位置

### 项目配置文件
`./.kode/config.json`

```json
{
  "allowedTools": [
    "FileReadTool",
    "GlobTool",
    "GrepTool",
    "BashTool(git:*)",
    "BashTool(npm:*)"
  ],
  "enableArchitectTool": false,
  "context": {
    "projectName": "my-project"
  }
}
```

### 全局配置文件
`~/.kode/config.json`

```json
{
  "theme": "dark",
  "safeMode": true,
  "modelProfiles": [],
  "modelPointers": {
    "main": "",
    "task": "",
    "reasoning": "",
    "quick": ""
  }
}
```

## 可用工具列表

### 文件操作工具
- `FileReadTool` - 文件读取工具
- `FileEditTool` - 文件编辑工具（精确替换）
- `FileWriteTool` - 文件写入工具（整体重写）
- `MultiEditTool` - 批量编辑工具
- `NotebookEditTool` - 笔记本编辑工具
- `NotebookReadTool` - 笔记本读取工具

### 搜索和发现工具
- `GlobTool` - 文件名模式匹配
- `GrepTool` - 文件内容搜索
- `LSTool` - 目录列表查看

### 命令执行工具
- `BashTool` - Bash 命令执行工具

### AI 增强工具
- `TaskTool` - 任务执行工具
- `ArchitectTool` - 架构设计工具
- `ThinkTool` - 思考工具
- `TodoWriteTool` - 任务管理工具
- `ContextCompactTool` - 上下文压缩工具

### 网络工具
- `URLFetcherTool` - URL 获取工具
- `WebSearchTool` - 网页搜索工具

### MCP 工具
- `MCPTool` - MCP 服务器工具

## BashTool 权限配置

BashTool 支持细粒度的命令权限控制：

### 通配符模式
```json
{
  "allowedTools": [
    "BashTool(git:*)",      // 允许所有 git 命令
    "BashTool(npm:*)",     // 允许所有 npm 命令
    "BashTool(bun:*)"      // 允许所有 bun 命令
  ]
}
```

### 具体命令
```json
{
  "allowedTools": [
    "BashTool(git status)",
    "BashTool(git diff)",
    "BashTool(git log)",
    "BashTool(pwd)",
    "BashTool(tree)"
  ]
}
```

### 安全命令（自动允许）
以下命令在安全模式下自动允许，无需配置：
- `git status`
- `git diff` 
- `git log`
- `git branch`
- `pwd`
- `tree`
- `date`
- `which`

## 配置管理命令

### 查看已批准工具
```bash
approved-tools list
```

### 移除工具权限
```bash
approved-tools remove "ToolName"
```

### 示例
```bash
# 查看当前项目允许的工具
approved-tools list

# 移除 BashTool 权限
approved-tools remove "BashTool"

# 移除具体的 git 命令权限
approved-tools remove "BashTool(git:*)"
```

## 权限申请流程

### 1. 工具使用请求
当 AI 尝试使用需要权限的工具时，系统会显示权限请求对话框。

### 2. 用户决策
- **允许**: 永久批准该工具
- **临时允许**: 仅当前会话有效
- **拒绝**: 拒绝工具使用
- **取消**: 取消当前操作

### 3. 权限保存
- 文件编辑工具：会话级权限（内存中）
- 其他工具：持久权限（保存到配置文件）

## 最佳实践

### 1. 最小权限原则
```json
{
  "allowedTools": [
    "FileReadTool",
    "GlobTool",
    "GrepTool",
    "BashTool(git status)",
    "BashTool(git diff)"
  ]
}
```

### 2. 项目特定配置
为不同项目设置不同的权限配置：

**前端项目**
```json
{
  "allowedTools": [
    "FileReadTool",
    "FileEditTool",
    "BashTool(npm:*)",
    "BashTool(bun:*)"
  ]
}
```

**后端项目**
```json
{
  "allowedTools": [
    "FileReadTool",
    "FileEditTool", 
    "BashTool(docker:*)",
    "BashTool(kubectl:*)"
  ]
}
```

### 3. 定期审查
定期使用 `approved-tools list` 审查已批准的权限。

## 故障排除

### 权限被拒绝
如果工具使用被拒绝：
1. 检查安全模式是否启用
2. 确认工具是否在 `allowedTools` 列表中
3. 检查 BashTool 命令格式是否正确

### 配置不生效
1. 确认配置文件路径正确
2. 检查 JSON 格式是否正确
3. 重启 Kode 应用新配置

## 安全注意事项

1. **谨慎授予写入权限**: FileEditTool 和 FileWriteTool 可以修改文件
2. **限制命令执行**: 使用具体的命令模式而非通配符
3. **定期审查**: 定期检查已批准的权限列表
4. **项目隔离**: 为不同项目设置不同的权限配置

## 相关文档

- [工具系统架构](../architecture/tools/overview.md)
- [权限模块设计](../architecture/hooks/input-permission-module.md)
- [配置管理系统](../develop/configuration.md)
