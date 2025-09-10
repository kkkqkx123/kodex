import OpenAI from 'openai'
import { fetchAnthropicModels } from './anthropic'
import { fetchCustomModels } from './openai-compatible'
import { fetchGeminiModels } from './gemini'
import { fetchOllamaModels } from './ollama'

export async function fetchModelsForProvider(
  selectedProvider: string,
  apiKey: string,
  providerBaseUrl: string,
  customBaseUrl: string,
  resourceName: string,
  ollamaBaseUrl: string,
) {
  // For Anthropic provider (including official and community proxies via sub-menu), use the same logic
  if (selectedProvider === 'anthropic') {
    // This would call the unified fetchAnthropicCompatibleProviderModels function
    throw new Error('Anthropic provider handling not implemented in this utility')
  }

  // For custom OpenAI-compatible APIs, use the fetchCustomOpenAIModels function
  if (selectedProvider === 'custom-openai') {
    const customModels = await fetchCustomModels(customBaseUrl, apiKey)
    return customModels
 }

  // For Gemini, use the separate fetchGeminiModels function
  if (selectedProvider === 'gemini') {
    const geminiModels = await fetchGeminiModels(apiKey)
    return geminiModels
  }

  // For Kimi, use the fetchKimiModels function
  if (selectedProvider === 'kimi') {
    // This would call fetchKimiModels
    throw new Error('Kimi provider handling not implemented in this utility')
  }

  // For DeepSeek, use the fetchDeepSeekModels function
  if (selectedProvider === 'deepseek') {
    // This would call fetchDeepSeekModels
    throw new Error('DeepSeek provider handling not implemented in this utility')
  }

  // For SiliconFlow, use the fetchSiliconFlowModels function
  if (selectedProvider === 'siliconflow') {
    // This would call fetchSiliconFlowModels
    throw new Error('SiliconFlow provider handling not implemented in this utility')
  }

  // For Qwen, use the fetchQwenModels function
  if (selectedProvider === 'qwen') {
    // This would call fetchQwenModels
    throw new Error('Qwen provider handling not implemented in this utility')
  }

  // For GLM, use the fetchGLMModels function
  if (selectedProvider === 'glm') {
    // This would call fetchGLMModels
    throw new Error('GLM provider handling not implemented in this utility')
  }

  // For Baidu Qianfan, use the fetchBaiduQianfanModels function
  if (selectedProvider === 'baidu-qianfan') {
    // This would call fetchBaiduQianfanModels
    throw new Error('Baidu Qianfan provider handling not implemented in this utility')
  }

  // For Azure, skip model fetching and go directly to model input
  if (selectedProvider === 'azure') {
    throw new Error('Azure provider requires manual model input')
  }

  // For all other providers, use the OpenAI client
  let baseURL = providerBaseUrl

  // For custom-openai provider, use the custom base URL
  if (selectedProvider === 'custom-openai') {
    baseURL = customBaseUrl
  }

  const openai = new OpenAI({
    apiKey: apiKey || 'dummy-key-for-ollama', // Ollama doesn't need a real key
    baseURL: baseURL,
    dangerouslyAllowBrowser: true,
  })

  // Fetch the models
  const response = await openai.models.list()

  // Transform the response into our ModelInfo format
  const fetchedModels = []
  for (const model of response.data) {
    const modelName = (model as any).modelName || (model as any).id || (model as any).name || (model as any).model || 'unknown'
    fetchedModels.push({
      model: modelName,
      provider: selectedProvider,
      max_tokens: (model as any).max_tokens || 4096,
      supports_vision: (model as any).supports_vision || false,
      supports_function_calling: (model as any).supports_function_calling || false,
      supports_reasoning_effort: (model as any).supports_reasoning_effort || false,
    })
  }

  return fetchedModels
}