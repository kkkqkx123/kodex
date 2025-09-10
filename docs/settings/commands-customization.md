# Commands 自定义支持分析

## 概述

Kode CLI 提供了多种形式的命令自定义支持，包括 JSON 配置文件和 Markdown 格式的自定义命令。系统支持全局和项目级别的配置，以及丰富的自定义选项。

## 自定义形式

### 1. JSON 配置文件格式

#### 配置文件位置
- **全局配置**: `~/.kode/commands/`
- **项目配置**: `./.kode/commands/`

#### 配置模板结构
```json
{
  "name": "command-name",
  "description": "Configuration for command-name command",
  "enabled": true,
  "usesLLMApi": true,
  "prompt": "自定义提示词模板",
  "customSettings": {}
}
```

#### 支持的配置选项
- **enabled**: 控制命令是否启用（默认 true）
- **usesLLMApi**: 是否使用 LLM API（影响提示词扫描）
- **prompt**: 自定义提示词模板
- **customSettings**: 自定义设置对象

### 2. Markdown 自定义命令格式

#### 文件格式
```markdown
---
name: command-name
description: 命令描述
aliases: [alias1, alias2]
enabled: true
hidden: false
progressMessage: 运行中...
argNames: [arg1, arg2]
allowed-tools: [file_read, file_edit]
---

# 命令内容

您的自定义命令提示词内容。
支持以下功能：
- 参数替换: {arg1}, {arg2}
- 官方格式: $ARGUMENTS
- 文件引用: @src/file.js
- Bash 执行: !`git status`
```

#### Frontmatter 配置选项
- **name**: 命令显示名称（覆盖基于文件名的命名）
- **description**: 命令描述
- **aliases**: 命令别名数组
- **enabled**: 是否启用命令
- **hidden**: 是否在帮助中隐藏
- **progressMessage**: 运行时的进度消息
- **argNames**: 命名参数列表（支持传统 {arg} 占位符）
- **allowed-tools**: 限制可使用的工具列表

### 3. 命名空间支持

#### 自动命名空间生成
- **项目命令**: `project:namespace:command`
- **用户命令**: `user:namespace:command`
- 命名空间基于目录结构自动生成

#### 作用域区分
- **用户级别**: `~/.kode/commands/`
- **项目级别**: `./.kode/commands/`

## 管理工具

### config-cmd 命令
```bash
# 初始化配置目录
/config-cmd init

# 创建命令配置模板
/config-cmd create <command>
/config-cmd create <command> global

# 查看配置路径
/config-cmd paths
```

### 配置目录结构
```
~/.kode/commands/
  ├── compact.json
  ├── todo.json
  └── bug.json
  └── utils/
      └── helper-command.md

./.kode/commands/
  └── project-specific.json
  └── project-command.md
```

## 功能特性

### 1. 提示词自定义
- 支持占位符: `{args}`, `{project_file}`
- 支持动态内容处理
- 支持 Bash 命令执行
- 支持文件引用解析

### 2. 工具权限控制
- 通过 `allowed-tools` 限制命令可使用的工具
- 集成权限系统检查
- 支持工具白名单机制

### 3. 参数处理
- 传统 `{arg}` 占位符支持
- 官方 `$ARGUMENTS` 格式支持
- 命名参数映射

### 4. 作用域管理
- 全局配置优先于项目配置
- 配置合并机制
- 作用域感知的命令发现

## 使用示例

### JSON 配置示例
```json
{
  "name": "todo",
  "description": "Enhanced todo command",
  "enabled": true,
  "usesLLMApi": true,
  "prompt": "请帮我管理待办事项。当前参数: {args}",
  "customSettings": {
    "autoUpdate": true,
    "showProgress": true
  }
}
```

### Markdown 命令示例
```markdown
---
name: code-review
description: 代码审查命令
aliases: [cr, review]
enabled: true
progressMessage: 正在执行代码审查...
argNames: [file]
allowed-tools: [file_read, grep]
---

请对文件 @{file} 进行代码审查。

检查以下方面：
- 代码风格一致性
- 潜在 bug
- 性能优化建议
- 安全漏洞

!`git log -1 --oneline {file}`
```

## 最佳实践

1. **使用 JSON 配置** 用于修改现有命令的行为
2. **使用 Markdown 命令** 用于创建全新的自定义命令
3. **合理使用命名空间** 组织相关命令
4. **配置版本控制** 将项目配置纳入版本管理
5. **测试配置变更** 确保自定义配置不会破坏现有功能

## 限制与注意事项

- JSON 配置仅支持基本的数据类型
- Markdown 命令的 YAML frontmatter 支持有限语法
- 配置加载顺序：全局 > 项目 > 内置默认值
- 复杂的嵌套配置建议使用 Markdown 格式

## 未来发展

- 支持更丰富的配置验证
- 增强的模板引擎功能
- 可视化配置编辑器
- 配置导入导出功能
- 配置版本迁移工具