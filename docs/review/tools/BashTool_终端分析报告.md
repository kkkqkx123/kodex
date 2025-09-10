# BashTool 终端分析报告

## 概述

<mcsymbol name="BashTool" filename="BashTool.tsx" path="src\tools\BashTool\BashTool.tsx" startline="1" type="class"></mcsymbol> 是 Kode CLI 工具的核心命令执行组件，通过 <mcsymbol name="PersistentShell" filename="PersistentShell.ts" path="src\utils\PersistentShell.ts" startline="1" type="class"></mcsymbol> 实现跨平台的终端命令执行能力。

## 终端类型检测机制

### 1. 自动检测系统终端

<mcsymbol name="detectShell" filename="PersistentShell.ts" path="src\utils\PersistentShell.ts" startline="25" type="function"></mcsymbol> 方法自动检测当前系统的可用终端：

**检测优先级顺序：**
1. **环境变量检查**：首先检查 `process.env.SHELL` 环境变量
2. **Windows 平台检测**：
   - 检查 Git Bash (优先检测)
   - 检查 PowerShell (System32 路径)
   - 回退到 cmd.exe
3. **Unix-like 系统检测**：检查常见 shell 路径 (/bin/bash, /usr/bin/bash, /bin/zsh, /usr/bin/zsh)
4. **最终回退**：使用 /bin/sh

### 2. 支持的终端类型

- **Bash/Zsh**：Unix-like 系统（Linux, macOS）
- **PowerShell**：Windows 系统
- **cmd.exe**：Windows 备用终端

## 核心实现文件

### 1. 主要定义文件

- **<mcfile name="BashTool.tsx" path="src\tools\BashTool\BashTool.tsx"></mcfile>**：工具主入口，包含工具定义、输入验证、命令执行逻辑
- **<mcfile name="PersistentShell.ts" path="src\utils\PersistentShell.ts"></mcfile>**：终端会话管理，包含终端检测、命令执行、状态管理

### 2. 配置和提示词文件

- **<mcfile name="prompt.ts" path="src\tools\BashTool\prompt.ts"></mcfile>**：工具提示词定义，包含使用说明、安全限制、Git 操作指南
- **<mcfile name="tools.ts" path="src\tools.ts"></mcfile>**：工具注册文件，将 BashTool 注册到系统工具列表中

### 3. 权限管理文件

- **<mcfile name="permissions.ts" path="src\permissions.ts"></mcfile>**：权限检查逻辑，包含 BashTool 的特殊权限处理
- **项目配置文件**：`.kode/config.json` 存储工具权限设置

## 命令执行流程

### 1. 输入验证
通过 <mcsymbol name="validateInput" filename="BashTool.tsx" path="src\tools\BashTool\BashTool.tsx" startline="85" type="function"></mcsymbol> 方法：
- 检查禁止命令列表
- 验证目录访问权限（只能在原始工作目录及其子目录操作）
- 语法检查

### 2. 命令执行
通过 <mcsymbol name="call" filename="BashTool.tsx" path="src\tools\BashTool\BashTool.tsx" startline="172" type="function"></mcsymbol> 方法调用 PersistentShell：
- 使用 <mcsymbol name="exec" filename="PersistentShell.ts" path="src\utils\PersistentShell.ts" startline="270" type="function"></mcsymbol> 执行命令
- 支持超时控制（默认 2 分钟，最大 10 分钟）
- 支持中止信号处理

### 3. 结果处理
- 格式化输出（截断过长的输出）
- 更新文件读取时间戳
- 处理执行中断情况

## 跨平台适配

### Windows 适配
- **路径转换**：Windows 路径到 Unix 风格路径转换
- **PowerShell 优化**：针对 PowerShell 的特殊执行优化
- **Git Bash 支持**：自动检测和使用 Git Bash

> **注意**：当 CLI 项目使用 PowerShell 时，会优先使用 PowerShell 的命令。

### 多终端命令构建
通过 <mcsymbol name="buildCommandForShell" filename="PersistentShell.ts" path="src\utils\PersistentShell.ts" startline="320" type="function"></mcsymbol> 方法：
- **PowerShell**：使用 `Out-File` 重定向输出
- **Bash/Zsh**：使用标准重定向和文件操作

## 安全特性

### 1. 命令限制
- **禁止命令列表**：包含 curl、wget、rm -rf / 等危险命令
- **目录限制**：只能在会话原始目录及其子目录操作
- **语法检查**：执行前验证命令语法

### 2. 权限控制
- **安全模式**：需要显式权限才能使用 BashTool
- **命令级权限**：支持通配符模式和具体命令权限
- **安全命令白名单**：git status、git diff、pwd 等命令自动允许

## 性能优化

### 1. 持久化会话
- 单例模式维护终端会话
- 命令队列串行执行
- 环境状态保持（工作目录、环境变量）

### 2. 文件缓存
- 使用临时文件存储命令输出和状态
- 避免进程间通信的开销

## 总结

BashTool 通过 <mcsymbol name="PersistentShell" filename="PersistentShell.ts" path="src\utils\PersistentShell.ts" startline="1" type="class"></mcsymbol> 实现了智能的终端检测和跨平台命令执行能力，主要特点包括：

1. **自动终端检测**：智能识别系统可用终端类型
2. **跨平台支持**：完整支持 Windows (PowerShell/Git Bash) 和 Unix-like 系统
3. **安全执行**：多层次的安全检查和权限控制
4. **持久会话**：维护终端状态，提高执行效率
5. **Git 集成**：提供详细的 Git 操作指南和最佳实践

该工具是 Kode CLI 的核心组件之一，为 LLM 提供了安全、高效的命令行操作能力。