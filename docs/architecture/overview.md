# Kode 项目架构总览

## 项目概述

Kode 是一个 AI 驱动的终端助手，能够理解代码库、编辑文件、运行命令并自动化开发工作流程。项目采用 TypeScript 开发，基于 Node.js 运行时，使用 React 和 Ink 构建终端用户界面。

## 核心架构模块

### 1. 入口模块 (Entrypoints)
- **CLI 入口** (`src/entrypoints/cli.tsx`): 主命令行接口，处理参数解析和初始化
- **MCP 入口** (`src/entrypoints/mcp.ts`): Model Context Protocol 服务入口

### 2. 工具系统 (Tools)
- **文件操作工具**: FileReadTool, FileEditTool, FileWriteTool, MultiEditTool
- **代码分析工具**: GrepTool, GlobTool, LSTool, ContextCompactTool
- **系统工具**: BashTool, TaskTool, ThinkTool
- **AI 增强工具**: ArchitectTool, AskExpertModelTool
- **网络工具**: URLFetcherTool, WebSearchTool
- **记忆工具**: MemoryReadTool, MemoryWriteTool (仅限特定模型)

### 3. 命令系统 (Commands)
- **配置管理**: config, model, modelstatus
- **开发辅助**: bug, review, todo, doctor
- **身份验证**: login, logout
- **系统工具**: clear, compact, exit, quit
- **高级功能**: mcp, agents, context, kiro-spec

### 4. 服务层 (Services)
- **AI 服务**: claude.ts, openai.ts - AI 模型接口适配器
- **MCP 客户端**: mcpClient.ts - Model Context Protocol 集成
- **配置服务**: config.ts - 配置管理和持久化
- **监控服务**: sentry.ts - 错误监控和报告
- **状态管理**: statsig.ts - 功能标志和实验管理

### 5. 组件系统 (Components)
- **UI 组件**: 丰富的 React 组件库，支持终端渲染
- **交互组件**: 输入框、选择器、对话框等交互元素
- **状态显示**: 成本显示、模型状态、进度指示器等

### 6. 工具集 (Utils)
- **文件操作**: 文件读写、路径处理、Git 集成
- **文本处理**: Markdown 渲染、代码高亮、格式化
- **终端工具**: 终端尺寸处理、光标控制、颜色管理
- **安全工具**: 权限验证、安全文件操作

## 技术栈

- **运行时**: Node.js (≥18.0.0), Bun
- **UI 框架**: React + Ink (终端 React 渲染)
- **构建工具**: TypeScript, Prettier
- **AI 集成**: Anthropic Claude, OpenAI, MCP 协议
- **监控**: Sentry 错误监控
- **测试**: Bun 测试框架

## 架构特点

1. **模块化设计**: 清晰的职责分离，易于扩展和维护
2. **插件化架构**: 通过 MCP 协议支持外部工具集成
3. **响应式 UI**: 基于 React 的终端界面，支持实时更新
4. **类型安全**: 全面的 TypeScript 类型定义
5. **跨平台**: 支持 Windows, macOS, Linux
6. **内存优化**: 针对 PowerShell 等环境的特殊内存管理

## 数据流

```
用户输入 → CLI 解析 → 命令执行 → 工具调用 → AI 服务 → 结果渲染
```

## 扩展机制

- **自定义命令**: 通过配置文件添加新命令
- **MCP 工具**: 集成外部 Model Context Protocol 服务
- **插件系统**: 模块化的工具和组件系统

项目采用现代前端工程实践，具备良好的可维护性和扩展性，是开发效率工具的典范实现。