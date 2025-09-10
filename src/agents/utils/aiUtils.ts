import { randomUUID } from 'crypto';
import { queryModel } from '../../services/claude';

// AI Generation response type
type GeneratedAgent = {
  identifier: string;
  whenToUse: string;
  systemPrompt: string;
};

// AI generation function (use main pointer model)
export async function generateAgentWithClaude(prompt: string): Promise<GeneratedAgent> {
  // Import Claude service dynamically to avoid circular dependencies
  const { queryModel } = await import('../../services/claude');
  
  const systemPrompt = `You are an expert at creating AI agent configurations. Based on the user's description, generate a specialized agent configuration.

Return your response as a JSON object with exactly these fields:
- identifier: A short, kebab-case identifier for the agent (e.g., "code-reviewer", "security-auditor")
- whenToUse: A clear description of when this agent should be used (50-200 words)
- systemPrompt: A comprehensive system prompt that defines the agent's role, capabilities, and behavior (200-500 words)

Make the agent highly specialized and effective for the described use case.`;

  try {
    const messages = [
      {
        type: 'user',
        uuid: randomUUID(),
        message: { role: 'user', content: prompt },
      },
    ] as any;
    const response = await queryModel('main', messages, [systemPrompt]);

    // Get the text content from the response - handle both string and object responses
    let responseText = '';
    if (typeof response.message?.content === 'string') {
      responseText = response.message.content;
    } else if (Array.isArray(response.message?.content)) {
      const textContent = response.message.content.find((c: any) => c.type === 'text');
      responseText = (textContent as any)?.text || '';
    } else if ((response.message?.content?.[0] as any)?.text) {
      responseText = (response.message.content[0] as any).text;
    }
    
    if (!responseText) {
      throw new Error('No text content in Claude response');
    }
    
    // 安全限制
    const MAX_JSON_SIZE = 100_000; // 100KB
    const MAX_FIELD_LENGTH = 10_000;
    
    if (responseText.length > MAX_JSON_SIZE) {
      throw new Error('Response too large');
    }
    
    // 安全的JSON提取和解析
    let parsed: any;
    try {
      // 首先尝试直接解析整个响应
      parsed = JSON.parse(responseText.trim());
    } catch {
      // 如果失败，提取第一个JSON对象，限制搜索范围
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      
      if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        throw new Error('No valid JSON found in Claude response');
      }
      
      const jsonStr = responseText.substring(startIdx, endIdx + 1);
      if (jsonStr.length > MAX_JSON_SIZE) {
        throw new Error('JSON content too large');
      }
      
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }
    
    // 深度验证和安全清理
    const identifier = String(parsed.identifier || '').slice(0, 100).trim();
    const whenToUse = String(parsed.whenToUse || '').slice(0, MAX_FIELD_LENGTH).trim();
    const agentSystemPrompt = String(parsed.systemPrompt || '').slice(0, MAX_FIELD_LENGTH).trim();
    
    // 验证必填字段
    if (!identifier || !whenToUse || !agentSystemPrompt) {
      throw new Error('Invalid response structure: missing required fields (identifier, whenToUse, systemPrompt)');
    }
    
    // 清理危险字符（控制字符和非打印字符）
    const sanitize = (str: string) => str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // 验证identifier格式（只允许字母、数字、连字符）
    const cleanIdentifier = sanitize(identifier);
    if (!/^[a-zA-Z0-9-]+$/.test(cleanIdentifier)) {
      throw new Error('Invalid identifier format: only letters, numbers, and hyphens allowed');
    }
    
    return {
      identifier: cleanIdentifier,
      whenToUse: sanitize(whenToUse),
      systemPrompt: sanitize(agentSystemPrompt)
    };
  } catch (error) {
    console.error('AI generation failed:', error);
    // Fallback to a reasonable default based on the prompt
    const fallbackId = prompt.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
    
    return {
      identifier: fallbackId || 'custom-agent',
      whenToUse: `Use this agent when you need assistance with: ${prompt}`,
      systemPrompt: `You are a specialized assistant focused on helping with ${prompt}. Provide expert-level assistance in this domain.`
    };
  }
}