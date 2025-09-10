import { writeFileSync, unlinkSync, mkdirSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getCwd } from '../../utils/state';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';

// Core constants aligned with Claude Code architecture
const AGENT_LOCATIONS = {
  USER: "user",
  PROJECT: "project", 
  BUILT_IN: "built-in",
  ALL: "all"
} as const;

const FOLDER_CONFIG = {
  FOLDER_NAME: ".kode",
  AGENTS_DIR: "agents"
} as const;

type AgentLocation = typeof AGENT_LOCATIONS[keyof typeof AGENT_LOCATIONS];

// File system operations with Claude Code alignment
export function getAgentDirectory(location: AgentLocation): string {
  if (location === AGENT_LOCATIONS.BUILT_IN || location === AGENT_LOCATIONS.ALL) {
    throw new Error(`Cannot get directory path for ${location} agents`);
  }
  
  if (location === AGENT_LOCATIONS.USER) {
    return join(homedir(), FOLDER_CONFIG.FOLDER_NAME, FOLDER_CONFIG.AGENTS_DIR);
  } else {
    return join(getCwd(), FOLDER_CONFIG.FOLDER_NAME, FOLDER_CONFIG.AGENTS_DIR);
  }
}

export function getAgentFilePath(agent: any): string {
  if (agent.location === 'built-in') {
    throw new Error('Cannot get file path for built-in agents');
  }
  const dir = getAgentDirectory(agent.location as AgentLocation);
  return join(dir, `${agent.agentType}.md`);
}

export function ensureDirectoryExists(location: AgentLocation): string {
  const dir = getAgentDirectory(location);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Generate agent file content
export function generateAgentFileContent(
  agentType: string,
  description: string,
  tools: string[] | '*',
  systemPrompt: string,
  model?: string,
  color?: string
): string {
  // Use YAML multi-line string for description to avoid escaping issues
  const descriptionLines = description.split('\n');
  const formattedDescription = descriptionLines.length > 1 
    ? `|\n  ${descriptionLines.join('\n  ')}`
    : JSON.stringify(description);
  
  const lines = [
    '---',
    `name: ${agentType}`,
    `description: ${formattedDescription}`
  ];
  
  if (tools) {
    if (tools === '*') {
      lines.push(`tools: "*"`);
    } else if (Array.isArray(tools) && tools.length > 0) {
      lines.push(`tools: [${tools.map(t => `"${t}"`).join(', ')}]`);
    }
  }
  
  if (model) {
    lines.push(`model: ${model}`);
  }
  
  if (color) {
    lines.push(`color: ${color}`);
  }
  
  lines.push('---', '', systemPrompt);
  return lines.join('\n');
}

// Save agent to file
export async function saveAgent(
  location: AgentLocation,
  agentType: string,
  description: string,
  tools: string[],
  systemPrompt: string,
  model?: string,
  color?: string,
  throwIfExists: boolean = true
): Promise<void> {
  if (location === AGENT_LOCATIONS.BUILT_IN) {
    throw new Error('Cannot save built-in agents');
  }
  
  ensureDirectoryExists(location);
  
  const filePath = join(getAgentDirectory(location), `${agentType}.md`);
  const tempFile = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
  
  // Ensure tools is properly typed for file saving
  const toolsForFile: string[] | '*' = Array.isArray(tools) && tools.length === 1 && tools[0] === '*' ? '*' : tools;
  const content = generateAgentFileContent(agentType, description, toolsForFile, systemPrompt, model, color);
  
  try {
    // 先写入临时文件，使用 'wx' 确保不覆盖现有文件
    writeFileSync(tempFile, content, { encoding: 'utf-8', flag: 'wx' });
    
    // 检查目标文件是否存在（原子性检查）
    if (throwIfExists && existsSync(filePath)) {
      // 清理临时文件
      try { unlinkSync(tempFile) } catch {}
      throw new Error(`Agent file already exists: ${filePath}`);
    }
    
    // 原子性重命名（在大多数文件系统上，rename是原子操作）
    renameSync(tempFile, filePath);
    
  } catch (error) {
    // 确保清理临时文件
    try { 
      if (existsSync(tempFile)) {
        unlinkSync(tempFile); 
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
    throw error;
  }
}

// Delete agent file
export async function deleteAgent(agent: any): Promise<void> {
  if (agent.location === 'built-in') {
    throw new Error('Cannot delete built-in agents');
  }
  
  const filePath = getAgentFilePath(agent);
  unlinkSync(filePath);
}

// Update existing agent
export async function updateAgent(
  agent: any,
  description: string,
  tools: string[] | '*',
  systemPrompt: string,
  color?: string,
  model?: string
): Promise<void> {
  if (agent.location === 'built-in') {
    throw new Error('Cannot update built-in agents');
  }
  
  const toolsForFile = tools.length === 1 && tools[0] === '*' ? '*' : tools;
  const content = generateAgentFileContent(agent.agentType, description, toolsForFile, systemPrompt, model, color);
  const filePath = getAgentFilePath(agent);
  
  writeFileSync(filePath, content, { encoding: 'utf-8', flag: 'w' });
}

// Open file in system editor - 安全版本，防止命令注入
export async function openInEditor(filePath: string): Promise<void> {
  // 安全验证：确保路径在允许的目录内
  const resolvedPath = path.resolve(filePath);
  const projectDir = process.cwd();
  const homeDir = os.homedir();
  
  if (!resolvedPath.startsWith(projectDir) && !resolvedPath.startsWith(homeDir)) {
    throw new Error('Access denied: File path outside allowed directories');
  }
  
  // 验证文件扩展名
  if (!resolvedPath.endsWith('.md')) {
    throw new Error('Invalid file type: Only .md files are allowed');
  }
  
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    let command: string;
    let args: string[];
    
    // 使用spawn而不是exec，避免shell注入
    switch (platform) {
      case 'darwin': // macOS
        command = 'open';
        args = [resolvedPath];
        break;
      case 'win32': // Windows
        command = 'cmd';
        args = ['/c', 'start', '', resolvedPath];
        break;
      default: // Linux and others
        command = 'xdg-open';
        args = [resolvedPath];
        break;
    }
    
    // 使用spawn替代exec，避免shell解释
    const child = spawn(command, args, { 
      detached: true, 
      stdio: 'ignore',
      // 确保没有shell解释
      shell: false 
    });
    
    child.unref(); // 允许父进程退出
    
    child.on('error', (error) => {
      reject(new Error(`Failed to open editor: ${error.message}`));
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
  });
}