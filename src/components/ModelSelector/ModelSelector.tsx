import React from 'react'
import { Box, Text, useInput } from 'ink'
import { getTheme } from '../../utils/theme'
import { Select } from '../CustomSelect/select'
import { Newline } from 'ink'
import { PRODUCT_NAME } from '../../constants/product'
import { useExitOnCtrlCD } from '../../hooks/useExitOnCtrlCD'
import {
  getGlobalConfig,
  saveGlobalConfig,
  setAllPointersToModel,
  setModelPointer,
} from '../../utils/config.js'
import models, { providers } from '../../constants/models'
import TextInput from '../TextInput'
import { Props, ScreenType, CONTEXT_LENGTH_OPTIONS, DEFAULT_CONTEXT_LENGTH, MAX_TOKENS_OPTIONS, DEFAULT_MAX_TOKENS } from './ModelSelector.types'
import { useModelSelectorState } from './hooks/useModelSelectorState'
import { useScreenNavigation } from './hooks/useScreenNavigation'
import { useEscapeNavigation } from './hooks/useEscapeNavigation'
import { ProviderSelectionScreen } from './screens/ProviderSelectionScreen'
import { AnthropicSubMenuScreen } from './screens/AnthropicSubMenuScreen'
import { ApiKeyInputScreen } from './screens/ApiKeyInputScreen'
import { ResourceNameInputScreen } from './screens/ResourceNameInputScreen'
import { BaseUrlInputScreen } from './screens/BaseUrlInputScreen'
import { ModelSelectionScreen } from './screens/ModelSelectionScreen'
import { ModelInputScreen } from './screens/ModelInputScreen'
import { ModelParametersScreen } from './screens/ModelParametersScreen'
import { ContextLengthScreen } from './screens/ContextLengthScreen'
import { ConnectionTestScreen } from './screens/ConnectionTestScreen'
import { ConfirmationScreen } from './screens/ConfirmationScreen'
import { getModelDetails, formatNumber, getProviderLabel, sortModelsByPriority } from './utils/formatters'
import { fetchModelsForProvider } from './utils/model-fetching/provider-specific'
import { testChatEndpoint } from './utils/connection-testing/chat-endpoint'
import { testProviderSpecificEndpoint } from './utils/connection-testing/provider-specific'
import { testGPT5Connection, validateGPT5Config } from './utils/connection-testing/gpt5'

// Shared screen container component
function ScreenContainer({
  title,
  exitState,
  children,
}: {
  title: string
  exitState: { pending: boolean; keyName: string }
  children: React.ReactNode
}) {
  const theme = getTheme()
  return (
    <Box
      flexDirection="column"
      gap={1}
      borderStyle="round"
      borderColor={theme.secondaryBorder}
      paddingX={2}
      paddingY={1}
    >
      <Text bold>
        {title}{' '}
        {exitState.pending ? `(press ${exitState.keyName} again to exit)` : ''}
      </Text>
      {children}
    </Box>
  )
}

export { ScreenContainer }

function printModelConfig() {
  const config = getGlobalConfig()
  // Only show ModelProfile information - no legacy fields
  const modelProfiles = config.modelProfiles || []
  const activeProfiles = modelProfiles.filter(p => p.isActive)

  if (activeProfiles.length === 0) {
    console.log('  ⎿ No active model profiles configured')
    return
  }

  const profileSummary = activeProfiles
    .map(p => `${p.name} (${p.provider}: ${p.modelName})`)
    .join(' | ')
  console.log(`  ⎿ ${profileSummary}`)
}

