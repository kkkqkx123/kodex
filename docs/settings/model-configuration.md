# 模型配置与API密钥存储

## 通过 `/model` 命令配置的模型存储位置

通过 `/model` 命令配置的模型数据存储在以下位置：

### 全局配置文件
- **文件路径**: `~/.kode.json` (实际位置)
- **环境变量覆盖**: 可通过设置 `KODE_CONFIG_DIR` 环境变量修改配置目录
- **存储结构**: 模型配置保存在 `modelProfiles` 数组中

### 配置路径冲突分析

经过详细检查，发现系统中存在配置路径的冲突和多个不同配置方式：

#### 1. 主要冲突点
- **代码定义**: `src/utils/env.ts` 中 `GLOBAL_CLAUDE_FILE` 路径逻辑
- **实际文件**: 用户目录下同时存在 `~/.kode.json` 和 `~/.kode/` 目录

#### 2. 路径生成逻辑
```typescript
// 当未设置 KODE_CONFIG_DIR 时
GLOBAL_CLAUDE_FILE = join(homedir(), CONFIG_FILE)  // ~/.kode.json

// 当设置 KODE_CONFIG_DIR 时  
GLOBAL_CLAUDE_FILE = join(CLAUDE_BASE_DIR, 'config.json')  // $KODE_CONFIG_DIR/config.json
```

#### 3. 实际文件结构
```
~/
├── .kode.json          # 主要的全局配置文件（17169字节）
└── .kode/              # 配置目录
    ├── monitor/
    │   └── config.json # 监控配置（119字节）
    ├── agents/         # 代理相关配置
    └── 其他配置文件...
```

#### 4. 历史遗留问题
这种配置路径的差异可能是由于：
1. **版本升级**: 从旧版本迁移时配置路径发生变化
2. **环境变量**: 可能曾经设置过 `KODE_CONFIG_DIR` 环境变量
3. **代码逻辑**: 路径生成逻辑在不同条件下产生不同结果

### 配置文件内容示例
```json
{
  "modelProfiles": [
    {
      "name": "My Claude Model",
      "provider": "anthropic", 
      "modelName": "claude-3-5-sonnet",
      "apiKey": "sk-ant-api03-xxxxxxxxxxxxxxxx",
      "maxTokens": 4096,
      "contextLength": 200000,
      "isActive": true,
      "createdAt": 1735737600000
    }
  ],
  "modelPointers": {
    "main": "claude-3-5-sonnet",
    "task": "claude-3-5-sonnet", 
    "reasoning": "claude-3-5-sonnet",
    "quick": "claude-3-5-sonnet"
  }
}
```

### 配置系统的多路径支持

系统支持多种配置存储方式，按优先级排序：

#### 1. 全局配置主文件
- **路径**: `~/.kode.json`
- **用途**: 存储模型配置、用户偏好、API密钥等核心配置
- **优先级**: 最高（当未设置环境变量时）

#### 2. 环境变量指定目录
- **路径**: `$KODE_CONFIG_DIR/config.json`
- **触发条件**: 设置 `KODE_CONFIG_DIR` 环境变量
- **用途**: 自定义配置存储位置

#### 3. 监控配置
- **路径**: `~/.kode/monitor/config.json`
- **用途**: 专门存储监控相关的配置
- **独立性**: 与其他配置分离，避免冲突

#### 4. 项目级配置
- **路径**: `./.kode/config.json`
- **用途**: 项目特定的配置覆盖
- **优先级**: 项目配置覆盖全局配置

### 配置加载优先级

系统按以下优先级加载配置（从高到低）：
1. 环境变量和运行时参数
2. 项目级配置 (`./.kode/config.json`)
3. 全局配置 (`~/.kode.json` 或 `$KODE_CONFIG_DIR/config.json`)
4. 监控配置 (`~/.kode/monitor/config.json`)
5. 默认配置值

## 相关文件分析

虽然表面上看起来没有直接相关的文件，但实际上配置系统涉及以下核心文件：

