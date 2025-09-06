import { AgentConfig } from '../types';

export function validateAgentType(agentType: string, existingAgents: AgentConfig[] = []) { 
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!agentType) {
    errors.push("Agent type is required");
    return { isValid: false, errors, warnings };
  }
  
  if (!/^[a-zA-Z]/.test(agentType)) {
    errors.push("Agent type must start with a letter");
  }
  
  if (!/^[a-zA-Z0-9-]+$/.test(agentType)) {
    errors.push("Agent type can only contain letters, numbers, and hyphens");
  }
  
  if (agentType.length < 3) {
    errors.push("Agent type must be at least 3 characters long");
  }
  
  if (agentType.length > 50) {
    errors.push("Agent type must be less than 50 characters");
  }
  
  // Check for reserved names
  const reserved = ['help', 'exit', 'quit', 'agents', 'task'];
  if (reserved.includes(agentType.toLowerCase())) {
    errors.push("This name is reserved");
  }
  
  // Check for duplicates
  const duplicate = existingAgents.find(a => a.agentType === agentType);
  if (duplicate) {
    errors.push(`An agent with this name already exists in ${duplicate.location}`);
  }
  
  // Warnings
  if (agentType.includes('--')) {
    warnings.push("Consider avoiding consecutive hyphens");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateAgentConfig(config: Partial<CreateState>, existingAgents: AgentConfig[] = []): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate agent type
  if (config.agentType) {
    const typeValidation = validateAgentType(config.agentType, existingAgents);
    errors.push(...typeValidation.errors);
    warnings.push(...typeValidation.warnings);
  }
  
  // Validate description
  if (!config.whenToUse) {
    errors.push("Description is required");
  } else if (config.whenToUse.length < 10) {
    warnings.push("Description should be more descriptive (at least 10 characters)");
  }
  
  // Validate system prompt
  if (!config.systemPrompt) {
    errors.push("System prompt is required");
  } else if (config.systemPrompt.length < 20) {
    warnings.push("System prompt might be too short for effective agent behavior");
  }
  
  // Validate tools
  if (!config.selectedTools || config.selectedTools.length === 0) {
    warnings.push("No tools selected - agent will have limited capabilities");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// We need to define CreateState interface here to avoid circular dependencies
interface CreateState {
  location: string | null;
  agentType: string;
  method: 'generate' | 'manual' | null;
  generationPrompt: string;
  whenToUse: string;
  selectedTools: string[];
  selectedModel: string | null;
  selectedColor: string | null;
  systemPrompt: string;
  isGenerating: boolean;
  wasGenerated: boolean;
  isAIGenerated: boolean;
  error: string | null;
  warnings: string[];
  agentTypeCursor: number;
  whenToUseCursor: number;
  promptCursor: number;
  generationPromptCursor: number;
}