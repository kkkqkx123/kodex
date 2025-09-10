import type { ModelProfile, ModelPointerType, ProviderType, GlobalConfig } from './types'
import { getGlobalConfig, saveGlobalConfig } from './global'

// Configuration migration utility functions
export function migrateModelProfilesRemoveId(config: GlobalConfig): GlobalConfig {
  if (!config.modelProfiles) return config

  // 1. Remove id field from ModelProfile objects and build ID to modelName mapping
  const idToModelNameMap = new Map<string, string>()
  const migratedProfiles = config.modelProfiles.map(profile => {
    // Build mapping before removing id field
    if ((profile as any).id && profile.modelName) {
      idToModelNameMap.set((profile as any).id, profile.modelName)
    }

    // Remove id field, keep everything else
    const { id, ...profileWithoutId } = profile as any
    return profileWithoutId as ModelProfile
  })

  // 2. Migrate ModelPointers from IDs to modelNames
  const migratedPointers = {
    main: '',
    task: '',
    reasoning: '',
    quick: '',
  }

  if (config.modelPointers) {
    Object.entries(config.modelPointers).forEach(([pointer, value]) => {
      if (value) {
        // If value looks like an old ID (model_xxx), map it to modelName
        const modelName = idToModelNameMap.get(value) || value
        migratedPointers[pointer as ModelPointerType] = modelName
      }
    })
  }

  // 3. Migrate legacy config fields
  let defaultModelName: string | undefined
  if ((config as any).defaultModelId) {
    defaultModelName =
      idToModelNameMap.get((config as any).defaultModelId) ||
      (config as any).defaultModelId
  } else if ((config as any).defaultModelName) {
    defaultModelName = (config as any).defaultModelName
  }

  // 4. Remove legacy fields and return migrated config
  const migratedConfig = { ...config }
  delete (migratedConfig as any).defaultModelId
  delete (migratedConfig as any).currentSelectedModelId
  delete (migratedConfig as any).mainAgentModelId
  delete (migratedConfig as any).taskToolModelId

  return {
    ...migratedConfig,
    modelProfiles: migratedProfiles,
    modelPointers: migratedPointers,
    defaultModelName,
  }
}

// New model system utility functions

export function setAllPointersToModel(modelName: string): void {
  const config = getGlobalConfig()
  const updatedConfig = {
    ...config,
    modelPointers: {
      main: modelName,
      task: modelName,
      reasoning: modelName,
      quick: modelName,
    },
    defaultModelName: modelName,
  }
  saveGlobalConfig(updatedConfig)
}

export function setModelPointer(
  pointer: ModelPointerType,
  modelName: string,
): void {
  const config = getGlobalConfig()
  const updatedConfig = {
    ...config,
    modelPointers: {
      ...config.modelPointers,
      [pointer]: modelName,
    },
  }
  saveGlobalConfig(updatedConfig)

  // 🔧 Fix: Force ModelManager reload after config change
  // Import here to avoid circular dependency
  import('../model').then(({ reloadModelManager }) => {
    reloadModelManager()
  })
}

// 🔥 GPT-5 Configuration Validation and Auto-Repair Functions

/**
 * Check if a model name represents a GPT-5 model
 */
export function isGPT5ModelName(modelName: string): boolean {
  if (!modelName || typeof modelName !== 'string') return false
  const lowerName = modelName.toLowerCase()
  return lowerName.startsWith('gpt-5') || lowerName.includes('gpt-5')
}

/**
 * Validate and auto-repair GPT-5 model configuration
 */
