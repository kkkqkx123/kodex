# ModelSelector Component Refactoring Plan

## Overview
The `src/components/ModelSelector.tsx` file is currently over 3,300 lines long, making it difficult to maintain and understand. This document outlines a plan to refactor this component into smaller, more modular, and maintainable pieces.

## Goals
1. Reduce complexity by breaking down the monolithic component
2. Improve code organization and maintainability
3. Enhance testability of individual parts
4. Follow React and TypeScript best practices
5. Maintain current functionality without breaking changes

## Current Structure Analysis
The ModelSelector component currently includes:
1. Multiple screens/states (provider selection, API key input, model selection, etc.)
2. Numerous helper functions for fetching models from different providers
3. Custom hooks and utility functions
4. State management for all UI interactions
5. Provider-specific model fetching logic
6. Connection testing functionality

## Proposed Refactored Structure

### 1. Component Organization
```
src/
├── components/
│   ├── ModelSelector/
│   │   ├── ModelSelector.tsx                 # Main component orchestrating screens
│   │   ├── ModelSelector.types.ts            # Shared TypeScript types
│   │   ├── ModelSelector.context.tsx         # Shared context for state management
│   │   ├── screens/                          # Individual screen components
│   │   │   ├── ProviderSelectionScreen.tsx
│   │   │   ├── AnthropicSubMenuScreen.tsx
│   │   │   ├── ApiKeyInputScreen.tsx
│   │   │   ├── ResourceNameInputScreen.tsx
│   │   │   ├── BaseUrlInputScreen.tsx
│   │   │   ├── ModelSelectionScreen.tsx
│   │   │   ├── ModelInputScreen.tsx
│   │   │   ├── ModelParametersScreen.tsx
│   │   │   ├── ContextLengthScreen.tsx
│   │   │   ├── ConnectionTestScreen.tsx
│   │   │   └── ConfirmationScreen.tsx
│   │   ├── hooks/                            # Custom hooks
│   │   │   ├── useModelSelectorState.ts
│   │   │   ├── useScreenNavigation.ts
│   │   │   └── useEscapeNavigation.ts
│   │   └── utils/                            # Utility functions
│   │       ├── model-fetching/
│   │       │   ├── index.ts
│   │       │   ├── anthropic.ts
│   │       │   ├── openai-compatible.ts
│   │       │   ├── gemini.ts
│   │       │   ├── ollama.ts
│   │       │   └── provider-specific.ts
│   │       ├── connection-testing/
│   │       │   ├── index.ts
│   │       │   ├── chat-endpoint.ts
│   │       │   ├── provider-specific.ts
│   │       │   └── gpt5.ts
│   │       └── formatters.ts
```

### 2. State Management
Move state management to a dedicated context or custom hook:
- Create `useModelSelectorState` hook to manage all state
- Consider using React Context for deeply nested components
- Separate state concerns where possible

### 3. Screen Components
Each screen will become its own component:
- Props will be passed from the main ModelSelector component
- Each screen will handle its specific UI and interactions
- Common UI elements will be extracted to shared components

### 4. Model Fetching Logic
Extract provider-specific model fetching functions:
- Create separate modules for each provider type
- Standardize the interface for model fetching functions
- Implement fallback strategies in dedicated utilities

### 5. Connection Testing
Separate connection testing logic:
- Create dedicated modules for different testing approaches
- Standardize test result interfaces
- Implement retry logic in utilities

### 6. Utility Functions
Extract reusable utility functions:
- Model formatting and display functions
- Number formatting utilities
- Provider label formatting
- Form field generation

## Implementation Steps

### Phase 1: Foundation
1. Create directory structure
2. Extract TypeScript types to `ModelSelector.types.ts`
3. Create main `ModelSelector.tsx` component skeleton
4. Set up state management hook/context

### Phase 2: Screen Components
1. Extract each screen to its own component
2. Ensure proper prop passing
3. Maintain current UI/UX

### Phase 3: Business Logic
1. Extract model fetching functions
2. Extract connection testing logic
3. Extract utility functions

### Phase 4: Integration & Testing
1. Integrate all components
2. Ensure functionality remains the same
3. Add tests for new modular components

## Benefits
1. **Maintainability**: Smaller, focused files are easier to understand and modify
2. **Testability**: Individual components and functions can be tested in isolation
3. **Collaboration**: Team members can work on different parts simultaneously
4. **Reusability**: Components and utilities can be reused elsewhere
5. **Performance**: Better code splitting potential

## Risks & Mitigations
1. **Breaking Changes**: Thorough testing to ensure functionality remains identical
2. **Increased Complexity**: Clear documentation and consistent patterns
3. **Migration Effort**: Phased approach to minimize disruption

## Success Criteria
1. All existing functionality preserved
2. File sizes reduced to <200 lines where possible
3. Improved code organization following project conventions
4. No performance degradation
5. Enhanced test coverage