# 任务执行期间Static元素冻结功能

## 功能概述

此功能确保在任务执行期间，原有的static元素不再刷新，直到任务结束才统一刷新。这解决了任务执行过程中界面闪烁和性能问题。

## 技术实现

### 核心组件：StaticElementManager

位置：`src/screens/REPL/StaticElementManager.ts`

功能特点：
- 单例模式管理static元素状态
- 任务状态跟踪（进行中/已完成）
- 任务期间缓存static更新请求
- 任务结束后统一刷新缓存的更新

### 集成点

#### 1. MessageRenderer 集成
- 监听任务状态变化
- 任务执行期间强制使用transient模式
- 缓存static元素避免重新计算

#### 2. MessageContainer 集成
- 根据任务状态动态调整渲染策略
- 虚拟化模式下也支持static冻结

#### 3. VirtualMessageList 集成
- 支持任务期间的static元素管理
- 提供disableStaticCaching参数控制缓存行为

## 使用方式

### 基本使用

组件自动集成，无需手动调用：

```typescript
// 任务开始时自动设置状态
const hasActiveProcess = inProgressToolUseIDs.size > 0 || toolJSX || toolUseConfirm
StaticElementManager.getInstance().setTaskStatus(hasActiveProcess)
```

### 手动控制（高级用法）

```typescript
import { StaticElementManager } from './StaticElementManager'

// 获取管理器实例
const manager = StaticElementManager.getInstance()

// 设置任务状态
manager.setTaskStatus(true)  // 开始任务，冻结static
manager.setTaskStatus(false) // 结束任务，允许刷新

// 注册任务结束回调
manager.onTaskEnd(() => {
  console.log('任务结束，static元素已刷新')
})

// 使用React Hook
const useStaticFreeze = StaticElementManager.useStaticFreeze()
```

## 测试验证

运行测试脚本验证功能：

```bash
node test-static-freeze.js
```

测试内容包括：
1. 任务开始时设置冻结状态
2. 任务期间阻止static更新
3. 任务结束时清除冻结状态
4. 任务结束后允许static刷新

## 性能优化

### 内存使用
- 任务期间缓存的static元素不会占用额外内存
- 任务结束后自动清理缓存

### 渲染性能
- 减少任务期间的DOM更新
- 避免不必要的重新渲染

## 兼容性

- ✅ Windows PowerShell
- ✅ Unix/Linux 终端
- ✅ 支持虚拟化渲染
- ✅ 向后兼容现有代码

## 故障排除

### 常见问题

1. **static元素未冻结**
   - 检查是否正确设置了任务状态
   - 确认组件正确集成了StaticElementManager

2. **任务结束后未刷新**
   - 验证任务状态是否正确清除
   - 检查是否有未处理的更新缓存

### 调试信息

启用调试日志：
```typescript
// 在StaticElementManager中启用调试
StaticElementManager.DEBUG = true
```

## 相关文件

- `src/screens/REPL/StaticElementManager.ts` - 核心管理器
- `src/screens/REPL/MessageRenderer.tsx` - 消息渲染器集成
- `src/screens/REPL/MessageContainer.tsx` - 容器组件集成
- `src/screens/REPL/VirtualMessageList.tsx` - 虚拟列表集成
- `test-static-freeze.js` - 测试脚本