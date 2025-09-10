# ModelSelector TypeScript Types

This document outlines the TypeScript types that need to be extracted from the ModelSelector.tsx component.

## Main Component Props

```typescript
type Props = {
  onDone: () => void
  abortController?: AbortController
  targetPointer?: ModelPointerType // NEW: Target pointer for configuration
  isOnboarding?: boolean // NEW: Whether this is first-time setup
  onCancel?: () => void // NEW: Cancel callback (different from onDone)
  skipModelType?: boolean // NEW: Skip model type selection
}
```

## Model Information Types

```typescript
type ModelInfo = {
  model: string
  provider: string
  [key: string]: any
}
```

## Reasoning Effort Types

```typescript
type ReasoningEffortOption = 'low' | 'medium' | 'high'
```

## Context Length Types

```typescript
type ContextLengthOption = {
  label: string
  value: number
}
```

## Max Tokens Types

```typescript
type MaxTokensOption = {
  label: string
  value: number
}
```

## Screen Types

```typescript
type ScreenType = 
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
```

## Connection Test Result Types

```typescript
type ConnectionTestResult = {
  success: boolean
  message: string
  endpoint?: string
  details?: string
} | null
```

## Form Field Types

```typescript
type FormField = {
  name: string
  label: string
  description?: string
  value: any
  component: 'select' | 'button'
  options?: Array<{ label: string; value: string }>
  defaultValue?: any
}