// Task工具正确参数格式测试
const taskToolCorrectInput = {
  description: "测试Task工具功能",
  prompt: "请验证Task工具是否能正常启动子代理处理任务"
};

// TodoWrite工具正确参数格式测试  
const todoWriteCorrectInput = {
  todos: [
    {
      content: "测试Task工具参数验证",
      status: "in_progress",
      priority: "high",
      id: "test-task-1"
    },
    {
      content: "测试TodoWrite工具参数验证",
      status: "pending", 
      priority: "medium",
      id: "test-todo-1"
    }
  ]
};

console.log("Task工具正确参数格式:", JSON.stringify(taskToolCorrectInput, null, 2));
console.log("\nTodoWrite工具正确参数格式:", JSON.stringify(todoWriteCorrectInput, null, 2));

// 验证zod schema
const { z } = require('zod');

// Task工具schema
const taskInputSchema = z.object({
  description: z.string().describe('A short (3-5 word) description of the task'),
  prompt: z.string().describe('The task for the agent to perform'),
  model_name: z.string().optional(),
  subagent_type: z.string().optional()
});

// TodoWrite工具schema
const FlexibleTodoItemSchema = z.object({
  content: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['high', 'medium', 'low']),
  id: z.string().min(1)
});

const todoInputSchema = z.object({
  todos: z.array(FlexibleTodoItemSchema)
});

// 测试验证
console.log("\nTask工具参数验证结果:");
try {
  const taskResult = taskInputSchema.parse(taskToolCorrectInput);
  console.log("✓ Task参数验证通过");
} catch (error) {
  console.log("✗ Task参数验证失败:", error.message);
}

console.log("\nTodoWrite工具参数验证结果:");
try {
  const todoResult = todoInputSchema.parse(todoWriteCorrectInput);
  console.log("✓ TodoWrite参数验证通过");
} catch (error) {
  console.log("✗ TodoWrite参数验证失败:", error.message);
}