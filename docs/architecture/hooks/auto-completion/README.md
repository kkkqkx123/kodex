# 自动完成功能文档汇总

## 文档列表

### 核心总结
- **[summary.md](./summary.md)** - 自动完成功能总体概述
  - 功能特性、核心文件、架构设计
  - 工作流程、智能匹配、性能优化

### 智能体完成功能  
- **[agent-completion.md](./agent-completion.md)** - 智能体选择功能详细说明
  - AgentCompletionUtility 实现细节
  - 智能匹配算法、集成工作流
  - 补全格式、性能特性

### 工作流程
- **[workflow.md](./workflow.md)** - 完整工作流程说明
  - 输入监听、上下文分析、建议生成
  - 状态管理、补全执行、数据流架构
  - 性能优化、错误处理、监控调试

## 功能特点

### 智能体选择功能 (@提及)
- **智能体补全**: `@run-agent-*` 格式的智能体选择
- **模型咨询**: `@ask-*` 格式的模型选择
- **智能匹配**: 无需 @ 符号的直接匹配（如 `gp5` → `@ask-gpt-5`）
- **混合上下文**: 在文件上下文中智能匹配智能体

### 核心实现文件
- `src/hooks/useUnifiedCompletion.ts` - 统一完成系统
- `src/hooks/completion/AgentCompletionUtility.ts` - 智能体补全
- `src/hooks/completion/CommandCompletionUtility.ts` - 命令补全  
- `src/hooks/completion/FileCompletionUtility.ts` - 文件补全
- `src/hooks/completion/types.ts` - 类型定义

## 架构设计

### 模块化架构
```
用户输入 → 上下文分析 → 建议生成 → 状态管理 → 界面渲染
    ↓           ↓           ↓           ↓
CompletionContext  Command/Agent/File  CompletionState  UI组件
  Utility          CompletionUtility    Utility
```

### 核心工具类
1. **CompletionContextUtility** - 上下文分析
2. **AgentCompletionUtility** - 智能体建议生成  
3. **CommandCompletionUtility** - 命令建议生成
4. **FileCompletionUtility** - 文件建议生成
5. **CompletionStateUtility** - 状态管理

## 工作流程

### 主要阶段
1. **输入监听**: 监听用户输入和光标变化
2. **上下文分析**: 分析当前补全类型和前缀
3. **建议生成**: 根据上下文生成加权建议列表
4. **状态管理**: 管理补全状态和用户交互
5. **补全执行**: 执行选中的补全操作

### 智能匹配特性
- **连字符感知**: `dao` → `run-agent-dao-qi-harmony-designer`
- **缩写支持**: `dq` → `dao-qi`, `nde` → `node`  
- **数字后缀**: `py3` → `python3`
- **多算法融合**: 7+ 种匹配策略组合

## 性能优化

- **实时命令发现**: 从系统 PATH 动态加载
- **智能建议限制**: 默认15条结果，智能去重
- **延迟加载**: 按需加载智能体和模型建议
- **缓存机制**: 工具类实例和建议列表缓存

## 扩展性

- 模块化设计，易于添加新的补全类型
- 统一的类型系统，支持自定义权重
- 配置驱动的行为定制
- 支持动态添加智能体和模型

## 相关文档

- [主架构文档](../completion-module.md) - 完整的自动补全模块文档
- [智能体架构](../../agents/) - 智能体系统相关架构
- [输入权限](../input-permission-module.md) - 输入处理权限管理