### 1. 配置管理文件
- `src/utils/config/global.ts` - 全局配置管理
- `src/utils/config/utils.ts` - 配置读写工具函数
- `src/utils/config/types.ts` - 配置类型定义

### 2. 模型管理文件  
- `src/utils/model.ts` - ModelManager类，包含addModel方法
- `src/components/ModelSelector/ModelSelector.tsx` - 模型选择器界面

### 3. 环境配置文件
- `src/utils/env.ts` - 定义配置文件路径常量
- `src/constants/product.ts` - 定义配置基础目录和文件名

## 配置存储流程

1. **用户交互**: 通过 `/model` 命令触发 ModelSelector 组件
2. **数据收集**: 用户输入API密钥、选择模型、配置参数
3. **验证处理**: ModelManager.addModel 方法验证模型唯一性
4. **数据保存**: 通过 saveGlobalConfig → saveConfig 保存到文件
5. **文件写入**: 使用 writeFileSync 写入 `~/.kode/config.json`

## 为什么看起来"无关"

配置系统采用了抽象的设计模式：
- **界面层**: ModelSelector 组件处理用户交互
- **业务层**: ModelManager 类处理业务逻辑  
- **持久层**: config/utils.ts 处理文件读写
- **类型层**: config/types.ts 定义数据结构

这种分层设计使得各个模块职责清晰，但同时也让文件间的关联不那么直观。

## 概述

Kode CLI工具使用统一的配置系统来管理模型设置和API密钥。所有配置数据都存储在本地JSON文件中，分为全局配置和项目配置两种类型。

## 配置文件位置

### 全局配置文件
- **默认路径**: `~/.kode/config.json`
- **环境变量覆盖**: 可通过设置 `KODE_CONFIG_DIR` 环境变量来修改配置目录
- **环境变量覆盖时的路径**: `$KODE_CONFIG_DIR/config.json`

### 项目配置文件
- **路径**: `./.kode/config.json` (相对于当前项目根目录)

## 配置存储结构

### 全局配置结构 (GlobalConfig)
全局配置存储在 `~/.kode/config.json` 文件中，主要包含以下字段：

```typescript
interface GlobalConfig {
  // ... 其他配置字段
  modelProfiles?: ModelProfile[]     // 模型配置列表
  modelPointers?: ModelPointers     // 模型指针系统
  defaultModelName?: string          // 默认模型
}
```

### 模型配置结构 (ModelProfile)
每个模型配置包含以下字段：

```typescript
interface ModelProfile {
  name: string           // 用户友好的名称
  provider: ProviderType // 提供商类型 (anthropic, openai, azure等)
  modelName: string      // 实际模型标识符 (主键)
  baseURL?: string       // 自定义端点 (用于Azure和自定义OpenAI)
  apiKey: string         // API密钥 (明文存储)
  maxTokens: number      // 输出token限制
  contextLength: number  // 上下文窗口大小
  reasoningEffort?: string // 推理努力级别
  isActive: boolean      // 是否启用
  createdAt: number      // 创建时间戳
  lastUsed?: number      // 最后使用时间戳
}
```

### 支持的提供商类型 (ProviderType)
- `anthropic` - Anthropic Claude
- `openai` - OpenAI GPT
- `azure` - Azure OpenAI
- `custom-openai` - 自定义OpenAI兼容API
- `mistral`, `deepseek`, `kimi`, `qwen`, `glm` 等

## 设置流程

### 1. 模型选择器流程 (ModelSelector)
用户通过多步骤界面设置模型：

1. **选择提供商**: 用户选择模型提供商 (anthropic, openai, azure等)
2. **输入API密钥**: 通过ApiKeyInputScreen组件输入API密钥
   - 支持掩码显示
   - 支持Enter/Tab快捷键提交
   - API密钥存储在组件状态中
3. **配置参数**: 设置maxTokens、reasoningEffort等参数
4. **验证和保存**: 验证配置并保存到全局配置

