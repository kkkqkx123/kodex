# API格式检测机制分析

## 概述

当前项目通过三层降级策略来检测接入的API是OpenAI格式还是Anthropic格式，主要实现在以下文件中：

- `src/components/ModelSelector.tsx` - 主要的三层降级检测逻辑
- `src/services/claude.ts` - Anthropic格式API的具体实现
- `src/services/openai.ts` - OpenAI格式API的具体实现

## 检测策略

### 三层降级检测机制

项目采用三层降级策略来检测API格式：

1. **第一层：Anthropic风格API检测**
   - 调用 `fetchAnthropicModels()` 函数
   - 使用 `/v1/models` 端点
   - 请求头包含：
     - `x-api-key` - API密钥
     - `anthropic-version: 2023-06-01` - Anthropic版本头
     - `User-Agent` - 用户代理标识

2. **第二层：OpenAI风格API检测**
   - 调用 `fetchCustomModels()` 函数
   - 使用 `/models` 或 `/v1/models` 端点（自动处理版本号）
   - 请求头包含：
     - `Authorization: Bearer {apiKey}` - 标准Bearer认证
     - `Content-Type: application/json`

3. **第三层：手动输入模式**
   - 前两层都失败时触发
   - 提供用户友好的错误信息和提示
   - 允许用户手动输入模型信息

## 具体实现细节

### Anthropic格式检测 (`fetchAnthropicModels`)

**位置**: `src/services/claude.ts` (约300-400行)

**特征**:
- 端点路径: `/v1/models`
- 认证方式: `x-api-key` 头
- 特殊头: `anthropic-version: 2023-06-01`
- 响应格式: 期望 `{ data: [...] }` 结构

**错误处理**:
- 401: 无效API密钥
- 403: 权限不足
- 429: 请求过多
- 5xx: 服务不可用

### OpenAI格式检测 (`fetchCustomModels`)

**位置**: `src/services/openai.ts` (约1224行)

**特征**:
- 端点路径: 自动处理版本号（包含`/v1/`则使用，否则使用`/models`）
- 认证方式: `Authorization: Bearer {apiKey}`
- 响应格式支持多种变体：
  - OpenAI标准格式: `{ data: [...] }`
  - 直接数组格式: `[...]`
  - 其他格式: `{ models: [...] }`

**错误处理**:
- 401/403: 认证错误
- 404: 端点不存在
- 429: 限流
- 5xx: 服务器错误

## 提供商特定配置

项目支持多种Anthropic兼容提供商：

1. **Official Anthropic**
   - BaseURL: `https://api.anthropic.com`
   - API密钥地址: `https://console.anthropic.com/settings/keys`

2. **BigDream**
   - BaseURL: `https://api-key.info`
   - 推广链接包含aff参数

3. **OpenDev**
   - BaseURL: `https://api.openai-next.com`
   - 推广链接包含aff参数

4. **Custom**
   - 用户自定义BaseURL
   - 使用通用的三层检测策略

## 其他模型提供商

项目还支持其他模型的获取：

- **Kimi**: 使用OpenAI格式，BaseURL: `https://api.moonshot.cn/v1`
- **DeepSeek**: 使用OpenAI格式，BaseURL: `https://api.deepseek.com`
- **SiliconFlow**: 使用OpenAI格式

## 智能错误处理

检测机制包含智能错误提示：

1. **API密钥错误**: 提供对应提供商的密钥获取链接
2. **权限错误**: 提示检查API密钥权限
3. **连接错误**: 提示检查网络连接
4. **服务错误**: 提示服务可能暂时不可用

## 总结

当前项目的API格式检测机制非常完善，通过：

1. **多层降级策略**确保最大兼容性
2. **智能错误处理**提供用户友好的提示
3. **多种提供商支持**覆盖主流API服务
4. **灵活的格式适配**支持多种响应格式变体

这种设计使得项目能够无缝接入各种兼容OpenAI和Anthropic格式的API服务。