# Todo系统长期架构重构方案

## 1. 问题背景

根据分析报告，当前Kode项目的Todo工具存在严重的架构问题：
- **双重存储系统**：TodoStorage和TodoService使用不同的存储键和数据模型
- **数据模型不一致**：两套不同的数据结构定义，字段命名和类型冲突
- **命令路由错误**：`/todo /show`命令使用错误的数据源
- **Agent作用域管理不当**：Agent数据无法通过命令系统访问

## 2. 架构设计目标

### 2.1 核心目标
1. **统一数据模型**：消除数据结构差异，提供一致的数据访问接口
2. **分层架构**：清晰的职责分离，提高可维护性和扩展性
3. **事件驱动**：实现松耦合的组件通信，支持实时状态同步
4. **向后兼容**：确保现有功能不受影响，平滑迁移

### 2.2 架构原则
- **单一数据源**：所有组件使用统一的存储接口
- **开闭原则**：对扩展开放，对修改关闭
- **依赖倒置**：高层模块不依赖低层模块，都依赖抽象

## 3. 统一数据模型设计

### 3.1 UnifiedTodoItem接口
**文件路径**: `src/types/unifiedTodo.ts`
```typescript
export interface UnifiedTodoItem {
  id: string
  content: string                    // 统一使用content字段
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  
  // 向后兼容字段
  title?: string                     // 兼容TodoService的title字段
  completed?: boolean                // 兼容TodoService的completed字段
  inProgress?: boolean               // 兼容TodoService的inProgress字段
  
  // 扩展字段
  description?: string
  tags?: string[]
  estimatedHours?: number
  createdAt: Date | number
  updatedAt: Date | number
  previousStatus?: 'pending' | 'in_progress' | 'completed'
}

export interface UnifiedTodoList {
  items: UnifiedTodoItem[]
  version: number
  lastUpdated: Date
}
```

### 3.2 数据转换工具
```typescript
// 从TodoStorage格式转换
export function fromTodoStorage(item: TodoStorage.TodoItem): UnifiedTodoItem {
  return {
    ...item,
    createdAt: item.createdAt || Date.now(),
    updatedAt: item.updatedAt || Date.now(),
    title: item.content, // 向后兼容
    completed: item.status === 'completed',
    inProgress: item.status === 'in_progress'
  }
}

// 从TodoService格式转换  
export function fromTodoService(item: TodoService.TodoItem): UnifiedTodoItem {
  return {
    id: item.id,
    content: item.title,
    status: item.completed ? 'completed' : item.inProgress ? 'in_progress' : 'pending',
    priority: 'medium', // 默认优先级
    title: item.title,
    completed: item.completed,
    inProgress: item.inProgress,
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}
```

## 4. 分层架构设计

### 4.1 应用层 (Application Layer)
**职责**：用户交互和命令处理

**文件路径**: `src/commands/todo/show.ts`
```typescript
import { Command } from '../../commands'
import { UnifiedTodoService } from '../../services/unifiedTodoService'
import { formatUnifiedTodoListForDisplay } from './utils'

export const showTodo = {
  type: 'local',
  name: 'todo极ow',
  description: 'Display current todo list content',
  isEnabled: true,
  is极den: true,
  async call(_, { context }) {
    const agentId = context?.agentId
    const todoService = UnifiedTodoService.getInstance()
    const todos = await todoService.getTodos(agentId)
    
    if (todos.length === 0) {
      return 'No todo items found.'
    }
    
    return formatUnifiedTodoListForDisplay(todos)
  },
  userFacingName() {
    return 'todo-show'
  },
} satisfies Command
```

**文件路径**: `src/commands/todo/utils.ts` (新增函数)
```typescript
import { UnifiedTodoItem } from '../../types/unifiedTodo'

export function formatUnifiedTodoListForDisplay(todos: UnifiedTodoItem[]): string {
  if (todos.length === 0) {
    return 'No todo items found.'
  }

  let output = `Todo List - Last Updated: ${new Date().toLocaleString()}\n\n`
  
  todos.forEach((item, index) => {
    let status = '⬜'
    if (item.status === 'completed') {
      status = '✅'
    } else if (item.status === 'in_progress') {
      status = '🔄'
    }
    
    output += `${index + 1}. ${status} ${item.content}\n`
    if (item.description) {
      output += `   Description: ${item.description}\n`
    }
    output += `   Priority: ${item.priority}\n`
    output += `   Created: ${new Date(item.createdAt).toLocaleString()}\n`
    if (item.status === 'completed') {
      output += `   Completed: ${new Date(item.updatedAt).toLocaleString()}\极`
    }
    output += '\n'
  })

  return output
}
```

