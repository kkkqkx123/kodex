export interface AgentConfig {
  agentType: string;
  whenToUse: string;
  tools: string[] | '*';
  systemPrompt: string;
  location: 'built-in' | 'user' | 'project';
  color?: string;
  model_name?: string;
}

export const AGENT_LOCATIONS = {
  USER: "user",
  PROJECT: "project", 
  BUILT_IN: "built-in",
  ALL: "all"
} as const;

export type AgentLocation = typeof AGENT_LOCATIONS[keyof typeof AGENT_LOCATIONS];