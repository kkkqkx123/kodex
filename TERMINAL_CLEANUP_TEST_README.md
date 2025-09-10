# 终端清理功能测试文件

本目录包含三个测试文件，用于全面测试终端清理功能，特别是针对Static组件的清理效果。

## 📋 测试文件说明

### 1. `test-terminal-clear.js` - 基础终端清理测试
- **功能**: 测试基本的终端清理功能
- **场景**: 包含Static组件、消息渲染、工具UI和对话框
- **重点**: 测试`clearTerminal()`, `forceClearTerminal()`, `resetTerminal()`三个函数

### 2. `test-oauth-clear.js` - OAuth流程清理测试
- **功能**: 专门测试ConsoleOAuthFlow.tsx中的清理场景
- **场景**: 模拟OAuth认证成功后的Static组件清理
- **重点**: 重现第77行的清理逻辑 `clearTerminal() to clear out Static components`

### 3. `test-comprehensive-clear.js` - 综合场景测试
- **功能**: 完整的REPL界面模拟测试
- **场景**: 包含所有类型的Static组件和UI状态
- **重点**: 测试所有真实场景的清理效果

## 🚀 使用方法

### 运行测试
```bash
# 运行基础测试
node test-terminal-clear.js

# 运行OAuth专项测试  
node test-oauth-clear.js

# 运行综合测试
node test-comprehensive-clear.js
```

### 测试选项
每个测试文件都提供交互式控制：
- **数字键 [1-6]**: 执行不同的清理操作
- **字母键 [T/D/S]**: 切换不同的UI状态
- **X键**: 退出测试

## 🎯 测试场景覆盖

### Static组件类型
1. **Logo静态内容** - 应用标识信息
2. **Onboarding内容** - 项目引导信息  
3. **OAuth认证内容** - 认证流程信息
4. **工具UI内容** - 权限请求、反馈界面
5. **对话框内容** - 成本警告对话框

### 清理场景
1. **标准清理** - `clearTerminal()` 基础清理
2. **强制清理** - `forceClearTerminal()` 增强清理
3. **终端重置** - `resetTerminal()` 完全重置
4. **OAuth专项清理** - ConsoleOAuthFlow特定场景
5. **消息选择器清理** - REPL.tsx消息选择场景

## 🔍 排查问题指南

### 常见问题
1. **Static组件清理不彻底**
   - 检查ANSI转义序列是否正确
   - 验证多次清理序列是否生效

2. **终端状态残留**
   - 测试`resetTerminal()`是否重置所有属性
   - 检查光标位置和滚动缓冲区

3. **特定场景清理失败**
   - 使用对应的专项测试文件
   - 对比不同清理方法的效果

### 调试建议
1. 依次运行三个测试文件，观察清理效果
2. 在不同UI状态下测试清理功能
3. 关注控制台输出的清理日志
4. 对比标准清理和强制清理的差异

## 📝 测试预期结果

- ✅ Static组件内容被完全清除
- ✅ 终端滚动缓冲区清理干净  
- ✅ 光标位置重置到左上角
- ✅ 终端属性恢复到初始状态
- ✅ 不同UI状态下的清理一致性

## 🔧 技术实现

测试文件基于实际代码结构：
- 使用相同的`terminal.ts`清理函数
- 模拟真实的Static组件渲染
- 重现具体的清理调用场景
- 提供详细的调试输出

通过这三个测试文件，可以全面验证终端清理功能在各种真实场景下的表现，方便排查和解决清理相关问题。