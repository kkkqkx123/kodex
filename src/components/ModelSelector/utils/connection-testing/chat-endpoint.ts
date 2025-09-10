export async function testChatEndpoint(
  baseURL: string,
  endpointPath: string,
  endpointName: string,
  selectedModel: string,
  maxTokens: string,
  apiKey: string,
): Promise<{
  success: boolean
  message: string
  endpoint?: string
  details?: string
}> {
  const testURL = `${baseURL.replace(/\/+$/, '')}${endpointPath}`

  // Create a test message that expects a specific response
  const testPayload: any = {
    model: selectedModel,
    messages: [
      {
        role: 'user',
        content:
          'Please respond with exactly "YES" (in capital letters) to confirm this connection is working.',
      },
    ],
    max_tokens: Math.max(parseInt(maxTokens) || 8192, 8192), // Ensure minimum 8192 tokens for connection test
    temperature: 0,
    stream: false,
  }

  // GPT-5 parameter compatibility fix
  if (selectedModel && selectedModel.toLowerCase().includes('gpt-5')) {
    console.log(`Applying GPT-5 parameter fix for model: ${selectedModel}`)
    
    // GPT-5 requires max_completion_tokens instead of max_tokens
    if (testPayload.max_tokens) {
      testPayload.max_completion_tokens = testPayload.max_tokens
      delete testPayload.max_tokens
      console.log(`Transformed max_tokens → max_completion_tokens: ${testPayload.max_completion_tokens}`)
    }
    
    // GPT-5 temperature handling - ensure it's 1 or undefined
    if (testPayload.temperature !== undefined && testPayload.temperature !== 1) {
      console.log(`Adjusting temperature from ${testPayload.temperature} to 1 for GPT-5`)
      testPayload.temperature = 1
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add authorization headers
  // Note: This would need to be adapted based on the specific provider
  headers['Authorization'] = `Bearer ${apiKey}`

  try {
    const response = await fetch(testURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(
        '[DEBUG] Connection test response:',
        JSON.stringify(data, null, 2),
      )

      // Check if we got a valid response with content
      let responseContent = ''

      if (data.choices && data.choices.length > 0) {
        responseContent = data.choices[0]?.message?.content || ''
      } else if (data.reply) {
        // Handle MiniMax format
        responseContent = data.reply
      } else if (data.output) {
        // Handle other formats
        responseContent = data.output?.text || data.output || ''
      }

      console.log('[DEBUG] Extracted response content:', responseContent)

      // Check if response contains "YES" (case insensitive)
      const containsYes = responseContent.toLowerCase().includes('yes')

      if (containsYes) {
        return {
          success: true,
          message: `✅ Connection test passed with ${endpointName}`,
          endpoint: endpointPath,
          details: `Model responded correctly: "${responseContent.trim()}"`,
        }
      } else {
        return {
          success: false,
          message: `⚠️ ${endpointName} connected but model response unexpected`,
          endpoint: endpointPath,
          details: `Expected "YES" but got: "${responseContent.trim() || '(empty response)'}"`,
        }
      }
    } else {
      const errorData = await response.json().catch(() => null)
      const errorMessage =
        errorData?.error?.message || errorData?.message || response.statusText

      return {
        success: false,
        message: `❌ ${endpointName} failed (${response.status})`,
        endpoint: endpointPath,
        details: `Error: ${errorMessage}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ ${endpointName} connection failed`,
      endpoint: endpointPath,
      details: error instanceof Error ? error.message : String(error),
    }
  }
}