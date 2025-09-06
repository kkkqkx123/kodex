# Grep工具用户指导

## 概述

Kode项目中的GrepTool是一个强大的内容搜索工具，支持在不同操作系统下自动选择最优的搜索工具进行文件内容搜索。

## 支持的搜索工具

### 1. Ripgrep (推荐)
**特点：**
- 高性能的搜索工具，速度极快
- 支持完整的正则表达式语法
- 自动处理.gitignore等忽略文件
- 支持多文件类型过滤
- 跨平台支持

**常用参数：**
- `-i` - 忽略大小写
- `-l` - 只列出包含匹配的文件名
- `--glob` - 文件模式过滤（如 `*.js`, `*.{ts,tsx}`）
- `-n` - 显示行号

### 2. Linux Grep
**特点：**
- 标准的Linux grep命令
- 支持基本正则表达式
- 在Linux系统下原生支持

**常用参数：**
- `-l` - 只列出包含匹配的文件名
- `--include` - 文件模式过滤
- `-i` - 忽略大小写
- `-n` - 显示行号

### 3. Windows PowerShell
**特点：**
- 在Windows系统下使用PowerShell实现grep功能
- 通过Get-ChildItem和Select-String组合实现
- 支持递归搜索

**实现方式：**
```powershell
Get-ChildItem -Path "路径" -Include "文件模式" -Recurse | Select-String -Pattern "搜索模式"
```

## 工具自动检测机制

GrepTool会自动检测系统中可用的搜索工具，按以下优先级选择：
1. Ripgrep (如果可用)
2. Linux Grep (在Linux系统下)
3. Windows PowerShell (在Windows系统下)
4. 回退到Ripgrep

## 使用方法

### 基本搜索
```
搜索包含"error"的文件
pattern: "error"
```

### 带文件类型过滤
```
在JavaScript文件中搜索"function"
pattern: "function"
include: "*.js"
```

### 多文件类型搜索
```
在TypeScript和TSX文件中搜索"interface"
pattern: "interface"
include: "*.{ts,tsx}"
```

### 指定搜索路径
```
在src目录下搜索"import"
pattern: "import"
path: "src"
```

## 正则表达式示例

- `log.*Error` - 匹配"log"后跟任意字符然后"Error"
- `function\s+\w+` - 匹配"function"后跟空格然后单词
- `^import` - 匹配以"import"开头的行
- `\d{3}-\d{2}-\d{4}` - 匹配社会安全号码格式

## 性能特点

- **快速**：优先使用Ripgrep，性能最优
- **智能排序**：结果按文件修改时间排序，最新文件优先
- **结果限制**：最多返回100个结果，避免过多输出
- **超时控制**：10秒超时，避免长时间阻塞

## 适用场景

1. **精确搜索** - 当你知道要搜索的具体模式时
2. **代码审查** - 查找特定的代码模式或错误模式
3. **重构辅助** - 查找需要修改的函数或变量
4. **文档搜索** - 在文档中查找特定内容

## 不适用场景

- 需要进行多轮模糊搜索和文件模式匹配时，建议使用Agent工具
- 需要复杂的文件系统遍历和模式匹配组合时

## 平台兼容性

| 平台 | 主要工具 | 备选工具 |
|------|----------|----------|
| Windows | Ripgrep | PowerShell |
| Linux | Ripgrep | GNU Grep |
| macOS | Ripgrep | BSD Grep |

## 故障排除

如果搜索工具无法正常工作：
1. 检查Ripgrep是否已安装并可执行
2. 在Linux系统检查grep命令是否可用
3. 在Windows系统检查PowerShell是否可用
4. 查看日志输出获取详细错误信息

## 相关工具

- **GlobTool** - 用于文件名模式匹配
- **LSTool** - 用于目录列表查看
- **FileReadTool** - 用于读取文件内容

---

*最后更新: 基于当前代码库分析*