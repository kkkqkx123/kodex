// 修复工具调用参数格式
// 从日志分析，AI生成的工具调用参数格式不正确

// 错误示例（从日志中看到的错误格式）
const taskToolWrongCall = "Task(description=\"测试Task工具功能\", prompt=\"请验证Task工具是否能正常启动子代理处理任务\")";
const todoWriteWrongCall = "TodoWrite(todos=[{content: \"测试任务\", status: \"pending\", priority: \"high\", id: \"test-1\"}])";

// 正确示例（应该使用的JSON格式）
const taskToolCorrectCall = {
  name: "Task",
  input: {
    description: "测试Task工具功能",
    prompt: "请验证Task工具是否能正常启动子代理处理任务",
    subagent_type: "general-purpose"
  }
};

const todoWriteCorrectCall = {
  name: "TodoWrite", 
  input: {
    todos: [
      {
        content: "测试Task工具参数验证",
        status: "in_progress",
        priority: "high", 
        id: "test-task-1"
      }
    ]
  }
};

console.log("=== 问题分析 ===");
console.log("从日志可以看到工具调用出现了InputValidationError:");
console.log("1. Task工具: description和prompt字段收到undefined");
console.log("2. TodoWrite工具: todos字段收到undefined");
console.log("");

console.log("=== 错误调用格式 ===");
console.log("AI生成的错误格式:");
console.log("Task工具:", taskToolWrongCall);
console.log("TodoWrite工具:", todoWriteWrongCall);
console.log("");

console.log("=== 正确调用格式 ===");
console.log("应该使用的JSON格式:");
console.log("Task工具:", JSON.stringify(taskToolCorrectCall, null, 2));
console.log("TodoWrite工具:", JSON.stringify(todoWriteCorrectCall, null, 2));
console.log("");

console.log("=== 修复建议 ===");
console.log("1. 确保工具调用使用完整的JSON对象格式");
console.log("2. Task工具必须包含description和prompt字符串字段");
console.log("3. TodoWrite工具必须包含todos数组字段");
console.log("4. 所有字段值不能为undefined或null");
console.log("5. 遵循zod schema定义的类型要求");

// 验证schema
const { z } = require('zod');

const taskSchema = z.object({
  description: z.string(),
  prompt: z.string(),
  model_name: z.string().optional(),
  subagent_type: z.string().optional()
});

const todoSchema = z.object({
  todos: z.array(z.object({
    content: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed']),
    priority: z.enum(['high', 'medium', 'low']),
    id: z.string()
  }))
});

console.log("");
console.log("=== Schema验证 ===");

try {
  taskSchema.parse(taskToolCorrectCall.input);
  console.log("✓ Task工具参数格式正确");
} catch (error) {
  console.log("✗ Task工具参数格式错误:", error.message);
}

try {
  todoSchema.parse(todoWriteCorrectCall.input);
  console.log("✓ TodoWrite工具参数格式正确");
} catch (error) {
  console.log("✗ TodoWrite工具参数格式错误:", error.message);
}