### 2. API密钥处理
- API密钥通过 `handleApiKeyChange` 函数处理输入变更
- 提交时通过 `handleApiKeySubmit` 函数处理
- 对于Azure提供商，需要额外输入资源名称
- 对于自定义OpenAI，需要输入自定义baseURL

### 3. 配置保存流程
1. **构建配置对象**: 创建包含所有必要字段的ModelProfile对象
2. **验证唯一性**: 检查modelName和name是否重复
3. **添加到配置**: 将新模型配置添加到modelProfiles数组
4. **设置指针**: 如果是第一个模型，设置所有模型指针
5. **保存到文件**: 通过saveGlobalConfig保存到 `~/.kode/config.json`

## 配置保存机制

### 1. ModelManager.addModel方法
```typescript
async addModel(config: Omit<ModelProfile, 'createdAt' | 'isActive'>): Promise<string>
```
- 验证模型唯一性 (检查modelName和name重复)
- 构建完整的ModelProfile对象
- 添加到modelProfiles数组
- 首次添加时设置所有模型指针
- 调用saveConfig保存配置

### 2. saveGlobalConfig函数
```typescript
function saveGlobalConfig(config: GlobalConfig): void
```
- 调用saveConfig函数
- 保存到GLOBAL_CLAUDE_FILE路径 (`~/.kode/config.json`)
- 在测试环境中使用内存配置

### 3. saveConfig函数
```typescript
function saveConfig<A extends object>(file: string, config: A, defaultConfig: A): void
```
- 过滤掉与默认值相同的字段
- 使用JSON.stringify格式化配置
- 通过writeFileSync写入文件
- 文件编码为UTF-8

## 配置读取机制

### 1. getGlobalConfig函数
```typescript
function getGlobalConfig(): GlobalConfig
```
- 从 `~/.kode/config.json` 读取配置
- 如果文件不存在，返回默认配置
- 处理JSON解析错误
- 支持配置迁移

### 2. getConfig函数
```typescript
function getConfig<A>(file: string, defaultConfig: A, throwOnInvalid?: boolean): A
```
- 检查文件是否存在
- 读取文件内容并解析JSON
- 处理解析错误和回退到默认配置
- 支持向后兼容性

## 安全注意事项

1. **API密钥存储**: API密钥以明文形式存储在本地配置文件中
2. **文件权限**: 配置文件应设置适当的文件权限限制访问
3. **环境变量**: 支持通过环境变量提供API密钥 (ANTHROPIC_API_KEY, OPENAI_API_KEY)
4. **密钥截断**: 在配置界面中显示API密钥的后20位用于识别

## 错误处理

1. **重复模型**: 如果modelName或name重复，抛出错误
2. **文件读写错误**: 捕获文件系统错误并提供友好的错误信息
3. **JSON解析错误**: 处理格式错误的JSON文件
4. **网络错误**: 在获取模型列表时处理网络连接问题

## 示例配置

```json
{
  "modelProfiles": [
    {
      "name": "My Claude Model",
      "provider": "anthropic",
      "modelName": "claude-3-5-sonnet",
      "apiKey": "sk-ant-api03-xxxxxxxxxxxxxxxx",
      "maxTokens": 4096,
      "contextLength": 200000,
      "reasoningEffort": "medium",
      "isActive": true,
      "createdAt": 1735737600000
    }
  ],
  "modelPointers": {
    "main": "claude-3-5-sonnet",
    "task": "claude-3-5-sonnet",
    "reasoning": "claude-3-5-sonnet",
    "quick": "claude-3-5-sonnet"
  },
  "defaultModelName": "claude-3-5-sonnet"
}
```

## 相关文件

- `src/utils/config/types.ts` - 配置类型定义
- `src/utils/config/global.ts` - 全局配置管理
- `src/utils/config/utils.ts` - 配置工具函数
- `src/utils/model.ts` - 模型管理器
- `src/components/ModelSelector/ModelSelector.tsx` - 模型选择器组件
- `src/utils/env.ts` - 环境配置和路径定义