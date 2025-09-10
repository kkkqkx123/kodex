# Agents 模块架构概述

## 模块概览

Agents 模块是 Kode CLI 的核心功能模块，负责代理的创建、管理、加载和执行。该模块采用 React + TypeScript 实现，包含完整的 TUI 界面和后台服务。

## 核心组件结构

### 1. 主界面组件 (AgentsUI)
**文件**: `src/commands/agents.tsx`
**功能**: 代理管理的主界面，包含状态管理、模式切换和界面渲染框架

### 2. 代理列表组件 (AgentListView)
**文件**: `src/commands/agents.tsx`
**功能**: 显示代理列表，支持位置筛选、键盘导航和创建选项

### 3. 创建流程组件

#### 生成步骤组件 (GenerateStep)
**功能**: AI 生成代理配置，处理冲突和标识符验证

#### 类型输入组件 (TypeStep)  
**功能**: 手动输入代理类型，包含表单验证和错误提示

#### 描述步骤组件 (DescriptionStep)
**功能**: 输入代理用途描述，使用多行文本输入

#### 工具选择组件 (ToolsStep)
**功能**: 工具选择界面，支持分类选择、全选/反选功能

#### 权限选择组件 (Tool Permissions)
**功能**: 工具权限选择，带导航和筛选功能

#### 模型选择组件 (ModelStep)
**功能**: 按提供商分组选择模型，支持继承系统默认模型

#### 颜色选择组件 (ColorStep)
**功能**: 提供多种主题颜色选项，包含预览功能

#### 提示步骤组件 (PromptStep)
**功能**: 系统提示输入，使用多行文本输入组件

#### 确认步骤组件 (ConfirmStep)
**功能**: 配置预览、工具列表展示和创建确认

#### 保存位置组件 (Save Location)
**功能**: 保存位置选择，带导航功能

#### 创建方式组件 (MethodSelect)
**功能**: 支持 Claude 生成和手动配置两种方式

### 4. 编辑组件

#### 编辑菜单组件 (EditMenu)
**功能**: 提供编辑器打开、工具编辑、模型编辑和颜色编辑选项

#### 编辑工具步骤组件 (EditToolsStep)
**功能**: 工具编辑界面，支持分类选择和高级选项

#### 编辑模型步骤组件 (EditModelStep)
**功能**: 模型编辑，支持继承系统默认模型

#### 编辑颜色步骤组件 (EditColorStep)
**功能**: 颜色编辑，提供多种主题颜色选项

### 5. 查看组件

#### 查看代理组件 (ViewAgent)
**功能**: 查看代理详情，展示类型、位置、描述、模型、颜色等信息

#### 编辑代理组件 (EditAgent)
**功能**: 代理编辑界面，包含描述、工具和提示步骤的编辑

### 6. 工具组件

#### 多行文本输入组件 (MultilineTextInput)
**功能**: 带字数统计、状态指示和提交功能的多行输入

#### 加载动画组件 (LoadingSpinner)
**功能**: 加载动画，带文本状态显示

#### 空状态输入组件 (EmptyStateInput)
**功能**: 空状态输入处理

#### 删除确认组件 (DeleteConfirm)
**功能**: 删除确认，带状态管理和删除逻辑

## 服务层组件

### 1. 代理加载器 (AgentLoader)
**文件**: `src/utils/agentLoader.ts`
**功能**: 
- AgentConfig 类型定义
- 从 YAML frontmatter 格式解析代理配置
- 多目录扫描系统（支持 .kode 目录）
- 优先级覆盖机制
- 带缓存的查询函数
- 文件系统监控和热重载

### 2. 代理完成工具 (AgentCompletionUtility)
**文件**: `src/hooks/completion/AgentCompletionUtility.ts`
**功能**: 提供代理相关的自动完成建议

### 3. 任务进度消息组件 (TaskProgressMessage)
**文件**: `src/components/messages/TaskProgressMessage.tsx`
**功能**: 显示代理任务进度状态

### 4. 任务工具消息组件 (TaskToolMessage)
**文件**: `src/components/messages/TaskToolMessage.tsx`
**功能**: 显示代理工具使用消息

## 状态管理

### 创建状态管理 (CreateState)
**功能**: 处理代理创建流程中的各类状态更新

### 模式状态管理
**功能**: 处理创建、编辑、删除等不同操作模式的状态转换

## 核心功能

### 1. 数据加载
- 异步加载代理数据
- 取消令牌支持
- 代理缓存清理
- 动态工具加载

### 2. 键盘导航
- ESC 键逐级返回
- Enter 确认选择
- Tab 切换标签
- 上下箭头导航

### 3. 事件处理
- 代理选择处理
- 创建新代理
- 代理创建/删除结果处理

### 4. 配置验证
- 标识符唯一性验证
- 表单数据验证
- 配置完整性检查

## 目录结构

代理配置文件存储在多个目录中，按优先级排序：
1. `builtin` - 内置代理（最低优先级）
2. `~/.kode` - 用户级 Kode代理  
3. `./.kode` - 项目级 Kode代理（最高优先级）

## 配置文件格式

代理使用 YAML frontmatter 格式的 markdown 文件：

```markdown
---
agentType: "code-review"
whenToUse: "Use this agent for code review and quality assurance"
tools:
  - "CodeReview"
  - "StaticAnalysis"
systemPrompt: "You are a code review expert..."
color: "blue"
---

# 代理描述文档内容...
```

## 集成点

- 与 ModelManager 集成进行模型选择
- 与权限系统集成进行工具权限管理
- 与完成系统集成提供代理建议
- 与消息系统集成显示任务进度

这个模块提供了完整的代理生命周期管理，从创建、配置、编辑到执行和监控。