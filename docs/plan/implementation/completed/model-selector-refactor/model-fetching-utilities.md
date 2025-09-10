# Model Fetching Utilities

This document outlines the structure and responsibilities of the model fetching utilities that will be extracted from the ModelSelector component.

## Utility Structure

The model fetching utilities will be organized by provider type:

```
src/components/ModelSelector/utils/model-fetching/
├── index.ts                 # Main export file
├── anthropic.ts            # Anthropic and compatible providers
├── openai-compatible.ts    # OpenAI-compatible providers
├── gemini.ts               # Google Gemini provider
├── ollama.ts               # Ollama provider
└── provider-specific.ts    # Other provider-specific functions
```

## Key Functions

### 1. fetchAnthropicModels
- **Purpose**: Fetch models from Anthropic or compatible APIs
- **Parameters**: baseURL, apiKey
- **Returns**: Promise<ModelInfo[]>
- **Features**:
  - Support for different API response formats
  - Comprehensive error handling with user-friendly messages
  - Fallback strategies for different API versions

### 2. fetchOpenAICompatibleModels
- **Purpose**: Fetch models from OpenAI-compatible APIs
- **Parameters**: baseURL, apiKey
- **Returns**: Promise<ModelInfo[]>
- **Features**:
  - Integration with existing fetchCustomModels service
  - Support for various OpenAI-compatible providers
  - Error handling with provider-specific guidance

### 3. fetchGeminiModels
- **Purpose**: Fetch models from Google Gemini API
- **Parameters**: apiKey
- **Returns**: Promise<ModelInfo[]>
- **Features**:
  - Specialized handling for Gemini API response format
  - Support for Gemini-specific model features
  - Error handling with Gemini-specific error codes

### 4. fetchOllamaModels
- **Purpose**: Fetch models from Ollama server
- **Parameters**: baseURL
- **Returns**: Promise<ModelInfo[]>
- **Features**:
  - Support for different Ollama API response formats
  - Automatic model name extraction
  - Connection error handling with helpful suggestions

### 5. fetchProviderModels (Generic)
- **Purpose**: Generic model fetching for standard providers
- **Parameters**: provider, baseURL, apiKey
- **Returns**: Promise<ModelInfo[]>
- **Features**:
  - Uses OpenAI client for standard providers
  - Model information enrichment from constants
  - Error handling with retry logic

## Helper Functions

### 1. fetchAnthropicCompatibleModelsWithFallback
- **Purpose**: Implement fallback strategy for Anthropic-compatible providers
- **Approach**: Try Anthropic format → OpenAI format → Manual input
- **Features**:
  - Three-tier fallback system
  - Provider-specific error messages
  - Automatic switching to manual input after failures

### 2. fetchModelsWithRetry
- **Purpose**: Implement retry logic for model fetching
- **Features**:
  - Configurable retry count
  - Exponential backoff
  - Progress indication during retries
  - Fallback to manual input after max retries

## Error Handling

### Common Error Patterns
1. **API Key Errors**: Invalid or missing API keys
2. **Connection Errors**: Network issues or unreachable endpoints
3. **Permission Errors**: Insufficient permissions for model access
4. **Format Errors**: Unexpected API response formats
5. **Rate Limiting**: Too many requests to the API

### Error Response Structure
```typescript
interface ModelFetchError {
  message: string
  provider: string
  suggestion?: string
  retryable: boolean
}
```

## Integration Points

### 1. With State Management
- Update `setAvailableModels` with fetched models
- Update `setIsLoadingModels` during fetch operations
- Update `setModelLoadError` with error messages

### 2. With Navigation
- Navigate to 'model' screen on successful fetch
- Navigate to 'modelInput' screen on fallback
- Handle loading states during navigation

### 3. With Services
- Utilize existing services like `fetchCustomModels`
- Integrate with `OpenAI` client for standard providers
- Use specialized SDKs where available

## Benefits

1. **Separation of Concerns**: Model fetching logic is separated from UI logic
2. **Reusability**: Utilities can be used across different components
3. **Maintainability**: Easier to understand and modify fetching logic
4. **Testability**: Individual functions can be tested in isolation
5. **Provider Isolation**: Each provider's logic is contained in its own module

## Design Considerations

1. **Consistent Interface**: All functions return Promise<ModelInfo[]>
2. **Error Handling**: Comprehensive error handling with user-friendly messages
3. **Fallback Strategies**: Implement fallbacks for unreliable APIs
4. **Retry Logic**: Implement retry mechanisms for transient errors
5. **Performance**: Optimize for quick response times
6. **Caching**: Consider caching strategies for frequently accessed models

## Future Extensions

1. **Caching Layer**: Add caching for fetched models
2. **Batch Operations**: Support for fetching multiple providers simultaneously
3. **Progress Tracking**: More detailed progress indication
4. **Offline Support**: Basic offline functionality with cached models