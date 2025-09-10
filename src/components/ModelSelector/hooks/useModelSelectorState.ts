import { useState, useEffect } from 'react'
import { ProviderType } from '../../../utils/config/types'
import { getGlobalConfig } from '../../../utils/config'
import { ReasoningEffortOption, DEFAULT_MAX_TOKENS, DEFAULT_CONTEXT_LENGTH } from '../ModelSelector.types'

export const useModelSelectorState = (config: ReturnType<typeof getGlobalConfig>) => {
  // State for model configuration
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(
    config.primaryProvider ?? 'anthropic',
  )

  // State for Anthropic provider sub-menu
  const [anthropicProviderType, setAnthropicProviderType] = useState<
    'official' | 'bigdream' | 'opendev' | 'custom'
  >('official')
  
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')

  // New state for model parameters
  const [maxTokens, setMaxTokens] = useState<string>(
    config.maxTokens?.toString() || DEFAULT_MAX_TOKENS.toString(),
  )
  const [maxTokensMode, setMaxTokensMode] = useState<'preset' | 'custom'>(
    'preset',
  )
  const [selectedMaxTokensPreset, setSelectedMaxTokensPreset] =
    useState<number>(config.maxTokens || DEFAULT_MAX_TOKENS)
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffortOption | null>('medium')
  const [supportsReasoningEffort, setSupportsReasoningEffort] =
    useState<boolean>(false)

  // Context length state (use default instead of legacy config)
  const [contextLength, setContextLength] = useState<number>(
    DEFAULT_CONTEXT_LENGTH,
  )

  // Form focus state
  const [activeFieldIndex, setActiveFieldIndex] = useState(0)
  const [maxTokensCursorOffset, setMaxTokensCursorOffset] = useState<number>(0)

  // UI state
  const [cursorOffset, setCursorOffset] = useState<number>(0)
  const [apiKeyEdited, setApiKeyEdited] = useState<boolean>(false)

  // Search and model loading state
  const [availableModels, setAvailableModels] = useState<any[]>([])
 const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  const [modelSearchQuery, setModelSearchQuery] = useState<string>('')
  const [modelSearchCursorOffset, setModelSearchCursorOffset] =
    useState<number>(0)

  // Retry logic state
  const [fetchRetryCount, setFetchRetryCount] = useState<number>(0)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)

  // Connection test state
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false)
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean
    message: string
    endpoint?: string
    details?: string
  } | null>(null)

  // Validation error state for duplicate model detection
  const [validationError, setValidationError] = useState<string | null>(null)

  // State for Azure-specific configuration
  const [resourceName, setResourceName] = useState<string>('')
  const [resourceNameCursorOffset, setResourceNameCursorOffset] =
    useState<number>(0)
  const [customModelName, setCustomModelName] = useState<string>('')
  const [customModelNameCursorOffset, setCustomModelNameCursorOffset] =
    useState<number>(0)

  // State for Ollama-specific configuration
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>(
    'http://localhost:11434/v1',
  )
  const [ollamaBaseUrlCursorOffset, setOllamaBaseUrlCursorOffset] =
    useState<number>(0)

  // State for custom OpenAI-compatible API configuration
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('')
  const [customBaseUrlCursorOffset, setCustomBaseUrlCursorOffset] =
    useState<number>(0)

  // State for provider base URL configuration (used for all providers)
  const [providerBaseUrl, setProviderBaseUrl] = useState<string>('')
  const [providerBaseUrlCursorOffset, setProviderBaseUrlCursorOffset] =
    useState<number>(0)

  // Initialize API key from environment variables
  useEffect(() => {
    if (!apiKeyEdited && selectedProvider) {
      if (process.env[selectedProvider.toUpperCase() + '_API_KEY']) {
        setApiKey(
          process.env[selectedProvider.toUpperCase() + '_API_KEY'] as string,
        )
      } else {
        setApiKey('')
      }
    }
  }, [selectedProvider, apiKey, apiKeyEdited])

  return {
    // Provider selection
    selectedProvider,
    setSelectedProvider,
    
    // Anthropic submenu
    anthropicProviderType,
    setAnthropicProviderType,
    
    // Model selection
    selectedModel,
    setSelectedModel,
    
    // API key
    apiKey,
    setApiKey,
    apiKeyEdited,
    setApiKeyEdited,
    
    // Model parameters
    maxTokens,
    setMaxTokens,
    maxTokensMode,
    setMaxTokensMode,
    selectedMaxTokensPreset,
    setSelectedMaxTokensPreset,
    reasoningEffort,
    setReasoningEffort,
    supportsReasoningEffort,
    setSupportsReasoningEffort,
    
    // Context length
    contextLength,
    setContextLength,
    
    // Form focus
    activeFieldIndex,
    setActiveFieldIndex,
    maxTokensCursorOffset,
    setMaxTokensCursorOffset,
    
    // UI state
    cursorOffset,
    setCursorOffset,
    
    // Model loading
    availableModels,
    setAvailableModels,
    isLoadingModels,
    setIsLoadingModels,
    modelLoadError,
    setModelLoadError,
    modelSearchQuery,
    setModelSearchQuery,
    modelSearchCursorOffset,
    setModelSearchCursorOffset,
    
    // Retry logic
    fetchRetryCount,
    setFetchRetryCount,
    isRetrying,
    setIsRetrying,
    
    // Connection test
    isTestingConnection,
    setIsTestingConnection,
    connectionTestResult,
    setConnectionTestResult,
    
    // Validation
    validationError,
    setValidationError,
    
    // Azure config
    resourceName,
    setResourceName,
    resourceNameCursorOffset,
    setResourceNameCursorOffset,
    
    // Custom model name
    customModelName,
    setCustomModelName,
    customModelNameCursorOffset,
    setCustomModelNameCursorOffset,
    
    // Ollama config
    ollamaBaseUrl,
    setOllamaBaseUrl,
    ollamaBaseUrlCursorOffset,
    setOllamaBaseUrlCursorOffset,
    
    // Custom OpenAI config
    customBaseUrl,
    setCustomBaseUrl,
    customBaseUrlCursorOffset,
    setCustomBaseUrlCursorOffset,
    
    // Provider base URL
    providerBaseUrl,
    setProviderBaseUrl,
    providerBaseUrlCursorOffset,
    setProviderBaseUrlCursorOffset,
  }
}