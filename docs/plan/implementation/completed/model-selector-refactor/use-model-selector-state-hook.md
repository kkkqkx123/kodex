# useModelSelectorState Hook

This document outlines the structure and responsibilities of the `useModelSelectorState` hook that will manage all state for the ModelSelector component.

## Hook Structure

```tsx
import { useState, useEffect } from 'react'
import { ProviderType } from '../../utils/config'
import { ModelInfo } from './ModelSelector.types'

interface UseModelSelectorStateProps {
  targetPointer?: ModelPointerType
  isOnboarding?: boolean
  skipModelType?: boolean
}

interface ModelState {
  // Provider selection state
  selectedProvider: ProviderType
  anthropicProviderType: 'official' | 'bigdream' | 'opendev' | 'custom'
  
  // Model selection state
  selectedModel: string
  availableModels: ModelInfo[]
  customModelName: string
  
  // API key state
  apiKey: string
  apiKeyEdited: boolean
  
  // Model parameters state
  maxTokens: string
  maxTokensMode: 'preset' | 'custom'
  selectedMaxTokensPreset: number
  reasoningEffort: 'low' | 'medium' | 'high' | null
  supportsReasoningEffort: boolean
  contextLength: number
  
  // UI state
  activeFieldIndex: number
  maxTokensCursorOffset: number
  cursorOffset: number
  
  // Search state
  modelSearchQuery: string
  modelSearchCursorOffset: number
  
  // Loading and error state
  isLoadingModels: boolean
  modelLoadError: string | null
  fetchRetryCount: number
  isRetrying: boolean
  
  // Connection test state
  isTestingConnection: boolean
  connectionTestResult: ConnectionTestResult
  
  // Validation state
  validationError: string | null
  
  // Provider-specific state
  resourceName: string
  resourceNameCursorOffset: number
  customModelNameCursorOffset: number
  ollamaBaseUrl: string
  ollamaBaseUrlCursorOffset: number
  customBaseUrl: string
  customBaseUrlCursorOffset: number
  providerBaseUrl: string
  providerBaseUrlCursorOffset: number
}

interface ModelStateHandlers {
  // Provider handlers
  setSelectedProvider: (provider: ProviderType) => void
  setAnthropicProviderType: (type: 'official' | 'bigdream' | 'opendev' | 'custom') => void
  
  // Model handlers
  setSelectedModel: (model: string) => void
  setAvailableModels: (models: ModelInfo[]) => void
  setCustomModelName: (name: string) => void
  
  // API key handlers
  setApiKey: (key: string) => void
  setApiKeyEdited: (edited: boolean) => void
  
  // Model parameters handlers
  setMaxTokens: (tokens: string) => void
  setMaxTokensMode: (mode: 'preset' | 'custom') => void
  setSelectedMaxTokensPreset: (preset: number) => void
  setReasoningEffort: (effort: 'low' | 'medium' | 'high' | null) => void
  setSupportsReasoningEffort: (supports: boolean) => void
  setContextLength: (length: number) => void
  
  // UI handlers
  setActiveFieldIndex: (index: number) => void
  setMaxTokensCursorOffset: (offset: number) => void
  setCursorOffset: (offset: number) => void
  
  // Search handlers
  setModelSearchQuery: (query: string) => void
  setModelSearchCursorOffset: (offset: number) => void
  
  // Loading and error handlers
  setIsLoadingModels: (loading: boolean) => void
  setModelLoadError: (error: string | null) => void
  setFetchRetryCount: (count: number) => void
  setIsRetrying: (retrying: boolean) => void
  
  // Connection test handlers
  setIsTestingConnection: (testing: boolean) => void
  setConnectionTestResult: (result: ConnectionTestResult) => void
  
  // Validation handlers
  setValidationError: (error: string | null) => void
  
  // Provider-specific handlers
  setResourceName: (name: string) => void
  setResourceNameCursorOffset: (offset: number) => void
  setCustomModelNameCursorOffset: (offset: number) => void
  setOllamaBaseUrl: (url: string) => void
  setOllamaBaseUrlCursorOffset: (offset: number) => void
  setCustomBaseUrl: (url: string) => void
  setCustomBaseUrlCursorOffset: (offset: number) => void
  setProviderBaseUrl: (url: string) => void
  setProviderBaseUrlCursorOffset: (offset: number) => void
}

export function useModelSelectorState(props: UseModelSelectorStateProps): {
  state: ModelState
  handlers: ModelStateHandlers
} {
  // Initialize all state variables
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(/* initial value */)
  const [anthropicProviderType, setAnthropicProviderType] = useState<'official' | 'bigdream' | 'opendev' | 'custom'>('official')
  const [selectedModel, setSelectedModel] = useState<string>('')
  // ... all other state variables
  
  // Effects
  useEffect(() => {
    // Effect for handling API key from environment variables
  }, [selectedProvider, apiKey, apiKeyEdited])
  
  useEffect(() => {
    // Effect for ensuring contextLength is valid
  }, [currentScreen, contextLength])
  
  // Return state and handlers
  return {
    state: {
      selectedProvider,
      anthropicProviderType,
      selectedModel,
      // ... all state variables
    },
    handlers: {
      setSelectedProvider,
      setAnthropicProviderType,
      setSelectedModel,
      // ... all handler functions
    }
  }
}
```

## Key Responsibilities

1. **State Management**: Manage all state variables for the ModelSelector component
2. **Effect Handling**: Handle side effects like loading API keys from environment variables
3. **Validation**: Ensure state values are valid (e.g., contextLength options)
4. **Initialization**: Set initial state values based on props and config

## State Categories

1. **Provider Selection**: State related to choosing AI providers
2. **Model Selection**: State related to model selection and available models
3. **API Key Management**: State for handling API keys
4. **Model Parameters**: State for model configuration parameters
5. **UI State**: State for UI interactions and cursor positions
6. **Search State**: State for model search functionality
7. **Loading/Error State**: State for handling loading and error conditions
8. **Connection Test State**: State for connection testing
9. **Validation State**: State for validation errors
10. **Provider-Specific State**: State for provider-specific configurations

## Benefits

1. **Centralized State**: All state is managed in one place
2. **Separation of Concerns**: State logic is separated from UI logic
3. **Reusability**: State management can be reused across components
4. **Testability**: State logic can be tested independently
5. **Maintainability**: Easier to understand and modify state-related code