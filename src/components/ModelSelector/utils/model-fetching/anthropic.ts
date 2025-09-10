export async function fetchAnthropicModels(baseURL: string, apiKey: string) {
  try {
    const response = await fetch(`${baseURL}/v1/models`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'Invalid API key. Please check your API key and try again.',
        )
      } else if (response.status === 403) {
        throw new Error('API key does not have permission to access models.')
      } else if (response.status === 404) {
        throw new Error(
          'API endpoint not found. This provider may not support model listing.',
        )
      } else if (response.status === 429) {
        throw new Error(
          'Too many requests. Please wait a moment and try again.',
        )
      } else if (response.status >= 500) {
        throw new Error(
          'API service is temporarily unavailable. Please try again later.',
        )
      } else {
        throw new Error(`Unable to connect to API (${response.status}).`)
      }
    }

    const data = await response.json()

    // Handle different response formats
    let models = []
    if (data && data.data && Array.isArray(data.data)) {
      models = data.data
    } else if (Array.isArray(data)) {
      models = data
    } else if (data && data.models && Array.isArray(data.models)) {
      models = data.models
    } else {
      throw new Error('API returned unexpected response format.')
    }

    return models
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('API key') ||
        error.message.includes('API endpoint') ||
        error.message.includes('API service') ||
        error.message.includes('response format'))
    ) {
      throw error
    }

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to the API. Please check the base URL and your internet connection.',
      )
    }

    throw new Error(
      'Failed to fetch models from API. Please check your configuration and try again.',
    )
  }
}

// 通用的Anthropic兼容模型获取函数，实现三层降级策略
export async function fetchAnthropicCompatibleModelsWithFallback(
  baseURL: string,
  provider: string,
  apiKey: string,
  apiKeyUrl: string,
) {
  let lastError: Error | null = null

  // 第一层：尝试使用 Anthropic 风格的 API
  try {
    const models = await fetchAnthropicModels(baseURL, apiKey)
    return models.map((model: any) => ({
      model: model.modelName || model.id || model.name || model.model || 'unknown',
      provider: provider,
      max_tokens: model.max_tokens || 8192,
      supports_vision: model.supports_vision || true,
      supports_function_calling: model.supports_function_calling || true,
      supports_reasoning_effort: false,
    }))
  } catch (error) {
    lastError = error as Error
    console.log(
      `Anthropic API failed for ${provider}, trying OpenAI format:`,
      error,
    )
  }

  // 第二层：尝试使用 OpenAI 风格的 API
  try {
    // Note: This would require importing fetchCustomModels from openai-compatible utility
    // For now, we'll throw an error to simulate the fallback
    throw new Error('OpenAI API not implemented in this utility')
  } catch (error) {
    lastError = error as Error
    console.log(
      `OpenAI API failed for ${provider}, falling back to manual input:`,
      error,
    )
  }

  // 第三层：抛出错误，触发手动输入模式
  let errorMessage = `Failed to fetch ${provider} models using both Anthropic and OpenAI API formats`

  if (lastError) {
    errorMessage = lastError.message
  }

  // 添加有用的建议
  if (errorMessage.includes('API key')) {
    errorMessage += `\n\n💡 Tip: Get your API key from ${apiKeyUrl}`
  } else if (errorMessage.includes('permission')) {
    errorMessage += `\n\n💡 Tip: Make sure your API key has access to the ${provider} API`
  } else if (errorMessage.includes('connection')) {
    errorMessage += '\n\n💡 Tip: Check your internet connection and try again'
  }

  throw new Error(errorMessage)
}