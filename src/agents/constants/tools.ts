// Tool categories for sophisticated selection
export const TOOL_CATEGORIES = {
  read: ['Read', 'Glob', 'Grep', 'LS'],
  edit: ['Edit', 'MultiEdit', 'Write', 'NotebookEdit'],
  execution: ['Bash', 'BashOutput', 'KillBash'],
  web: ['WebFetch', 'WebSearch'],
  other: ['TodoWrite', 'ExitPlanMode', 'Task']
} as const