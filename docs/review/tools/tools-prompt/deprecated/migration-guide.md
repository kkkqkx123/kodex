# 工具响应格式迁移指南

## 快速实施步骤

### 1. 立即实施（10分钟）
- [ ] 复制`shared-prompts.ts`到`src/utils/tool-response.ts`
- [ ] 在工具文件中导入并使用统一格式

### 2. 优先级工具（按使用频率）
1. **FileReadTool** - 高频使用
2. **FileWriteTool** - 高频使用  
3. **BashTool** - 高频使用
4. **GrepTool** - 中频使用
5. **GlobTool** - 中频使用

### 3. 代码示例

#### 统一后的FileReadTool响应
```typescript
renderResultForAssistant(data) {
  const { filePath, content, numLines } = data.file;
  const truncated = content.split('\n').slice(0, 5).join('\n');
  const prefix = `✅ 读取文件: ${filePath}\n`;
  
  return prefix + addLineNumbers({
    content: numLines > 5 ? truncated + '\n...' : content,
    startLine: 1
  });
}
```

#### 统一后的GrepTool响应
```typescript
renderResultForAssistant({ numFiles, filenames }) {
  const prefix = `🔍 找到 ${numFiles} 个匹配文件:\n`;
  const files = filenames.slice(0, 10).join('\n');
  const suffix = filenames.length > 10 ? '\n...' : '';
  
  return prefix + files + suffix;
}
```

### 4. 验证清单
- [ ] 响应包含统一前缀符号
- [ ] 文件路径使用绝对路径
- [ ] 内容截断符合规范
- [ ] 行号格式化一致
- [ ] 错误处理格式统一

## 实施时间估算
- 单个工具：5-10分钟
- 全部核心工具：30-45分钟
- 完整测试：15分钟