### 4.2 服务层 (Service Layer)
**职责**：业务逻辑和协调
```typescript
export class UnifiedTodoService {
  private static instance: UnifiedTodoService
  private repository: TodoRepository
  
  static getInstance(): UnifiedTodoService {
    if (!UnifiedTodoService.instance) {
      const repository = new UnifiedTodoRepository()
      UnifiedTodoService.instance = new UnifiedTodoService(repository)
    }
    return UnifiedTodoService.instance
  }
  
  async getTodos(agentId?: string): Promise<UnifiedTodoItem[]> {
    return this.repository.getTodos(agentId)
  }
  
  async setTodos(todos: UnifiedTodoItem[], agentId?: string): Promise<void> {
    await this.repository.setTodos(todos, agentId)
    // 触发事件
    TodoEventBus.emit('todo:changed', { todos, agentId })
  }
}
```

### 4.3 仓储层 (Repository Layer)
**职责**：数据访问抽象

**文件路径**: `src/repository/todoRepository.ts` (接口定义)
```typescript
import { UnifiedTodoItem } from '../types/unifiedTodo'

export interface TodoRepository {
  getTodos(agentId?: string): Promise<UnifiedTodoItem[]>
  setTodos(todos: UnifiedTodoItem[], agent极?: string): Promise<void>
  addTodo(todo: Omit<UnifiedTodoItem, 'id' | 'createdAt' | 'updatedAt'>, agentId?: string): Promise<UnifiedTodoItem>
  updateTodo(id: string, updates: Partial<UnifiedTodoItem>, agentId?: string): Promise<UnifiedTodoItem | null>
  deleteTodo(id: string, agentId?: string): Promise<boolean>
  clearTodos(agentId?: string): Promise<void>
}
```

**文件路径**: `src/repository/unifiedTodoRepository.ts` (具体实现)
```typescript
import { TodoRepository } from './todoRepository'
import { UnifiedTodoItem } from '../types/unifiedTodo'
import { fromTodoStorage, fromTodoService, toTodoService } from '../utils/todoConverter'
import { getTodos, setTodos, readAgentData, writeAgentData, resolveAgentId } from '../utils/todoStorage'
import { TodoService } from '../services/todoService'

export class UnifiedTodoRepository implements TodoRepository {
  async getTodos(agentId?: string): Promise<UnifiedTodoItem[]> {
    const resolvedAgentId = resolveAgentId(agentId)
    
    if (agentId) {
      // 从Agent文件存储读取
      const agentData = readAgentData<any[]>(resolvedAgentId)
      return agentData ? agentData.map(fromTodoStorage) : []
    } else {
      // 从Session状态读取并合并两个数据源
      const storageTodos = getTodos() // 从todoStorage
      const serviceList = await TodoService.getInstance().getTodoList()
      
      return [
        ...storageTodos.map(fromTodoStorage),
        ...serviceList.items.map(fromTodoService)
      ]
    }
  }
  
  async setTodos(todos: UnifiedTodoItem[], agentId?: string): Promise<void> {
    const resolvedAgentId = resolveAgentId(agentId)
    
    if (agentId) {
      // 存储到Agent文件
      writeAgentData(resolvedAgentId, todos)
    } else {
      // 存储到Session状态（同时更新两个系统保持兼容）
      setTodos(todos.map(fromTodoStorage))
      
      // 同时更新TodoService保持向后兼容
      const todoService = TodoService.getInstance()
      await todoService.replaceTodoList(todos.map(toTodoService))
    }
  }
  
  // 其他CRUD方法实现...
}
```

### 4.4 存储层 (Storage Layer)
**职责**：具体存储实现
- Agent文件存储：`~/.kode/${sessionId}-agent-${agentId}.json`
- Session状态存储：sessionState['todos'] 和 sessionState['todoList']

## 5. 事件驱动架构

### 5.1 TodoEventBus设计
```typescript
export class TodoEventBus {
  private static instance: TodoEventBus
  private listeners: Map<string, Function[]> = new Map()
  
  static getInstance(): TodoEventBus {
    if (!TodoEventBus.instance) {
      TodoEventBus.instance = new TodoEventBus()
    }
    return TodoEventBus.instance
  }
  
  emit(event: string, data: any): void {
    const handlers = this.listeners.get(event) || []
    handlers.forEach(handler => handler(data))
  }
  
  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(handler)
  }
}

// 事件类型定义
export interface TodoEvents {
  'todo:created': { todo: UnifiedTodoItem; agentId?: string }
  'todo:updated': { todo: UnifiedTodoItem; changes: Partial<UnifiedTodoItem>; agentId?: string }
  'todo:deleted': { todoId: string; agentId?: string }
  'todo:changed': { todos: UnifiedTodoItem[]; agentId?: string }
}
```

