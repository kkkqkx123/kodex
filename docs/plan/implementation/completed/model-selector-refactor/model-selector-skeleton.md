# ModelSelector Component Skeleton

This document outlines the skeleton structure for the refactored ModelSelector component.

## Main Component Structure

```tsx
import React from 'react'
import { ScreenContainer } from './ScreenContainer'
import { useModelSelectorState } from './hooks/useModelSelectorState'
import { useScreenNavigation } from './hooks/useScreenNavigation'
import { useEscapeNavigation } from './hooks/useEscapeNavigation'
import { getTheme } from '../../utils/theme'
import { ProviderSelectionScreen } from './screens/ProviderSelectionScreen'
// Import all other screen components

// Import context if needed
// import { ModelSelectorProvider } from './ModelSelector.context'

export function ModelSelector({
  onDone: onDoneProp,
  abortController,
  targetPointer,
  isOnboarding = false,
  onCancel,
  skipModelType = false,
}: Props): React.ReactNode {
  const theme = getTheme()
  
  // State management
  const state = useModelSelectorState({
    targetPointer,
    isOnboarding,
    skipModelType
  })
  
  // Navigation management
  const navigation = useScreenNavigation()
  
  // Escape key navigation
  useEscapeNavigation(() => {
    if (navigation.currentScreen === 'provider') {
      if (onCancel) {
        onCancel()
      } else {
        onDone()
      }
    } else {
      navigation.goBack()
    }
  }, abortController)
  
  // Handle completion
  const onDone = () => {
    // printModelConfig() - moved to utils
    onDoneProp()
  }
  
  // Render current screen based on navigation state
  const renderCurrentScreen = () => {
    switch (navigation.currentScreen) {
      case 'provider':
        return <ProviderSelectionScreen 
          state={state} 
          navigation={navigation} 
          onDone={onDone} 
          onCancel={onCancel} 
        />
      // Add cases for all other screens
      default:
        return <ProviderSelectionScreen 
          state={state} 
          navigation={navigation} 
          onDone={onDone} 
          onCancel={onCancel} 
        />
    }
  }
  
  return (
    <ModelSelectorProvider value={{ state, navigation }}>
      {renderCurrentScreen()}
    </ModelSelectorProvider>
  )
}
```

## Key Responsibilities

1. **Orchestration**: Coordinate between different screen components
2. **State Management**: Utilize custom hooks for state management
3. **Navigation**: Handle screen transitions using navigation hook
4. **Event Handling**: Manage top-level events like escape key
5. **Props Passing**: Pass necessary props to child components

## Dependencies

- Theme context
- Custom hooks for state and navigation
- Screen components
- Utility functions

## Data Flow

1. State is managed by `useModelSelectorState` hook
2. Navigation is handled by `useScreenNavigation` hook
3. Each screen component receives state and navigation props
4. Screen components update state through provided handlers
5. Navigation is controlled through navigation methods