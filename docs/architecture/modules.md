# Kode 模块详细划分

## 核心模块架构

### 1. 应用入口层 (Entrypoints)
**位置**: `src/entrypoints/`
- `cli.tsx` - 主命令行入口，处理参数解析、初始化、渲染
- `mcp.ts` - MCP 协议服务入口

### 2. 工具系统层 (Tools)
**位置**: `src/tools/`

#### 文件操作工具
- `FileReadTool` - 文件读取工具
- `FileEditTool` - 文件编辑工具  
- `FileWriteTool` - 文件写入工具
- `MultiEditTool` - 批量文件编辑工具
- `NotebookReadTool` - 笔记本文件读取
- `NotebookEditTool` - 笔记本文件编辑

#### 代码分析工具
- `GrepTool` - 文本搜索工具
- `GlobTool` - 文件模式匹配工具
- `LSTool` - 目录列表工具
- `ContextCompactTool` - 上下文压缩工具

#### 系统操作工具
- `BashTool` - Bash 命令执行工具
- `TaskTool` - 任务管理工具
- `ThinkTool` - 思考辅助工具
- `TodoWriteTool` - 待办事项工具

#### AI 增强工具
- `ArchitectTool` - 架构设计工具（可选）
- `AskExpertModelTool` - 专家模型咨询工具

#### 网络工具
- `URLFetcherTool` - URL 内容获取工具（带缓存）
- `WebSearchTool` - 网络搜索工具

#### 记忆工具（特定模型专用）
- `MemoryReadTool` - 记忆读取工具
- `MemoryWriteTool` - 记忆写入工具

### 3. 命令系统层 (Commands)
**位置**: `src/commands/`

#### 配置管理命令
- `config` - 配置管理
- `config-cmd` - 命令配置
- `model` - 模型配置
- `modelstatus` - 模型状态查看

#### 开发辅助命令
- `bug` - Bug 报告
- `review` - 代码审查
- `todo` - 待办事项管理
- `doctor` - 系统诊断
- `context` - 上下文导出

#### 身份验证命令
- `login` - 用户登录
- `logout` - 用户登出

#### 系统工具命令
- `clear` - 清屏
- `compact` - 压缩操作
- `exit` - 退出程序
- `quit` - 退出程序（别名）
- `ignore` - 忽略文件管理

#### 高级功能命令
- `mcp` - MCP 协议管理
- `agents` - 智能体管理
- `kiro-spec` - Kiro 规范相关
- `terminalSetup` - 终端设置

#### 内部命令
- `ctx_viz` - 上下文可视化
- `resume` - 恢复会话
- `listen` - 监听模式

### 4. 服务层 (Services)
**位置**: `src/services/`

#### AI 服务
- `claude.ts` - Anthropic Claude 服务适配器
- `openai.ts` - OpenAI 服务适配器
- `modelAdapterFactory.ts` - 模型适配器工厂

#### MCP 集成
- `mcpClient.ts` - MCP 客户端管理
- `mcpServerApproval.tsx` - MCP 服务审批

#### 配置服务
- `customCommands.ts` - 自定义命令管理
- `fileFreshness.ts` - 文件新鲜度检查

#### 监控服务
- `sentry.ts` - Sentry 错误监控
- `statsig.ts` - Statsig 功能标志
- `statsigStorage.ts` - Statsig 存储

#### 工具服务
- `todoService.ts` - 待办事项服务
- `vcr.ts` - VCR 测试服务
- `responseStateManager.ts` - 响应状态管理

### 5. 组件层 (Components)
**位置**: `src/components/`

#### UI 基础组件
- `Config.tsx` - 配置组件
- `Help.tsx` - 帮助组件
- `Link.tsx` - 链接组件
- `Logo.tsx` - Logo 组件
- `TextInput.tsx` - 文本输入组件

#### 交互组件
- `ModelSelector.tsx` - 模型选择器
- `LogSelector.tsx` - 日志选择器
- `MessageSelector.tsx` - 消息选择器
- `TrustDialog.tsx` - 信任对话框

#### 状态显示组件
- `Cost.tsx` - 成本显示
- `ModelStatusDisplay.tsx` - 模型状态显示
- `TokenWarning.tsx` - Token 警告
- `Spinner.tsx` - 加载指示器

#### 消息组件
- `Message.tsx` - 消息显示
- `MessageResponse.tsx` - 消息响应
- `FallbackToolUseRejectedMessage.tsx` - 工具使用拒绝消息

### 6. 工具集层 (Utils)
**位置**: `src/utils/`

#### 文件工具
- `file.ts` - 文件操作工具
- `secureFile.ts` - 安全文件操作
- `git.ts` - Git 集成工具

#### 文本处理
- `markdown.ts` - Markdown 处理
- `format.tsx` - 格式化工具
- `diff.ts` - 差异比较

#### 终端工具
- `terminal.ts` - 终端操作
- `Cursor.ts` - 光标控制
- `style.ts` - 样式管理

#### 配置工具
- `config.ts` - 配置管理
- `env.ts` - 环境变量管理

#### 调试工具
- `debugLogger.ts` - 调试日志
- `errors.ts` - 错误处理
- `log.ts` - 日志管理

#### AI 相关工具
- `tokens.ts` - Token 计算
- `thinking.ts` - 思考辅助
- `ask.tsx` - 询问工具

### 7. 类型定义层 (Types)
**位置**: `src/types/`
- `logs.ts` - 日志类型定义
- `notebook.ts` - 笔记本类型定义
- `todo.ts` - 待办事项类型定义
- `conversation.ts` - 会话类型定义
- `RequestContext.ts` - 请求上下文类型

### 8. 常量定义层 (Constants)
**位置**: `src/constants/`
- `models.ts` - 模型常量
- `prompts.ts` - 提示词常量
- `product.ts` - 产品常量
- `keys.ts` - 键位常量
- `macros.ts` - 宏定义

## 模块依赖关系

```
Entrypoints → Commands → Tools → Services → Utils
                      ↘ Components ↗
```

## 扩展点

1. **添加新工具**: 在 `src/tools/` 创建新工具目录
2. **添加新命令**: 在 `src/commands/` 创建新命令文件
3. **添加新服务**: 在 `src/services/` 创建新服务
4. **自定义组件**: 在 `src/components/` 添加新组件
5. **MCP 集成**: 通过 MCP 协议集成外部工具

这种模块化架构使得 Kode 具有良好的可维护性和扩展性，每个模块职责单一，便于独立开发和测试。