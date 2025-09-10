架构设计见docs\architecture目录
使用说明见docs\user-guide目录
TUI相关内容位于docs\TUI目录

该项目为CLI工具，所有ui设计都是为了提供命令行界面的交互体验。不要引入web开发中的概念

每次完成所有代码编辑后使用tsc --noEmit检查编译错误并修复。不需要使用bun run build或bun run dev
检查单个文件中的编译错误请参考以下形式：cd backend ; npx tsc --noEmit | rg "dual-mode-config.service.test.ts"
如果是单纯编辑文档则不需要检查编译错误

**语言**
变量、函数、类、文件等命名一律使用英文，代码一律使用英文，注释、文档一律使用中文。如果用户明确指定语言则用户指定的语言使用规则优先。
为模型编写提示词时一律使用英文，从而节约token