export function validateAndRepairGPT5Profile(profile: ModelProfile): ModelProfile {
  const isGPT5 = isGPT5ModelName(profile.modelName)
  const now = Date.now()
  
  // Create a working copy
  const repairedProfile: ModelProfile = { ...profile }
  let wasRepaired = false
  
  // 🔧 Set GPT-5 detection flag
  if (isGPT5 !== profile.isGPT5) {
    repairedProfile.isGPT5 = isGPT5
    wasRepaired = true
  }
  
  if (isGPT5) {
    // 🔧 GPT-5 Parameter Validation and Repair
    
    // 1. Reasoning effort validation
    const validReasoningEfforts = ['minimal', 'low', 'medium', 'high']
    if (!profile.reasoningEffort || !validReasoningEfforts.includes(profile.reasoningEffort)) {
      repairedProfile.reasoningEffort = 'medium' // Default for coding tasks
      wasRepaired = true
      console.log(`🔧 GPT-5 Config: Set reasoning effort to 'medium' for ${profile.modelName}`)
    }
    
    // 2. Context length validation (GPT-5 models typically have 128k context)
    if (profile.contextLength < 128000) {
      repairedProfile.contextLength = 128000
      wasRepaired = true
      console.log(`🔧 GPT-5 Config: Updated context length to 128k for ${profile.modelName}`)
    }
    
    // 3. Output tokens validation (reasonable defaults for GPT-5)
    if (profile.maxTokens < 4000) {
      repairedProfile.maxTokens = 8192 // Good default for coding tasks
      wasRepaired = true
      console.log(`🔧 GPT-5 Config: Updated max tokens to 8192 for ${profile.modelName}`)
    }
    
    // 4. Provider validation
    if (profile.provider !== 'openai' && profile.provider !== 'custom-openai' && profile.provider !== 'azure') {
      console.warn(`⚠️  GPT-5 Config: Unexpected provider '${profile.provider}' for GPT-5 model ${profile.modelName}. Consider using 'openai' or 'custom-openai'.`)
    }
    
    // 5. Base URL validation for official models
    if (profile.modelName.includes('gpt-5') && !profile.baseURL) {
      repairedProfile.baseURL = 'https://api.openai.com/v1'
      wasRepaired = true
      console.log(`🔧 GPT-5 Config: Set default base URL for ${profile.modelName}`)
    }
  }
  
  // Update validation metadata
  repairedProfile.validationStatus = wasRepaired ? 'auto_repaired' : 'valid'
  repairedProfile.lastValidation = now
  
  if (wasRepaired) {
    console.log(`✅ GPT-5 Config: Auto-repaired configuration for ${profile.modelName}`)
  }
  
  return repairedProfile
}

/**
 * Validate and repair all GPT-5 profiles in the global configuration
 */
export function validateAndRepairAllGPT5Profiles(): { repaired: number; total: number } {
  const config = getGlobalConfig()
  if (!config.modelProfiles) {
    return { repaired: 0, total: 0 }
  }
  
  let repairCount = 0
  const repairedProfiles = config.modelProfiles.map(profile => {
    const repairedProfile = validateAndRepairGPT5Profile(profile)
    if (repairedProfile.validationStatus === 'auto_repaired') {
      repairCount++
    }
    return repairedProfile
  })
  
  // Save the repaired configuration
  if (repairCount > 0) {
    const updatedConfig = {
      ...config,
      modelProfiles: repairedProfiles,
    }
    saveGlobalConfig(updatedConfig)
    console.log(`🔧 GPT-5 Config: Auto-repaired ${repairCount} model profiles`)
  }
  
  return { repaired: repairCount, total: config.modelProfiles.length }
}

/**
 * Get GPT-5 configuration recommendations for a specific model
 */
export function getGPT5ConfigRecommendations(modelName: string): Partial<ModelProfile> {
  if (!isGPT5ModelName(modelName)) {
    return {}
  }
  
  const recommendations: Partial<ModelProfile> = {
    contextLength: 128000, // GPT-5 standard context length
    maxTokens: 8192, // Good default for coding tasks
    reasoningEffort: 'medium', // Balanced for most coding tasks
    isGPT5: true,
  }
  
  // Model-specific optimizations
  if (modelName.includes('gpt-5-mini')) {
    recommendations.maxTokens = 4096 // Smaller default for mini
    recommendations.reasoningEffort = 'low' // Faster for simple tasks
  } else if (modelName.includes('gpt-5-nano')) {
    recommendations.maxTokens = 2048 // Even smaller for nano
    recommendations.reasoningEffort = 'minimal' // Fastest option
  }
  
  return recommendations
}

/**
 * Create a properly configured GPT-5 model profile
 */
export function createGPT5ModelProfile(
  name: string,
  modelName: string,
  apiKey: string,
  baseURL?: string,
  provider: ProviderType = 'openai'
): ModelProfile {
  const recommendations = getGPT5ConfigRecommendations(modelName)
  
  const profile: ModelProfile = {
    name,
    provider,
    modelName,
    baseURL: baseURL || 'https://api.openai.com/v1',
    apiKey,
    maxTokens: recommendations.maxTokens || 8192,
    contextLength: recommendations.contextLength || 128000,
    reasoningEffort: recommendations.reasoningEffort || 'medium',
    isActive: true,
    createdAt: Date.now(),
    isGPT5: true,
    validationStatus: 'valid',
    lastValidation: Date.now(),
  }
  
  console.log(`✅ Created GPT-5 model profile: ${name} (${modelName})`)
  return profile
}