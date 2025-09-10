export async function fetchOllamaModels(ollamaBaseUrl: string) {
  try {
    const response = await fetch(`${ollamaBaseUrl}/models`)

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const responseData = await response.json()

    // Properly handle Ollama API response format
    // Ollama API can return models in different formats based on version
    let models = []

    // Check if data field exists (newer Ollama versions)
    if (responseData.data && Array.isArray(responseData.data)) {
      models = responseData.data
    }
    // Check if models array is directly at the root (older Ollama versions)
    else if (Array.isArray(responseData.models)) {
      models = responseData.models
    }
    // If response is already an array
    else if (Array.isArray(responseData)) {
      models = responseData
    } else {
      throw new Error(
        'Invalid response from Ollama API: missing models array',
      )
    }

    // Transform Ollama models to our format
    const ollamaModels = models.map((model: any) => ({
      model:
        model.name ??
        model.modelName ??
        (typeof model === 'string' ? model : ''),
      provider: 'ollama',
      max_tokens: 4096, // Default value
      supports_vision: false,
      supports_function_calling: true,
      supports_reasoning_effort: false,
    }))

    // Filter out models with empty names
    const validModels = ollamaModels.filter(model => model.model)

    return validModels
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('fetch')) {
      throw new Error(
        `Could not connect to Ollama server at ${ollamaBaseUrl}. Make sure Ollama is running and the URL is correct.`,
      )
    } else {
      throw new Error(`Error loading Ollama models: ${errorMessage}`)
    }
  }
}