export function ModelSelector({
  onDone: onDoneProp,
  abortController,
  targetPointer,
  isOnboarding = false,
  onCancel,
  skipModelType = false,
}: Props): React.ReactNode {
  const config = getGlobalConfig()
  const theme = getTheme()
  const onDone = () => {
    printModelConfig()
    onDoneProp()
  }
  // Initialize the exit hook but don't use it for Escape key
  const exitState = useExitOnCtrlCD(() => process.exit(0))

  // State management
  const state = useModelSelectorState(config)

  // Screen navigation
  const {
    currentScreen,
    navigateTo,
    goBack,
    screenStack,
    setScreenStack,
  } = useScreenNavigation()

  // Escape navigation
  useEscapeNavigation(() => {
    if (currentScreen === 'provider') {
      // If we're at the first screen, exit
      if (onCancel) {
        onCancel()
      } else {
        onDone()
      }
    } else {
      // Remove the current screen from the stack
      setScreenStack(prev => prev.slice(0, -1))
    }
  }, abortController)

  // Handle cursor offset changes
  function handleCursorOffsetChange(offset: number) {
    state.setCursorOffset(offset)
  }

  // Handle API key changes
  function handleApiKeyChange(value: string) {
    state.setApiKeyEdited(true)
    state.setApiKey(value)
  }

  // Handle model search query changes
  function handleModelSearchChange(value: string) {
    state.setModelSearchQuery(value)
    // Update cursor position to end of text when typing
    state.setModelSearchCursorOffset(value.length)
  }

  // Handle model search cursor offset changes
  function handleModelSearchCursorOffsetChange(offset: number) {
    state.setModelSearchCursorOffset(offset)
  }

  // Create provider options with nice labels
  const availableProviders = Object.keys(providers).filter(
    provider => provider !== 'bigdream' && provider !== 'opendev',
  )

  const providerOptions = availableProviders.map(provider => {
    const modelCount = models[provider]?.length || 0
    const label = getProviderLabel(provider, modelCount)
    return {
      label,
      value: provider,
    }
  })

  // Create a set of model names from our constants/models.ts for the current provider
  const ourModelNames = new Set(
    (models[state.selectedProvider as keyof typeof models] || []).map(
      (model: any) => model.model,
    ),
  )

  // Create model options from available models, filtered by search query
  const filteredModels = state.modelSearchQuery
    ? state.availableModels.filter(model =>
      model.model?.toLowerCase().includes(state.modelSearchQuery.toLowerCase()),
    )
    : state.availableModels

  // Sort models with priority for specific keywords
  const sortedFilteredModels = sortModelsByPriority(filteredModels)

  const modelOptions = sortedFilteredModels.map(model => {
    // Check if this model is in our constants/models.ts list
    const isInOurModels = ourModelNames.has(model.model)

    return {
      label: `${model.model}${getModelDetails(model)}`,
      value: model.model,
    }
  })

  function handleProviderSelection(provider: string) {
    const providerType = provider as any
    state.setSelectedProvider(providerType)

    if (provider === 'custom') {
      // For custom provider, save and exit
      saveConfiguration(providerType, state.selectedModel || '')
      onDone()
    } else if (provider === 'anthropic') {
      // For Anthropic provider, go to sub-menu to choose between official, community proxies, or custom
      navigateTo('anthropicSubMenu')
    } else {
      // For all other providers, go to base URL configuration first
      // Initialize with the default base URL for the provider
      const defaultBaseUrl = providers[providerType]?.baseURL || ''
      state.setProviderBaseUrl(defaultBaseUrl)
      navigateTo('baseUrl')
    }
  }

  function handleAnthropicProviderSelection(
    providerType: 'official' | 'bigdream' | 'custom',
  ) {
    state.setAnthropicProviderType(providerType)

    if (providerType === 'custom') {
      // For custom Anthropic provider, go to base URL configuration
      state.setProviderBaseUrl('')
      navigateTo('baseUrl')
    } else {
      // For official/community proxy providers, set default base URL and go to API key
      const defaultUrls = {
        official: 'https://api.anthropic.com',
        bigdream: 'https://api-key.info',
        opendev: 'https://api.openai-next.com',
      }
      state.setProviderBaseUrl(defaultUrls[providerType])
      navigateTo('apiKey')
    }
  }

  async function fetchModelsWithRetry() {
    const MAX_RETRIES = 2
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      state.setFetchRetryCount(attempt)
      state.setIsRetrying(attempt > 1)

      if (attempt > 1) {
        // Show retry message
        state.setModelLoadError(
          `Attempt ${attempt}/${MAX_RETRIES}: Retrying model discovery...`,
        )
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      try {
        const models = await fetchModels()
        // Success! Reset retry state and return models
        state.setFetchRetryCount(0)
        state.setIsRetrying(false)
        state.setModelLoadError(null)
        return models
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.log(`Model fetch attempt ${attempt} failed:`, lastError.message)

        if (attempt === MAX_RETRIES) {
          // Final attempt failed, break to handle fallback
          break
        }
      }
    }

    // All retries failed, handle fallback to manual input
    state.setIsRetrying(false)
    const errorMessage = lastError?.message || 'Unknown error'

    // Check if provider supports manual input fallback
    const supportsManualInput = [
      'anthropic',
      'kimi',
      'deepseek',
      'siliconflow',
      'qwen',
      'glm',
      'minimax',
      'baidu-qianfan',
      'custom-openai',
    ].includes(state.selectedProvider)

    if (supportsManualInput) {
      state.setModelLoadError(
        `Failed to auto-discover models after ${MAX_RETRIES} attempts: ${errorMessage}\n\n⚡ Automatically switching to manual model configuration...`,
      )

      // Automatically switch to manual input after 2 seconds
      setTimeout(() => {
        state.setModelLoadError(null)
        navigateTo('modelInput')
      }, 2000)
    } else {
      state.setModelLoadError(
        `Failed to load models after ${MAX_RETRIES} attempts: ${errorMessage}`,
      )
    }

    return []
  }

  async function fetchModels() {
    state.setIsLoadingModels(true)
    state.setModelLoadError(null)

    try {
      const models = await fetchModelsForProvider(
        state.selectedProvider,
        state.apiKey,
        state.providerBaseUrl,
        state.customBaseUrl,
        state.resourceName,
        state.ollamaBaseUrl,
      )
      state.setAvailableModels(models)
      navigateTo('model')
      return models
    } catch (error) {
      // Log for debugging
      console.error('Error fetching models:', error)

      // Re-throw the error so that fetchModelsWithRetry can handle it properly
      throw error
    } finally {
      state.setIsLoadingModels(false)
    }
  }

  function handleApiKeySubmit(key: string) {
    state.setApiKey(key)

    // For Azure, go to resource name input next
    if (state.selectedProvider === 'azure') {
      navigateTo('resourceName')
      return
    }

    // Fetch models with the provided API key
    fetchModelsWithRetry().catch(error => {
      // The retry logic in fetchModelsWithRetry already handles the error display
      // This catch is just to prevent unhandled promise rejection
      console.error('Final error after retries:', error)
    })
  }

  function handleResourceNameSubmit(name: string) {
    state.setResourceName(name)
    navigateTo('modelInput')
  }

  function handleCustomBaseUrlSubmit(url: string) {
    // Automatically remove trailing slash from baseURL
    const cleanUrl = url.replace(/\/+$/, '')
    state.setCustomBaseUrl(cleanUrl)
    // After setting custom base URL, go to API key input
    navigateTo('apiKey')
  }

  function handleProviderBaseUrlSubmit(url: string) {
    // Automatically remove trailing slash from baseURL
    const cleanUrl = url.replace(/\/+$/, '')
    state.setProviderBaseUrl(cleanUrl)

    // For Ollama, handle differently - it tries to fetch models immediately
    if (state.selectedProvider === 'ollama') {
      state.setOllamaBaseUrl(cleanUrl)
      state.setIsLoadingModels(true)
      state.setModelLoadError(null)

      // Use the dedicated Ollama model fetch function
      // fetchOllamaModels(cleanUrl).then(models => {
      //   state.setAvailableModels(models)
      //   state.setIsLoadingModels(false)
      //   if (models.length > 0) {
      //     navigateTo('model')
      //   } else {
      //     state.setModelLoadError('No models found in your Ollama installation')
      //   }
      // }).catch(error => {
      //   state.setIsLoadingModels(false)
      //   state.setModelLoadError(error.message)
      // })
    } else {
      // For all other providers, go to API key input next
      navigateTo('apiKey')
    }
  }

  function handleCustomModelSubmit(model: string) {
    state.setCustomModelName(model)
    state.setSelectedModel(model)

    // No model info available, so set default values
    state.setSupportsReasoningEffort(false)
    state.setReasoningEffort(null)

    // Use default max tokens for manually entered models
    state.setMaxTokensMode('preset')
    state.setSelectedMaxTokensPreset(DEFAULT_MAX_TOKENS)
    state.setMaxTokens(DEFAULT_MAX_TOKENS.toString())
    state.setMaxTokensCursorOffset(DEFAULT_MAX_TOKENS.toString().length)

    // Go to model parameters screen
    navigateTo('modelParams')
    // Reset active field index
    state.setActiveFieldIndex(0)
  }

  function handleModelSelection(model: string) {
    state.setSelectedModel(model)

    // Check if the selected model supports reasoning_effort
    const modelInfo = state.availableModels.find(m => m.model === model)
    state.setSupportsReasoningEffort(modelInfo?.supports_reasoning_effort || false)

    if (!modelInfo?.supports_reasoning_effort) {
      state.setReasoningEffort(null)
    }

    // Set max tokens based on model info or default
    if (modelInfo?.max_tokens) {
      const modelMaxTokens = modelInfo.max_tokens
      // Check if the model's max tokens matches any of our presets
      const matchingPreset = MAX_TOKENS_OPTIONS.find(
        option => option.value === modelMaxTokens,
      )

      if (matchingPreset) {
        state.setMaxTokensMode('preset')
        state.setSelectedMaxTokensPreset(modelMaxTokens)
        state.setMaxTokens(modelMaxTokens.toString())
      } else {
        state.setMaxTokensMode('custom')
        state.setMaxTokens(modelMaxTokens.toString())
      }
      state.setMaxTokensCursorOffset(modelMaxTokens.toString().length)
    } else {
      // No model-specific max tokens, use default
      state.setMaxTokensMode('preset')
      state.setSelectedMaxTokensPreset(DEFAULT_MAX_TOKENS)
      state.setMaxTokens(DEFAULT_MAX_TOKENS.toString())
      state.setMaxTokensCursorOffset(DEFAULT_MAX_TOKENS.toString().length)
    }

    // Go to model parameters screen
    navigateTo('modelParams')
    // Reset active field index
    state.setActiveFieldIndex(0)
  }

  const handleModelParamsSubmit = () => {
    // Values are already in state, no need to extract from form
    // Ensure contextLength is set to a valid option before navigating
    if (!CONTEXT_LENGTH_OPTIONS.find(opt => opt.value === state.contextLength)) {
      state.setContextLength(DEFAULT_CONTEXT_LENGTH)
    }
    // Navigate to context length screen
    navigateTo('contextLength')
  }

  async function testConnection(): Promise<{
    success: boolean
    message: string
    endpoint?: string
    details?: string
  }> {
    state.setIsTestingConnection(true)
    state.setConnectionTestResult(null)

    try {
      // Determine the base URL to test
      let testBaseURL =
        state.providerBaseUrl || providers[state.selectedProvider]?.baseURL || ''

      if (state.selectedProvider === 'azure') {
        testBaseURL = `https://${state.resourceName}.openai.azure.com/openai/deployments/${state.selectedModel}`
      } else if (state.selectedProvider === 'custom-openai') {
        testBaseURL = state.customBaseUrl
      }

      // For OpenAI-compatible providers, try multiple endpoints in order of preference
      const isOpenAICompatible = [
        'minimax',
        'kimi',
        'deepseek',
        'siliconflow',
        'qwen',
        'glm',
        'baidu-qianfan',
        'openai',
        'mistral',
        'xai',
        'groq',
        'custom-openai',
      ].includes(state.selectedProvider)

      if (isOpenAICompatible) {
        // 🔥 Use specialized GPT-5 connection test for GPT-5 models
        const isGPT5 = state.selectedModel?.toLowerCase().includes('gpt-5')

        if (isGPT5) {
          console.log(`🚀 Using specialized GPT-5 connection test for model: ${state.selectedModel}`)

          // Validate configuration first
          const configValidation = validateGPT5Config({
            model: state.selectedModel,
            apiKey: state.apiKey,
            baseURL: testBaseURL,
            maxTokens: parseInt(state.maxTokens) || 8192,
            provider: state.selectedProvider,
          })

          if (!configValidation.valid) {
            return {
              success: false,
              message: '❌ GPT-5 configuration validation failed',
              details: configValidation.errors.join('\n'),
            }
          }

          // Use specialized GPT-5 test service
          const gpt5Result = await testGPT5Connection({
            model: state.selectedModel,
            apiKey: state.apiKey,
            baseURL: testBaseURL,
            maxTokens: parseInt(state.maxTokens) || 8192,
            provider: state.selectedProvider,
          })

          return gpt5Result
        }

        // For non-GPT-5 OpenAI-compatible models, use existing logic
        const endpointsToTry = []

        if (state.selectedProvider === 'minimax') {
          endpointsToTry.push(
            {
              path: '/text/chatcompletion_v2',
              name: 'MiniMax v2 (recommended)',
            },
            { path: '/chat/completions', name: 'Standard OpenAI' },
          )
        } else {
          endpointsToTry.push({
            path: '/chat/completions',
            name: 'Standard OpenAI',
          })
        }

        let lastError = null
        for (const endpoint of endpointsToTry) {
          try {
            const testResult = await testChatEndpoint(
              testBaseURL,
              endpoint.path,
              endpoint.name,
              state.selectedModel,
              state.maxTokens,
              state.apiKey,
            )

            if (testResult.success) {
              return testResult
            }
            lastError = testResult
          } catch (error) {
            lastError = {
              success: false,
              message: `Failed to test ${endpoint.name}`,
              endpoint: endpoint.path,
              details: error instanceof Error ? error.message : String(error),
            }
          }
        }

        return (
          lastError || {
            success: false,
            message: 'All endpoints failed',
            details: 'No endpoints could be reached',
          }
        )
      } else {
        // For non-OpenAI providers (like Anthropic, Gemini), use different test approach
        return await testProviderSpecificEndpoint(
          testBaseURL,
          state.selectedProvider,
          state.apiKey,
        )
      }
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : String(error),
      }
    } finally {
      state.setIsTestingConnection(false)
    }
  }

  async function handleConnectionTest() {
    const result = await testConnection()
    state.setConnectionTestResult(result)

    if (result.success) {
      // Auto-advance to confirmation after a short delay
      setTimeout(() => {
        navigateTo('confirmation')
      }, 2000)
    }
  }

  const handleContextLengthSubmit = () => {
    // Context length value is already in state
    // Navigate to connection test screen
    navigateTo('connectionTest')
  }

  async function saveConfiguration(
    provider: any,
    model: string,
  ): Promise<string | null> {
    let baseURL = state.providerBaseUrl || providers[provider]?.baseURL || ''
    let actualProvider = provider

    // For Anthropic provider, determine the actual provider based on sub-menu selection
    if (provider === 'anthropic') {
      switch (state.anthropicProviderType) {
        case 'official':
          actualProvider = 'anthropic'
          baseURL = baseURL || 'https://api.anthropic.com'
          break
        case 'bigdream':
          actualProvider = 'bigdream'
          baseURL = baseURL || 'https://api-key.info'
          break
        case 'custom':
          actualProvider = 'anthropic' // Use anthropic for custom endpoints
          // baseURL is already set from user input
          break
      }
    }

    // For Azure, construct the baseURL using the resource name
    if (provider === 'azure') {
      baseURL = `https://${state.resourceName}.openai.azure.com/openai/deployments/${model}`
    }
    // For custom OpenAI-compatible API, use the custom base URL
    else if (provider === 'custom-openai') {
      baseURL = state.customBaseUrl
    }

    try {
      // Use ModelManager's addModel method for duplicate validation
      // const modelManager = getModelManager()

      // const modelConfig = {
      //   name: `${actualProvider} ${model}`,
      //   provider: actualProvider,
      //   modelName: model,
      //   baseURL: baseURL,
      //   apiKey: state.apiKey || '',
      //   maxTokens: parseInt(state.maxTokens) || state.DEFAULT_MAX_TOKENS,
      //   contextLength: state.contextLength || state.DEFAULT_CONTEXT_LENGTH,
      //   reasoningEffort: state.reasoningEffort,
      // }

      // addModel method will throw error if duplicate exists
      // return await modelManager.addModel(modelConfig)
      return model // Placeholder return
    } catch (error) {
      // Validation failed - show error to user
      state.setValidationError(
        error instanceof Error ? error.message : 'Failed to add model',
      )
      return null
    }
  }

  async function handleConfirmation() {
    // Clear any previous validation errors
    state.setValidationError(null)

    // Save the configuration and exit
    const modelId = await saveConfiguration(state.selectedProvider, state.selectedModel)

    // If validation failed (modelId is null), don't proceed
    if (!modelId) {
      return // Error is already set in saveConfiguration
    }

    // Handle model pointer assignment for new system
    if (modelId && (isOnboarding || targetPointer)) {
      if (isOnboarding) {
        // First-time setup: set all pointers to this model
        setAllPointersToModel(modelId)
      } else if (targetPointer) {
        // Specific pointer configuration: only set target pointer
        setModelPointer(targetPointer, modelId)
      }
    }

    onDone()
  }

  // Handle back navigation based on current screen
  const handleBack = () => {
    if (currentScreen === 'provider') {
      // If we're at the first screen, exit
      if (onCancel) {
        onCancel()
      } else {
        onDone()
      }
    } else {
      // Remove the current screen from the stack
      setScreenStack(prev => prev.slice(0, -1))
    }
  }

  // Handle input for Resource Name screen
  useInput((input, key) => {
    // Handle API key submission on Enter
    if (currentScreen === 'apiKey' && key.return) {
      if (state.apiKey) {
        handleApiKeySubmit(state.apiKey)
      }
      return
    }

    if (currentScreen === 'apiKey' && key.tab) {
      // For providers that support manual model input, skip to manual model input
      if (
        state.selectedProvider === 'anthropic' ||
        state.selectedProvider === 'kimi' ||
        state.selectedProvider === 'deepseek' ||
        state.selectedProvider === 'qwen' ||
        state.selectedProvider === 'glm' ||
        state.selectedProvider === 'minimax' ||
        state.selectedProvider === 'baidu-qianfan' ||
        state.selectedProvider === 'siliconflow' ||
        state.selectedProvider === 'custom-openai'
      ) {
        navigateTo('modelInput')
        return
      }

      // For other providers, try to fetch models without API key
      fetchModelsWithRetry().catch(error => {
        // The retry logic in fetchModelsWithRetry already handles the error display
        // This catch is just to prevent unhandled promise rejection
        console.error('Final error after retries:', error)
      })
      return
    }

    // Handle Resource Name submission on Enter
    if (currentScreen === 'resourceName' && key.return) {
      if (state.resourceName) {
        handleResourceNameSubmit(state.resourceName)
      }
      return
    }

    // Handle Base URL submission on Enter
    if (currentScreen === 'baseUrl' && key.return) {
      if (state.selectedProvider === 'custom-openai') {
        handleCustomBaseUrlSubmit(state.customBaseUrl)
      } else {
        // For all other providers (including ollama), use the general handler
        handleProviderBaseUrlSubmit(state.providerBaseUrl)
      }
      return
    }

    // Handle Custom Model Name submission on Enter
    if (currentScreen === 'modelInput' && key.return) {
      if (state.customModelName) {
        handleCustomModelSubmit(state.customModelName)
      }
      return
    }

    // Handle confirmation on Enter
    if (currentScreen === 'confirmation' && key.return) {
      handleConfirmation().catch(error => {
        console.error('Error in handleConfirmation:', error)
        state.setValidationError(
          error instanceof Error ? error.message : 'Unexpected error occurred',
        )
      })
      return
    }

    // Handle connection test
    if (currentScreen === 'connectionTest') {
      if (key.return) {
        if (!state.isTestingConnection && !state.connectionTestResult) {
          handleConnectionTest()
        } else if (state.connectionTestResult && state.connectionTestResult.success) {
          navigateTo('confirmation')
        } else if (state.connectionTestResult && !state.connectionTestResult.success) {
          // Retry the test
          handleConnectionTest()
        }
        return
      }
    }

    // Handle context length selection
    if (currentScreen === 'contextLength') {
      if (key.return) {
        handleContextLengthSubmit()
        return
      }

      if (key.upArrow) {
        const currentIndex = CONTEXT_LENGTH_OPTIONS.findIndex(
          opt => opt.value === state.contextLength,
        )
        const newIndex =
          currentIndex > 0
            ? currentIndex - 1
            : currentIndex === -1
              ? CONTEXT_LENGTH_OPTIONS.findIndex(
                opt => opt.value === DEFAULT_CONTEXT_LENGTH,
              ) || 0
              : CONTEXT_LENGTH_OPTIONS.length - 1
        state.setContextLength(CONTEXT_LENGTH_OPTIONS[newIndex].value)
        return
      }

      if (key.downArrow) {
        const currentIndex = CONTEXT_LENGTH_OPTIONS.findIndex(
          opt => opt.value === state.contextLength,
        )
        const newIndex =
          currentIndex === -1
            ? CONTEXT_LENGTH_OPTIONS.findIndex(
              opt => opt.value === DEFAULT_CONTEXT_LENGTH,
            ) || 0
            : (currentIndex + 1) % CONTEXT_LENGTH_OPTIONS.length
        state.setContextLength(CONTEXT_LENGTH_OPTIONS[newIndex].value)
        return
      }
    }

    // Handle paste event (Ctrl+V or Cmd+V)
    if (
      currentScreen === 'apiKey' &&
      ((key.ctrl && input === 'v') || (key.meta && input === 'v'))
    ) {
      // We can't directly access clipboard in terminal, but we can show a message
      state.setModelLoadError(
        "Please use your terminal's paste functionality or type the API key manually",
      )
      return
    }

    // Handle Tab key for form navigation in model params screen
    if (currentScreen === 'modelParams' && key.tab) {
      const formFields = [
        {
          name: 'maxTokens',
          label: 'Maximum Tokens',
          description: 'Select the maximum number of tokens to generate.',
          value: parseInt(state.maxTokens),
          component: 'select',
          options: MAX_TOKENS_OPTIONS.map(option => ({
            label: option.label,
            value: option.value.toString(),
          })),
          defaultValue: state.maxTokens,
        },
        ...(state.supportsReasoningEffort
          ? [
            {
              name: 'reasoningEffort',
              label: 'Reasoning Effort',
              description: 'Controls reasoning depth for complex problems.',
              value: state.reasoningEffort,
              component: 'select',
            },
          ]
          : []),
        {
          name: 'submit',
          label: 'Continue →',
          component: 'button',
        },
      ]
      // Move to next field
      state.setActiveFieldIndex(current => (current + 1) % formFields.length)
      return
    }

    // Handle Enter key for form submission in model params screen
    if (currentScreen === 'modelParams' && key.return) {
      const formFields = [
        {
          name: 'maxTokens',
          label: 'Maximum Tokens',
          description: 'Select the maximum number of tokens to generate.',
          value: parseInt(state.maxTokens),
          component: 'select',
          options: MAX_TOKENS_OPTIONS.map(option => ({
            label: option.label,
            value: option.value.toString(),
          })),
          defaultValue: state.maxTokens,
        },
        ...(state.supportsReasoningEffort
          ? [
            {
              name: 'reasoningEffort',
              label: 'Reasoning Effort',
              description: 'Controls reasoning depth for complex problems.',
              value: state.reasoningEffort,
              component: 'select',
            },
          ]
          : []),
        {
          name: 'submit',
          label: 'Continue →',
          component: 'button',
        },
      ]
      const currentField = formFields[state.activeFieldIndex]

      if (
        currentField.name === 'submit' ||
        state.activeFieldIndex === formFields.length - 1
      ) {
        // If on the Continue button, submit the form
        handleModelParamsSubmit()
      } else if (currentField.component === 'select') {
        // For select fields, move to the next field (since selection should be handled by Select component)
        state.setActiveFieldIndex(current =>
          Math.min(current + 1, formFields.length - 1),
        )
      }
      return
    }
  })

  // Render the appropriate screen component based on currentScreen
  switch (currentScreen) {
    case 'provider':
      return (
        <ProviderSelectionScreen
          selectedProvider={state.selectedProvider}
          handleProviderSelection={handleProviderSelection}
          providerOptions={providerOptions}
          exitState={exitState}
        />
      )
    case 'anthropicSubMenu':
      return (
        <AnthropicSubMenuScreen
          handleAnthropicProviderSelection={handleAnthropicProviderSelection}
          exitState={exitState}
        />
      )
    case 'apiKey':
      return (
        <ApiKeyInputScreen
          selectedProvider={state.selectedProvider}
          anthropicProviderType={state.anthropicProviderType}
          apiKey={state.apiKey}
          handleApiKeyChange={handleApiKeyChange}
          handleApiKeySubmit={handleApiKeySubmit}
          isLoadingModels={state.isLoadingModels}
          modelLoadError={state.modelLoadError}
          cursorOffset={state.cursorOffset}
          handleCursorOffsetChange={handleCursorOffsetChange}
          exitState={exitState}
          getProviderLabel={getProviderLabel}
        />
      )
    case 'resourceName':
      return (
        <ResourceNameInputScreen
          resourceName={state.resourceName}
          setResourceName={state.setResourceName}
          handleResourceNameSubmit={handleResourceNameSubmit}
          resourceNameCursorOffset={state.resourceNameCursorOffset}
          setResourceNameCursorOffset={state.setResourceNameCursorOffset}
          exitState={exitState}
        />
      )
    case 'baseUrl':
      return (
        <BaseUrlInputScreen
          selectedProvider={state.selectedProvider}
          customBaseUrl={state.customBaseUrl}
          setCustomBaseUrl={state.setCustomBaseUrl}
          handleCustomBaseUrlSubmit={handleCustomBaseUrlSubmit}
          customBaseUrlCursorOffset={state.customBaseUrlCursorOffset}
          setCustomBaseUrlCursorOffset={state.setCustomBaseUrlCursorOffset}
          providerBaseUrl={state.providerBaseUrl}
          setProviderBaseUrl={state.setProviderBaseUrl}
          handleProviderBaseUrlSubmit={handleProviderBaseUrlSubmit}
          providerBaseUrlCursorOffset={state.providerBaseUrlCursorOffset}
          setProviderBaseUrlCursorOffset={state.setProviderBaseUrlCursorOffset}
          isLoadingModels={state.isLoadingModels}
          modelLoadError={state.modelLoadError}
          exitState={exitState}
        />
      )
    case 'model':
      return (
        <ModelSelectionScreen
          selectedProvider={state.selectedProvider}
          availableModels={state.availableModels}
          modelOptions={modelOptions}
          handleModelSelection={handleModelSelection}
          modelSearchQuery={state.modelSearchQuery}
          handleModelSearchChange={handleModelSearchChange}
          modelSearchCursorOffset={state.modelSearchCursorOffset}
          handleModelSearchCursorOffsetChange={handleModelSearchCursorOffsetChange}
          getProviderLabel={getProviderLabel}
          exitState={exitState}
        />
      )
    case 'modelInput':
      return (
        <ModelInputScreen
          selectedProvider={state.selectedProvider}
          customModelName={state.customModelName}
          setCustomModelName={state.setCustomModelName}
          handleCustomModelSubmit={handleCustomModelSubmit}
          customModelNameCursorOffset={state.customModelNameCursorOffset}
          setCustomModelNameCursorOffset={state.setCustomModelNameCursorOffset}
          exitState={exitState}
        />
      )
    case 'modelParams':
      return (
        <ModelParametersScreen
          selectedModel={state.selectedModel}
          maxTokens={state.maxTokens}
          setMaxTokens={state.setMaxTokens}
          selectedMaxTokensPreset={state.selectedMaxTokensPreset}
          setSelectedMaxTokensPreset={state.setSelectedMaxTokensPreset}
          maxTokensCursorOffset={state.maxTokensCursorOffset}
          setMaxTokensCursorOffset={state.setMaxTokensCursorOffset}
          reasoningEffort={state.reasoningEffort}
          setReasoningEffort={state.setReasoningEffort}
          supportsReasoningEffort={state.supportsReasoningEffort}
          activeFieldIndex={state.activeFieldIndex}
          setActiveFieldIndex={state.setActiveFieldIndex}
          handleModelParamsSubmit={handleModelParamsSubmit}
          exitState={exitState}
        />
      )
    case 'contextLength':
      return (
        <ContextLengthScreen
          contextLength={state.contextLength}
          setContextLength={state.setContextLength}
          handleContextLengthSubmit={handleContextLengthSubmit}
          exitState={exitState}
        />
      )
    case 'connectionTest':
      return (
        <ConnectionTestScreen
          selectedProvider={state.selectedProvider}
          isTestingConnection={state.isTestingConnection}
          connectionTestResult={state.connectionTestResult}
          handleConnectionTest={handleConnectionTest}
          getProviderLabel={getProviderLabel}
          exitState={exitState}
        />
      )
    case 'confirmation':
      return (
        <ConfirmationScreen
          selectedProvider={state.selectedProvider}
          resourceName={state.resourceName}
          ollamaBaseUrl={state.ollamaBaseUrl}
          customBaseUrl={state.customBaseUrl}
          selectedModel={state.selectedModel}
          apiKey={state.apiKey}
          maxTokens={state.maxTokens}
          contextLength={state.contextLength}
          reasoningEffort={state.reasoningEffort}
          supportsReasoningEffort={state.supportsReasoningEffort}
          handleConfirmation={handleConfirmation}
          validationError={state.validationError}
          setValidationError={state.setValidationError}
          getProviderLabel={getProviderLabel}
          exitState={exitState}
        />
      )
    default:
      return (
        <Box flexDirection="column" gap={1}>
          <Text>Unknown screen: {currentScreen}</Text>
        </Box>
      )
  }
}