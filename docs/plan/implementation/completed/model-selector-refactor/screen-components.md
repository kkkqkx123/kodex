# Screen Components

This document outlines the structure and responsibilities of the individual screen components that will be created for the ModelSelector.

## Screen Component Structure

Each screen component will follow a consistent structure:

```tsx
import React from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../../../utils/theme'
import { ModelState, ModelStateHandlers } from '../ModelSelector.types'
import { ScreenNavigation } from '../hooks/useScreenNavigation'

interface ScreenProps {
  state: ModelState
  handlers: ModelStateHandlers
  navigation: ScreenNavigation
  onDone: () => void
  onCancel?: () => void
}

export function ScreenNameScreen({
  state,
  handlers,
  navigation,
  onDone,
  onCancel
}: ScreenProps): React.ReactElement {
  const theme = getTheme()
  
  return (
    <Box flexDirection="column" gap={1}>
      {/* Screen-specific content */}
    </Box>
  )
}
```

## Screen Components to Create

### 1. ProviderSelectionScreen
- **Purpose**: Allow user to select an AI provider
- **Key Elements**: 
  - List of available providers with model counts
  - Select component for provider selection
  - Help text and navigation instructions

### 2. AnthropicSubMenuScreen
- **Purpose**: Allow user to select Anthropic API access method
- **Key Elements**:
  - Options for official API, community proxies, or custom
  - Select component for method selection
  - Descriptions of each option

### 3. ApiKeyInputScreen
- **Purpose**: Collect API key from user
- **Key Elements**:
  - Secure text input for API key
  - Provider-specific help text and links
  - Loading indicators for model fetching
  - Error display for API key issues

### 4. ResourceNameInputScreen
- **Purpose**: Collect Azure resource name
- **Key Elements**:
  - Text input for resource name
  - Help text with examples
  - Validation feedback

### 5. BaseUrlInputScreen
- **Purpose**: Collect base URL for API access
- **Key Elements**:
  - Text input for base URL
  - Provider-specific placeholders and help text
  - Loading indicators for Ollama connections
  - Error display for connection issues

### 6. ModelSelectionScreen
- **Purpose**: Allow user to select a model from available options
- **Key Elements**:
  - Searchable model list
  - Model details display (tokens, features)
  - Select component for model selection
  - Search input for filtering models

### 7. ModelInputScreen
- **Purpose**: Allow user to manually enter a model name
- **Key Elements**:
  - Text input for model name
  - Provider-specific placeholders and examples
  - Help text with valid model name formats

### 8. ModelParametersScreen
- **Purpose**: Configure model parameters
- **Key Elements**:
  - Max tokens selection (preset or custom)
  - Reasoning effort selection (if supported)
  - Form navigation with tab/enter keys
  - Current selection display

### 9. ContextLengthScreen
- **Purpose**: Configure context window length
- **Key Elements**:
  - List of context length options
  - Arrow key navigation
  - Recommended option highlighting
  - Current selection display

### 10. ConnectionTestScreen
- **Purpose**: Test the connection to the selected provider
- **Key Elements**:
  - Test status display (loading, success, failure)
  - Test result details
  - Retry button for failed tests
  - Auto-advance on success

### 11. ConfirmationScreen
- **Purpose**: Confirm configuration before saving
- **Key Elements**:
  - Summary of all selected configuration
  - Validation error display
  - Save/cancel options

## Common Patterns

### 1. State Management
- All screens receive state and handlers via props
- Screens update state through provided handler functions
- Navigation is handled through navigation prop

### 2. UI Consistency
- All screens use the same theme and styling
- Consistent padding, spacing, and borders
- Similar help text and instruction patterns

### 3. Error Handling
- Error states are displayed consistently
- User-friendly error messages with actionable guidance
- Clear indication of what went wrong and how to fix it

### 4. Loading States
- Loading indicators for asynchronous operations
- Skeleton screens for better perceived performance
- Clear feedback during long-running operations

## Benefits

1. **Separation of Concerns**: Each screen handles its specific functionality
2. **Maintainability**: Smaller, focused components are easier to understand and modify
3. **Testability**: Individual screens can be tested in isolation
4. **Reusability**: Screen components follow consistent patterns
5. **Scalability**: New screens can be added following the same structure

## Design Considerations

1. **Props Interface**: Consistent props interface across all screens
2. **State Updates**: All state updates go through handler functions
3. **Navigation**: Navigation is handled centrally through navigation prop
4. **Theme Integration**: All screens use the same theme system
5. **Accessibility**: Keyboard navigation and screen reader support