# Todo架构重构 - 文件路径说明

## 1. 统一数据模型层

### 1.1 核心数据模型
- **`src/types/unifiedTodo.ts`** - 统一数据模型接口定义
  - `UnifiedTodoItem` - 统一的任务项接口
  - `UnifiedTodoList` - 统一的任务列表接口

### 1.2 数据转换工具
- **`src/utils/todoConverter.ts`** - 数据格式转换工具
  - `fromTodoStorage()` - 从TodoStorage格式转换
  - `fromTodoService()` - 从TodoService格式转换  
  - `toTodoService()` - 转换为TodoService格式（向后兼容）

## 2. 仓储层 (Repository Layer)

### 2.1 仓储接口
- **`src/repository/todoRepository.ts`** - 仓储层抽象接口
  - `TodoRepository` - 定义统一的CRUD操作接口

### 2.2 具体实现
- **`src/repository/unifiedTodoRepository.ts`** - 统一仓储实现
  - `UnifiedTodoRepository` - 实现统一的数据访问逻辑

## 3. 服务层 (Service Layer)

### 3.1 统一服务
- **`src/services/unifiedTodoService.ts`** - 统一服务层
  - `UnifiedTodoService` - 单例服务，提供业务逻辑和协调

### 3.2 现有服务适配
- **`src/services/todoService.ts`** - 保持向后兼容（逐步废弃）
- **`src/utils/todoStorage.ts`** - 保持向后兼容（逐步废弃）

## 4. 事件驱动架构

### 4.1 事件总线
- **`src/events/todoEventBus.ts`** - 事件总线系统
  - `TodoEventBus` - 事件发布/订阅管理器
  - `TodoEvents` - 事件类型定义

### 4.2 事件订阅者
- **`src/services/systemReminder.ts`** - 系统提醒服务（订阅事件）
- **`src/services/fileFreshness.ts`** - 文件监控服务（订阅事件）

## 5. 应用层 (命令和工具)

### 5.1 命令系统改造
- **`src/commands/todo/show.ts`** - `/todo /show` 命令（使用统一服务）
- **`src/commands/todo/update.ts`** - `/todo /update` 命令（使用统一服务）
- **`src/commands/todo/new.ts`** - `/todo /new` 命令（使用统一服务）
- **`src/commands/todo/rollback.ts`** - `/todo /rollback` 命令（使用统一服务）
- **`src/commands/todo/utils.ts`** - 工具函数（添加统一格式化函数）

### 5.2 AI工具适配
- **`src/tools/TodoWriteTool/TodoWriteTool.tsx`** - TodoWrite工具（使用统一服务）
- **`src/tools/TodoWriteTool/prompt.ts`** - 工具提示词（保持不变）

## 6. 测试文件

### 6.1 单元测试
- **`test/utils/todoConverter.test.ts`** - 数据转换工具测试
- **`test/repository/unifiedTodoRepository.test.ts`** - 仓储层测试
- **`test/services/unifiedTodoService.test.ts`** - 服务层测试
- **`test/events/todoEventBus.test.ts`** - 事件总线测试

### 6.2 集成测试
- **`test/integration/todoCommands.test.ts`** - 命令集成测试
- **`test/integration/todoTools.test.ts`** - 工具集成测试

## 7. 配置文件

### 7.1 类型配置
- **`src/types/todo.ts`** - 现有类型定义（逐步迁移到unifiedTodo.ts）
- **`src/constants/todo.ts`** - Todo相关常量（如状态枚举、优先级等）

### 7.2 工具配置
- **`src/tools.ts`** - 工具注册文件（TodoWriteTool注册）

## 8. 实施阶段文件创建顺序

### 第一阶段：基础架构
1. `src/types/unifiedTodo.ts` - 数据模型
2. `src/utils/todoConverter.ts` - 转换工具
3. `src/repository/todoRepository.ts` - 仓储接口
4. `src/repository/unifiedTodoRepository.ts` - 仓储实现
5. `src/services/unifiedTodoService.ts` - 统一服务
6. `src/events/todoEventBus.ts` - 事件总线

### 第二阶段：命令改造
1. `src/commands/todo/show.ts` - 改造show命令
2. `src/commands/todo/update.ts` - 改造update命令
3. `src/commands/todo/new.ts` - 改造new命令
4. `src/commands/todo/utils.ts` - 添加格式化函数
5. `src/tools/TodoWriteTool/TodoWriteTool.tsx` - 改造工具

### 第三阶段：事件集成
1. `src/services/systemReminder.ts` - 集成事件订阅
2. `src/services/fileFreshness.ts` - 集成事件订阅

## 9. 文件依赖关系

```
unifiedTodo.ts (数据模型)
    ↑
todoConverter.ts (转换工具)
    ↑
todoRepository.ts (接口) → unifiedTodoRepository.ts (实现)
    ↑
unifiedTodoService.ts (服务层)
    ↑
todoEventBus.ts (事件) ← systemReminder.ts, fileFreshness.ts (订阅)
    ↑
show.ts, update.ts, new.ts (命令) ← TodoWriteTool.tsx (工具)
```

## 10. 注意事项

1. **向后兼容**：所有新文件需要与现有系统保持兼容
2. **渐进式迁移**：分阶段替换，确保每个阶段都可独立运行
3. **测试覆盖**：每个新文件都需要对应的单元测试
4. **文档更新**：代码变更需要同步更新相关文档
5. **错误处理**：完善的错误处理和日志记录

此文件路径说明为实施团队提供了清晰的开发指南，确保架构重构工作有序进行。