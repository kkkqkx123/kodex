# Utility Functions

This document outlines the utility functions that will be extracted from the ModelSelector component to improve modularity and maintainability.

## Utility Structure

The utility functions will be organized by category:

```
src/components/ModelSelector/utils/
├── index.ts                 # Main export file
├── formatters.ts           # Formatting functions
├── model-utils.ts          # Model-related utilities
├── provider-utils.ts       # Provider-related utilities
├── navigation-utils.ts     # Navigation-related utilities
└── validation-utils.ts     # Validation functions
```

## Formatting Functions

### 1. getModelDetails
- **Purpose**: Format model details for display
- **Parameters**: ModelInfo object
- **Returns**: Formatted string with model details
- **Features**:
  - Display max tokens in readable format (K, M suffixes)
  - Show supported features (vision, tools, reasoning)
  - Consistent formatting across all models

### 2. formatNumber
- **Purpose**: Format large numbers for display
- **Parameters**: number
- **Returns**: Formatted string (e.g., "8K", "1.5M")
- **Features**:
  - Handle millions (M) and thousands (K) suffixes
  - Appropriate decimal places for different ranges
  - Fallback to plain number for small values

### 3. getProviderLabel
- **Purpose**: Generate provider label with model count
- **Parameters**: provider name, model count
- **Returns**: Formatted label string
- **Features**:
  - Include provider status (WIP) when applicable
  - Show model count in parentheses
  - Fallback to simple provider name

## Model Utility Functions

### 1. sortModelsByPriority
- **Purpose**: Sort models with priority for specific keywords
- **Parameters**: Array of ModelInfo objects
- **Returns**: Sorted array of ModelInfo objects
- **Features**:
  - Priority for popular model keywords (claude, gpt, etc.)
  - Alphabetical sorting as fallback
  - Safety checks for undefined model names

### 2. getFormFieldsForModelParams
- **Purpose**: Generate form fields for model parameters screen
- **Parameters**: Current state values
- **Returns**: Array of form field objects
- **Features**:
  - Dynamic fields based on model capabilities
  - Conditional rendering of reasoning effort field
  - Proper default values and options

## Provider Utility Functions

### 1. getAvailableProviders
- **Purpose**: Get list of available providers excluding community proxies
- **Parameters**: providers object from constants
- **Returns**: Array of provider names
- **Features**:
  - Filter out community Claude providers
  - Return clean list of supported providers

### 2. createProviderOptions
- **Purpose**: Create provider options for Select component
- **Parameters**: available providers, models object
- **Returns**: Array of option objects for Select component
- **Features**:
  - Include model counts in labels
  - Apply provider labels with status indicators
  - Proper value mapping for selection

## Navigation Utility Functions

### 1. getInitialScreen
- **Purpose**: Determine the initial screen for the flow
- **Parameters**: None
- **Returns**: Screen type string
- **Features**:
  - Always start with provider selection in new system
  - Consistent entry point for all flows

### 2. handleBackNavigation
- **Purpose**: Handle back navigation based on current screen
- **Parameters**: currentScreen, screenStack, onDone, onCancel
- **Returns**: Navigation action
- **Features**:
  - Exit on first screen or call appropriate callback
  - Navigate back through screen stack
  - Proper cleanup of state when needed

## Validation Utility Functions

### 1. validateModelConfiguration
- **Purpose**: Validate model configuration before saving
- **Parameters**: Provider, model, API key, base URL
- **Returns**: { isValid: boolean, errors: string[] }
- **Features**:
  - Check for required fields
  - Validate API key format (basic)
  - Validate URL format
  - Provider-specific validation rules

### 2. validateContextLength
- **Purpose**: Validate context length selection
- **Parameters**: contextLength, available options
- **Returns**: { isValid: boolean, errors: string[] }
- **Features**:
  - Check if value is in available options
  - Fallback to default if invalid
  - Provide validation feedback

## Handler Utility Functions

### 1. createNavigationHandlers
- **Purpose**: Create navigation handler functions
- **Parameters**: screenStack state setters
- **Returns**: Object with navigation handler functions
- **Features**:
  - navigateTo function for moving to new screens
  - goBack function for returning to previous screens
  - Proper state management for screen stack

### 2. createModelSelectionHandlers
- **Purpose**: Create model selection handler functions
- **Parameters**: State setters for model-related state
- **Returns**: Object with model selection handlers
- **Features**:
  - handleModelSelection for automatic parameter setting
  - handleCustomModelSubmit for manual model entry
  - Proper state updates for max tokens and reasoning effort

## Input Handler Functions

### 1. createInputHandlers
- **Purpose**: Create input handler functions for text inputs
- **Parameters**: State setters for input-related state
- **Returns**: Object with input handlers
- **Features**:
  - handleApiKeyChange with environment variable integration
  - handleModelSearchChange with cursor management
  - Provider-specific input handlers

### 2. createCursorOffsetHandlers
- **Purpose**: Create cursor offset handler functions
- **Parameters**: State setters for cursor-related state
- **Returns**: Object with cursor handlers
- **Features**:
  - Generic cursor offset handling
  - Provider-specific cursor management
  - Proper synchronization with input changes

## Benefits

1. **Separation of Concerns**: Utility logic is separated from UI and state logic
2. **Reusability**: Functions can be used across different components
3. **Maintainability**: Easier to understand and modify utility functions
4. **Testability**: Individual functions can be tested in isolation
5. **Consistency**: Standardized formatting and validation across the application

## Design Considerations

1. **Pure Functions**: Most utilities should be pure functions without side effects
2. **Consistent Interfaces**: Similar parameters and return types across related functions
3. **Error Handling**: Proper error handling with meaningful error messages
4. **Performance**: Optimize for quick execution
5. **Extensibility**: Easy to add new utility functions

## Future Extensions

1. **Caching**: Add caching for expensive utility computations
2. **Configuration**: Make utilities configurable through options
3. **Localization**: Add support for internationalization
4. **Performance Monitoring**: Add performance tracking for utilities