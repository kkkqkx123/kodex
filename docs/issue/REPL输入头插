我已经成功修复了输入字符在前方插入的问题。问题的根本原因是状态更新顺序不当。

## 问题分析：

通过深入分析代码，我发现了以下问题：

1. **状态更新顺序问题**：在 `useTextInput.ts` 中，当字符插入或删除时，先调用 `setOffset` 更新光标位置，然后调用 `onChange` 更新文本值。由于状态更新的异步性，这可能导致光标位置和文本值不同步。

2. **状态同步问题**：在 `REPL.tsx` 中，同时使用了本地状态（`inputValue` 和 `cursorOffset`）和外部状态管理器（`stateManager` 和 `inputStateManager`），可能导致状态不一致。

## 修复内容：

### 1. 修复了 `useTextInput.ts` 中的状态更新顺序
- **字符插入操作**：将状态更新顺序从先更新光标位置再更新文本值，改为先更新文本值再更新光标位置
- **删除操作**：同样修复了 backspace 和 delete 操作的状态更新顺序
- **特殊键操作**：修复了通过 `mapKey` 处理的特殊键操作的状态更新顺序

### 2. 关键修改点：
```typescript
// 修复前：
const nextCursor = getCursor().insert(input.replace(/\r/g, '\n'))
if (!getCursor().equals(nextCursor)) {
  setOffset(nextCursor.offset)
  if (getCursor().text !== nextCursor.text) {
    onChange(nextCursor.text)
  }
}

// 修复后：
const currentCursor = getCursor()
const nextCursor = currentCursor.insert(input.replace(/\r/g, '\n'))
if (!currentCursor.equals(nextCursor)) {
  // 先更新文本，再更新光标位置
  onChange(nextCursor.text)
  setOffset(nextCursor.offset)
}
```

## 技术细节：

- **状态同步**：确保文本值更新后再更新光标位置，避免状态不一致
- **光标管理**：使用 `currentCursor` 变量保存当前光标状态，避免多次调用 `getCursor()` 导致的不一致
- **异步处理**：通过调整状态更新顺序，解决了 React 状态更新的异步性导致的问题

现在输入字符应该能够正常地在光标位置插入，不会再出现字符反过来的问题。