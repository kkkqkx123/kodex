# Kode TUI 组件分类文档

## 显示组件 (Display Components)

### 消息显示组件 (`src/components/messages/`)

#### 文本消息组件
- **`AssistantTextMessage`**: 主文本消息渲染，支持Markdown格式化、代码高亮
- **`UserTextMessage`**: 用户文本消息显示
- **`UserPromptMessage`**: 用户提示消息显示

#### 特殊消息组件
- **`AssistantBashOutputMessage`**: Bash命令输出渲染
- **`AssistantLocalCommandOutputMessage`**: 本地命令输出渲染
- **`AssistantThinkingMessage`**: AI思考状态显示
- **`AssistantToolUseMessage`**: 工具使用消息显示
- **`TaskProgressMessage`**: 任务进度消息显示

#### 用户输入消息组件
- **`UserBashInputMessage`**: Bash输入消息
- **`UserCommandMessage`**: 命令输入消息
- **`UserKodingInputMessage`**: Koding输入消息

### 界面元素组件

#### 状态指示器
- **`Cost`**: 成本显示组件
- **`ModeIndicator`**: 模式指示器
- **`ModelStatusDisplay`**: 模型状态显示
- **`Spinner`**: 加载旋转器
- **`TokenWarning`**: Token使用警告

#### 信息展示
- **`AsciiLogo`**: ASCII艺术Logo
- **`HighlightedCode`**: 语法高亮代码块
- **`StructuredDiff`**: 结构化差异显示
- **`TodoItem`**: 待办事项显示

#### 对话框组件
- **`CostThresholdDialog`**: 成本阈值对话框
- **`InvalidConfigDialog`**: 无效配置对话框
- **`MCPServerApprovalDialog`**: MCP服务器批准对话框
- **`TrustDialog`**: 信任对话框

## 控制组件 (Control Components)

### 输入控制组件

#### 主输入组件
- **`PromptInput`**: 主提示输入组件，支持:
  - 多模式输入 (bash/prompt/koding)
  - 自动补全和建议
  - 命令历史导航
  - 粘贴处理
  - 快捷键支持

#### 文本输入组件
- **`TextInput`**: 基础文本输入组件
- **`MessageSelector`**: 消息选择器输入
- **`ModelSelector`**: 模型选择器输入

### 选择器组件 (`src/components/CustomSelect/`)

#### 核心选择器
- **`Select`**: 通用选择器组件，支持:
  - 选项分组和子菜单
  - 高亮和焦点管理
  - 禁用状态处理
  - 自定义主题集成

#### 选择器工具
- **`SelectOption`**: 选择选项组件
- **`useSelectState`**: 选择器状态管理Hook
- **`useSelect`**: 选择器输入处理Hook

### 交互反馈组件 (`src/components/binary-feedback/`)

#### 二进制反馈系统
- **`BinaryFeedback`**: 二进制反馈主组件
- **`BinaryFeedbackView`**: 反馈界面显示
- **`BinaryFeedbackOption`**: 反馈选项组件

#### 功能特性
- 响应比较和选择
- 超时通知机制
- 事件日志记录
- 结果解析和处理

### 权限控制组件 (`src/components/permissions/`)

#### 权限请求系统
- **`PermissionRequest`**: 权限请求主组件
- **`PermissionRequestTitle`**: 权限请求标题

#### 具体权限请求组件
- **`BashPermissionRequest`**: Bash权限请求
- **`FileEditPermissionRequest`**: 文件编辑权限请求
- **`FileWritePermissionRequest`**: 文件写入权限请求
- **`FilesystemPermissionRequest`**: 文件系统权限请求
- **`FallbackPermissionRequest`**: 回退权限请求

#### 功能特性
- 工具特定的权限验证
- 风险评分显示
- 永久/临时权限选择
- Ctrl+C中断处理

### 特殊控制组件

#### 配置管理
- **`Config`**: 配置管理界面
- **`ModelConfig`**: 模型配置管理
- **`ModelListManager`**: 模型列表管理

#### 身份验证
- **`ApproveApiKey`**: API密钥批准
- **`ConsoleOAuthFlow`**: OAuth流程控制

#### 工具控制
- **`ToolUseLoader`**: 工具使用加载器
- **`LogSelector`**: 日志选择器
- **`MessageResponse`**: 消息响应控制

## 组件架构特点

### 1. 组件分层设计
- **显示层**: 纯展示组件，无状态或只读状态
- **控制层**: 包含用户交互和状态管理
- **基础设施层**: Hook和工具函数支持

### 2. 状态管理
- 使用React Hooks进行组件状态管理
- 全局状态通过Context共享
- 终端尺寸自适应状态管理

### 3. 主题集成
- 所有组件集成主题系统
- 支持明暗模式和色盲友好主题
- 语义化颜色使用

### 4. 可访问性
- 键盘导航支持
- 屏幕阅读器友好
- 高对比度主题支持

### 5. 扩展性
- 组件接口标准化
- 易于添加新的消息类型
- 权限系统可扩展

## 组件依赖关系

```
显示组件 → 主题系统 → 终端控制
控制组件 → 输入处理 → 状态管理
所有组件 → 尺寸Hook → 终端环境
```

这个组件架构提供了完整的TUI交互体验，从基础的消息显示到复杂的权限控制，都通过模块化的组件实现。