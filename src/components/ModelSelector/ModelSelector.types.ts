import type { ProviderType, ModelProfile, ModelPointerType } from '../../utils/config/types'

export type Props = {
  onDone: () => void
  abortController?: AbortController
  targetPointer?: ModelPointerType // NEW: Target pointer for configuration
  isOnboarding?: boolean // NEW: Whether this is first-time setup
  onCancel?: () => void // NEW: Cancel callback (different from onDone)
  skipModelType?: boolean // NEW: Skip model type selection
}

export type ModelInfo = {
  model: string
  provider: string
  [key: string]: any
}

// Define reasoning effort options
export type ReasoningEffortOption = 'low' | 'medium' | 'high'

// Define context length options (in tokens)
export type ContextLengthOption = {
  label: string
  value: number
}

export const CONTEXT_LENGTH_OPTIONS: ContextLengthOption[] = [
  { label: '32K tokens', value: 32000 },
  { label: '64K tokens', value: 64000 },
  { label: '128K tokens', value: 128000 },
  { label: '200K tokens', value: 200000 },
  { label: '256K tokens', value: 256000 },
  { label: '300K tokens', value: 300000 },
  { label: '512K tokens', value: 512000 },
  { label: '1000K tokens', value: 1000000 },
  { label: '2000K tokens', value: 2000000 },
  { label: '3000K tokens', value: 3000000 },
  { label: '5000K tokens', value: 5000000 },
  { label: '10000K tokens', value: 10000000 },
]

export const DEFAULT_CONTEXT_LENGTH = 128000

// Define max tokens options
export type MaxTokensOption = {
  label: string
  value: number
}

export const MAX_TOKENS_OPTIONS: MaxTokensOption[] = [
  { label: '1K tokens', value: 1024 },
  { label: '2K tokens', value: 2048 },
  { label: '4K tokens', value: 4096 },
  { label: '8K tokens (recommended)', value: 8192 },
  { label: '16K tokens', value: 16384 },
  { label: '32K tokens', value: 32768 },
  { label: '64K tokens', value: 65536 },
  { label: '128K tokens', value: 131072 },
]

export const DEFAULT_MAX_TOKENS = 8192

export type ScreenType =
  | 'provider'
  | 'anthropicSubMenu'
  | 'apiKey'
  | 'resourceName'
  | 'baseUrl'
  | 'model'
  | 'modelInput'
  | 'modelParams'
  | 'contextLength'
  | 'connectionTest'
  | 'confirmation'