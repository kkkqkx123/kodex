export const DESCRIPTION =
  'Creates and manages todo items for task tracking and progress management. Use this tool to create, update, and manage todo lists with proper formatting.'

export const PROMPT = `Manage todo items for task tracking.

## Required Input Format

Must provide todos array in JSON format:

\`\`\`json
{
  "todos": [
    {
      "content": "string (task description)",
      "status": "todo|in_progress|done|cancelled",
      "priority": "low|medium|high|critical",
      "id": "string (unique identifier)"
    }
  ]
}
\`\`\`

### Field Requirements:
- **content**: Task description (string, required)
- **status**: Current state (required: todo, in_progress, done, cancelled)
- **priority**: Priority level (required: low, medium, high, critical)
- **id**: Unique identifier (string, required)

### Important Rules:
1. Always provide complete todos array
2. Each todo must have unique id
3. Only one task can be in_progress at a time
4. Use valid status and priority values only

## Task States and Management

1. **Task States**: Use these states to track progress:
   - pending: Task not yet started
   - in_progress: Currently working on (limit to ONE task at a time)
   - completed: Task finished successfully

2. **Task Management**:
   - Update task status in real-time as you work
   - Mark tasks complete IMMEDIATELY after finishing (don't batch completions)
   - Only have ONE task in_progress at any time
   - Complete current tasks before starting new ones
   - Remove tasks that are no longer relevant from the list entirely

3. **Task Completion Requirements**:
   - ONLY mark a task as completed when you have FULLY accomplished it
   - If you encounter errors, blockers, or cannot finish, keep the task as in_progress
   - When blocked, create a new task describing what needs to be resolved
   - Never mark a task as completed if:
     - Tests are failing
     - Implementation is partial
     - You encountered unresolved errors
     - You couldn't find necessary files or dependencies

4. **Task Breakdown**:
   - Create specific, actionable items
   - Break complex tasks into smaller, manageable steps
   - Use clear, descriptive task names

## Tool Capabilities

- **Create new todos**: Add tasks with content, priority, and status
- **Update existing todos**: Modify any aspect of a todo (status, priority, content)
- **Delete todos**: Remove completed or irrelevant tasks by omitting them from the list
- **Batch operations**: Update multiple todos in a single operation
- **Clear all todos**: Reset the entire todo list by providing an empty array

## Usage Guidelines

Use for:
- Complex multi-step tasks
- Tracking progress across multiple operations
- Managing task priorities and status

Avoid for:
- Single straightforward tasks
- Trivial operations
- Conversational exchanges

## Example Usage

### Development Task Tracking
\`\`\`json
{
  "todos": [
    {
      "content": "Implement user authentication API endpoints",
      "status": "in_progress",
      "priority": "critical",
      "id": "auth_api_001"
    },
    {
      "content": "Write unit tests for authentication service",
      "status": "todo",
      "priority": "high",
      "id": "auth_test_001"
    },
    {
      "content": "Create API documentation",
      "status": "todo",
      "priority": "medium",
      "id": "auth_docs_001"
    }
  ]
}
\`\`\`

### Code Review Tasks
\`\`\`json
{
  "todos": [
    {
      "content": "Review authentication service for security vulnerabilities",
      "status": "in_progress",
      "priority": "high",
      "id": "review_security_001"
    },
    {
      "content": "Check API response formats and error handling",
      "status": "todo",
      "priority": "medium",
      "id": "review_api_001"
    }
  ]
}
\`\`\``
