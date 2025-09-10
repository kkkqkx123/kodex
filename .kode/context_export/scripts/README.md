# Kode Context Logs Formatter

这个目录包含用于整理Kode上下文导出日志的脚本。

## 文件说明

- `format_context_logs.py` - 主要的Python格式化脚本
- `format_logs.bat` - Windows批处理文件，方便运行
- `README.md` - 说明文档

## 功能特性

- ✅ 自动检测并处理 `.kode/context_export` 目录下的所有JSON文件
- ✅ 将JSON格式转换为易读的文本格式
- ✅ 格式化时间戳为可读格式
- ✅ 清晰的消息对话展示，支持tool_use和tool_result类型的消息
- ✅ 上下文信息整理
- ✅ 支持中文字符

## 使用方法

### 方法1: 使用Python脚本（推荐）
```bash
cd .kode/context_export/scripts
python format_context_logs.py
```

### 方法2: 使用批处理文件（Windows）
```cmd
cd .kode/context_export/scripts
format_logs.bat
```
或者直接双击运行 `format_logs.bat`

## 输出格式

脚本会为每个JSON文件生成对应的 `.txt` 文件，包含：

1. **文件头信息** - 导出时间和导出ID
2. **会话消息** - 格式化的对话记录，按时间顺序排列
3. **上下文信息** - 包括目录结构、Git状态等

## 依赖要求

- Python 3.6+
- 无需额外安装依赖包

## 示例输出

处理后的文件格式示例：
```
================================================================================
KODE CONTEXT EXPORT - 0907_1418_9203c13d-8c45-4c5f-9eeb-f9dcf06ca7d8.json
================================================================================

导出时间: 2025-09-07 06:18:58
导出ID: d6d31629-493d-4eb5-9f19-6ca16d205615

会话消息:
----------------------------------------
1. [USER] 2025-09-07 06:10:09
   测试task工具是否正常。按照提示词中对相关工具的说明尝试执行

2. [ASSISTANT] 2025-09-07 06:10:09
   ✿TASK✿: 测试 task 工具是否正常。
✿ARGS✿: 检查当前项目的任务状态
```

## 注意事项

- 脚本会读取 `.kode/context_export` 目录下的所有 `.json` 文件
- 生成的格式化文件保存在同一目录下，文件名格式为 `formatted_原文件名.txt`
- 如果内容过长，代码风格部分会被截断以保持文件可读性