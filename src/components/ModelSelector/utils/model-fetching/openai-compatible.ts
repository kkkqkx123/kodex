export async function fetchCustomModels(baseURL: string, apiKey: string) {
  // This is a placeholder implementation
  // In a real implementation, this would use the OpenAI client or fetch API
  // to retrieve models from an OpenAI-compatible endpoint
  
  // For now, we'll throw an error to indicate this needs to be implemented
  throw new Error('fetchCustomModels not implemented in this utility')
}

export async function fetchKimiModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the Kimi-specific base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchKimiModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch Kimi models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Add helpful suggestions based on error type
    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Get your API key from https://platform.moonshot.cn/console/api-keys'
    } else if (errorMessage.includes('permission')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure your API key has access to the Kimi API'
    } else if (errorMessage.includes('connection')) {
      errorMessage +=
        '\n\n💡 Tip: Check your internet connection and try again'
    }

    throw new Error(errorMessage)
  }
}

export async function fetchDeepSeekModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the DeepSeek-specific base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchDeepSeekModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch DeepSeek models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Add helpful suggestions based on error type
    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Get your API key from https://platform.deepseek.com/api_keys'
    } else if (errorMessage.includes('permission')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure your API key has access to the DeepSeek API'
    } else if (errorMessage.includes('connection')) {
      errorMessage +=
        '\n\n💡 Tip: Check your internet connection and try again'
    }

    throw new Error(errorMessage)
  }
}

export async function fetchSiliconFlowModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the SiliconFlow-specific base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchSiliconFlowModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch SiliconFlow models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Add helpful suggestions based on error type
    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Get your API key from https://cloud.siliconflow.cn/i/oJWsm6io'
    } else if (errorMessage.includes('permission')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure your API key has access to the SiliconFlow API'
    } else if (errorMessage.includes('connection')) {
      errorMessage +=
        '\n\n💡 Tip: Check your internet connection and try again'
    }

    throw new Error(errorMessage)
  }
}

export async function fetchQwenModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the Qwen-specific base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchQwenModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch Qwen models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Get your API key from https://bailian.console.aliyun.com/?tab=model#/api-key'
    } else if (errorMessage.includes('permission')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure your API key has access to the Qwen API'
    } else if (errorMessage.includes('connection')) {
      errorMessage +=
        '\n\n💡 Tip: Check your internet connection and try again'
    }

    throw new Error(errorMessage)
  }
}

export async function fetchGLMModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the GLM-specific base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchGLMModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch GLM models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Get your API key from https://open.bigmodel.cn (API Keys section)'
    } else if (errorMessage.includes('permission')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure your API key has access to the GLM API'
    } else if (errorMessage.includes('connection')) {
      errorMessage +=
        '\n\n💡 Tip: Check your internet connection and try again'
    }

    throw new Error(errorMessage)
  }
}

export async function fetchMinimaxModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the MiniMax-specific base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchMinimaxModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch MiniMax models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Get your API key from https://www.minimax.io/platform/user-center/basic-information'
    } else if (errorMessage.includes('permission')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure your API key has access to the MiniMax API'
    } else if (errorMessage.includes('connection')) {
      errorMessage +=
        '\n\n💡 Tip: Check your internet connection and try again'
    }

    throw new Error(errorMessage)
  }
}

export async function fetchBaiduQianfanModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the Baidu Qianfan-specific base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchBaiduQianfanModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch Baidu Qianfan models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Get your API key from https://console.bce.baidu.com/iam/#/iam/accesslist'
    } else if (errorMessage.includes('permission')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure your API key has access to the Baidu Qianfan API'
    } else if (errorMessage.includes('connection')) {
      errorMessage +=
        '\n\n💡 Tip: Check your internet connection and try again'
    }

    throw new Error(errorMessage)
  }
}

export async function fetchCustomOpenAIModels(baseURL: string, apiKey: string) {
  try {
    // This would call fetchCustomModels with the custom base URL
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('fetchCustomOpenAIModels not implemented in this utility')
  } catch (error) {
    let errorMessage = 'Failed to fetch custom API models'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Add helpful suggestions based on error type
    if (errorMessage.includes('API key')) {
      errorMessage +=
        '\n\n💡 Tip: Check that your API key is valid for this endpoint'
    } else if (errorMessage.includes('endpoint not found')) {
      errorMessage +=
        '\n\n💡 Tip: Make sure the base URL ends with /v1 and supports OpenAI-compatible API'
    } else if (errorMessage.includes('connect')) {
      errorMessage +=
        '\n\n💡 Tip: Verify the base URL is correct and accessible'
    } else if (errorMessage.includes('response format')) {
      errorMessage +=
        '\n\n💡 Tip: This API may not be fully OpenAI-compatible'
    }

    throw new Error(errorMessage)
  }
}