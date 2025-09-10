export async function testGPT5Connection(config: {
  model: string
  apiKey: string
  baseURL: string
  maxTokens: number
  provider: string
}): Promise<{
  success: boolean
  message: string
  endpoint?: string
  details?: string
}> {
  // 🔧 Enhanced GPT-5 Responses API test payload
  const testPayload: any = {
    model: config.model,
    input: [
      {
        role: 'user',
        content:
          'Please respond with exactly "YES" (in capital letters) to confirm this connection is working.',
      },
    ],
    max_completion_tokens: Math.max(config.maxTokens || 8192, 8192),
    temperature: 1, // GPT-5 only supports temperature=1
    // 🚀 Add reasoning configuration for better GPT-5 performance
    reasoning: {
      effort: 'low', // Fast response for connection test
    },
  }

  console.log(`🔧 Testing GPT-5 Responses API for model: ${config.model}`)
  console.log(`🔧 Test URL: ${config.baseURL}`)
  console.log(`🔧 Test payload:`, JSON.stringify(testPayload, null, 2))

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  }

  try {
    const response = await fetch(config.baseURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(
        '[DEBUG] Responses API connection test response:',
        JSON.stringify(data, null, 2),
      )

      // Extract content from Responses API format
      let responseContent = ''
      
      if (data.output_text) {
        responseContent = data.output_text
      } else if (data.output) {
        responseContent = typeof data.output === 'string' ? data.output : data.output.text || ''
      }

      console.log('[DEBUG] Extracted response content:', responseContent)

      // Check if response contains "YES" (case insensitive)
      const containsYes = responseContent.toLowerCase().includes('yes')

      if (containsYes) {
        return {
          success: true,
          message: `✅ Connection test passed with GPT-5 Responses API`,
          endpoint: config.baseURL,
          details: `GPT-5 responded correctly via Responses API: "${responseContent.trim()}"`,
        }
      } else {
        return {
          success: false,
          message: `⚠️ GPT-5 Responses API connected but model response unexpected`,
          endpoint: config.baseURL,
          details: `Expected "YES" but got: "${responseContent.trim() || '(empty response)'}"`,
        }
      }
    } else {
      // 🔧 Enhanced error handling with detailed debugging
      const errorData = await response.json().catch(() => null)
      const errorMessage =
        errorData?.error?.message || errorData?.message || response.statusText
      
      console.log(`🚨 GPT-5 Responses API Error (${response.status}):`, errorData)
      
      // 🔧 Provide specific guidance for common GPT-5 errors
      let details = `Responses API Error: ${errorMessage}`
      if (response.status === 400 && errorMessage.includes('max_tokens')) {
        details += '\n🔧 Note: This appears to be a parameter compatibility issue. The fallback to Chat Completions should handle this.'
      } else if (response.status === 404) {
        details += '\n🔧 Note: Responses API endpoint may not be available for this model or provider.'
      } else if (response.status === 401) {
        details += '\n🔧 Note: API key authentication failed.'
      }
      
      return {
        success: false,
        message: `❌ GPT-5 Responses API failed (${response.status})`,
        endpoint: config.baseURL,
        details: details,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ GPT-5 Responses API connection failed`,
      endpoint: config.baseURL,
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

export function validateGPT5Config(config: {
  model: string
  apiKey: string
  baseURL: string
  maxTokens: number
  provider: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config.model) {
    errors.push('Model name is required')
  }
  
  if (!config.apiKey) {
    errors.push('API key is required')
  }
  
  if (!config.baseURL) {
    errors.push('Base URL is required')
  }
  
  if (config.maxTokens <= 0) {
    errors.push('Max tokens must be greater than 0')
  }
  
  // Additional GPT-5 specific validations could be added here
  
  return {
    valid: errors.length === 0,
    errors
  }
}