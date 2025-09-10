# Kode TUI 模块划分

## 核心模块架构

### 1. 应用入口层 (Application Entry)
- **REPL界面模块** (`src/screens/REPL.tsx`)
  - 主交互界面组件
  - 状态管理: 加载状态、消息队列、API密钥验证
  - 事件处理: 用户输入、取消请求、错误处理

### 2. UI组件层 (UI Components)
- **消息组件模块** (`src/components/messages/`)
  - `AssistantTextMessage`: 主文本消息渲染
  - `AssistantBashOutputMessage`: Bash命令输出渲染
  - `AssistantLocalCommandOutputMessage`: 本地命令输出渲染
  - 支持Markdown格式化、代码高亮、错误消息特殊处理

- **交互组件模块** (`src/components/`)
  - `PromptInput`: 用户输入捕获组件
  - `CustomSelect`: 自定义选择器组件
  - `binary-feedback/`: 二进制反馈组件
  - `permissions/`: 权限请求组件

- **基础UI模块**
  - `AsciiLogo`: ASCII艺术Logo组件
  - `ApproveApiKey`: API密钥批准组件
  - 各种装饰性和功能性UI元素

### 3. 工具基础设施层 (Utility Infrastructure)
- **终端控制模块** (`src/utils/terminal.ts`)
  - `setTerminalTitle`: 设置终端标题
  - `updateTerminalTitle`: 智能更新标题（基于AI分析）
  - `clearTerminal`: 清屏功能
  - 跨平台终端操作抽象

- **样式渲染模块** (`src/utils/markdown.ts`)
  - `applyMarkdown`: Markdown到终端格式的转换
  - 支持代码块高亮、列表、标题、链接等格式
  - 语法高亮集成 (`cli-highlight`)

- **主题系统模块** (`src/utils/theme.ts`)
  - `getTheme`: 主题获取和配置
  - 支持明暗主题和色盲友好模式
  - 语义化颜色定义（success、error、warning等）

- **消息处理模块** (`src/utils/messages.ts`)
  - `stripSystemMessages`: 系统消息过滤
  - 消息类型检测和处理
  - 空消息和特殊消息处理

### 4. Hook管理层 (Hook Management)
- **尺寸监听模块** (`src/hooks/useTerminalSize.ts`)
  - 全局终端尺寸状态管理
  - 响应式布局支持
  - 跨组件尺寸同步

## 模块依赖关系

```
REPL界面 → 消息组件 → 样式渲染 → 主题系统
         → 交互组件 → 终端控制
         → Hook管理
```

### 关键依赖
1. **Ink框架依赖**: 所有UI组件基于Ink的Box、Text等基础组件
2. **主题系统**: 所有组件颜色样式依赖主题配置
3. **终端控制**: UI组件可能需要终端操作功能
4. **尺寸Hook**: 响应式组件依赖终端尺寸信息

## 扩展点设计

### 1. 消息类型扩展
- 在 `src/components/messages/` 中添加新的消息组件
- 在 `AssistantTextMessage` 中添加新的消息类型检测

### 2. 主题扩展
- 在 `theme.ts` 中添加新的主题配置
- 更新主题类型定义和获取逻辑

### 3. 交互组件扩展
- 在 `src/components/` 中添加新的交互组件
- 集成到REPL界面的组件渲染逻辑中

### 4. 终端功能扩展
- 在 `terminal.ts` 中添加新的终端操作函数
- 确保跨平台兼容性

## 技术特色

1. **真正的组件化**: 每个功能都是独立的React组件
2. **响应式设计**: 自动适应终端尺寸变化
3. **主题系统**: 完整的明暗主题和可访问性支持
4. **Markdown支持**: 完整的Markdown到终端格式转换
5. **跨平台兼容**: 支持所有主流终端环境