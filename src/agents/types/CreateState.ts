import { AgentLocation } from './AgentConfig';

export interface CreateState {
  location: AgentLocation | null;
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