### 5.2 事件使用示例

**文件路径**: `src/services/systemReminder.ts` (订阅事件)
```typescript
import { TodoEventBus } from '../events/todoEventBus'

// 在系统提醒服务初始化时订阅事件
export class SystemReminderService {
  constructor() {
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    const eventBus = TodoEventBus.getInstance()
    
    eventBus.on('todo:changed', (data) => {
      this.dispatchTodoEvent(data.agentId)
    })
    
    eventBus.on('todo:error', (data) => {
      this.logError(data.error, data.context, data.agentId)
    })
  }
}
```

**文件路径**: `src/services/fileFreshness.ts` (订阅事件)
```typescript
import { TodoEventBus } from '../events/todoEventBus'
import { startWatchingTodoFile } from './fileFreshness'

// 在文件监控服务初始化时订阅事件
export class FileFreshnessService {
  constructor() {
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    const eventBus = TodoEventBus.getInstance()
    
    eventBus.on('todo:created', (data) => {
      if (data.agentId) {
        startWatchingTodoFile(data.agentId)
      }
    })
  }
}
```

**文件路径**: `src/tools/TodoWriteTool/TodoWriteTool.tsx` (发布事件)
```typescript
import { TodoEventBus } from '../../events/todoEventBus'

async *call(input, context) {
  // ... 原有逻辑
  
  // 使用事件总线发布事件
  const eventBus = TodoEventBus.getInstance()
  eventBus.emit('todo:changed', {
    previousTodos,
    newTodos: todoItems,
    agentId: agentId || 'default'
  })
}
```

## 6. 实施路线图

### 6.1 第一阶段：基础架构搭建 (1周)
- [ ] 定义UnifiedTodoItem接口和数据转换工具
- [ ] 实现TodoRepository接口和UnifiedTodoRepository
- [ ] 创建UnifiedTodoService单例服务
- [ ] 实现TodoEventBus事件系统

### 6.2 第二阶段：命令系统改造 (1周)
- [ ] 修改 `/todo /show` 命令使用统一服务
- [ ] 修改 `/todo /update` 命令使用统一服务  
- [ ] 修改 `/todo /new` 命令使用统一服务
- [ ] 更新TodoWriteTool使用统一服务

### 6.3 第三阶段：数据迁移和同步 (3天)
- [ ] 实现数据迁移工具，合并两个存储系统的数据
- [ ] 添加数据同步机制，确保双向同步
- [ ] 实现数据验证和冲突解决策略

### 6.4 第四阶段：测试和优化 (4天)
- [ ] 编写单元测试和集成测试
- [ ] 性能测试和优化
- [ ] 错误处理和恢复机制
- [ ] 用户验收测试

## 7. 风险管理和回滚方案

### 7.1 主要风险
1. **数据丢失风险**：迁移过程中可能丢失数据
2. **性能风险**：新架构可能影响性能
3. **兼容性风险**：可能破坏现有功能

### 7.2 缓解措施
- **数据备份**：迁移前备份所有todo数据
- **分阶段部署**：逐步替换组件，而非一次性替换
- **功能开关**：使用功能开关控制新老系统切换
- **详细日志**：记录所有数据操作以便排查问题

### 7.3 回滚方案
- 保留旧代码至少一个版本周期
- 准备一键回滚脚本
- 监控关键指标，异常时自动回滚

## 8. 预期收益

### 8.1 功能改进
- ✅ **功能恢复**：`/todo /show` 能正确显示所有todo项
- ✅ **数据一致**：AI工具和命令行看到相同的todo状态
- ✅ **多Agent支持**：完善的Agent作用域管理

### 8.2 架构改进
- ✅ **架构清晰**：分层设计，职责明确
- ✅ **扩展性强**：易于添加新功能和存储后端
- ✅ **维护性好**：代码结构清晰，易于理解和修改

### 8.3 性能改进
- ✅ **性能优化**：统一的缓存策略
- ✅ **资源节约**：消除重复存储和计算
- ✅ **响应快速**：事件驱动，实时更新

## 9. 后续优化方向

### 9.1 短期优化
- 添加数据库存储支持（SQLite、PostgreSQL）
- 实现离线同步功能
- 添加高级查询和过滤功能
