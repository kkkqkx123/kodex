# ScreenContainer Component

This document outlines the structure and responsibilities of the `ScreenContainer` component that provides a consistent wrapper for all screens in the ModelSelector.

## Component Structure

```tsx
import React from 'react'
import { Box, Text } from 'ink'
import { getTheme } from '../../utils/theme'

interface ScreenContainerProps {
  title: string
  exitState: { pending: boolean; keyName: string }
  children: React.ReactNode
}

export function ScreenContainer({
  title,
  exitState,
  children,
}: ScreenContainerProps): React.ReactElement {
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
```

## Key Responsibilities

1. **Consistent Styling**: Provide a uniform border and padding for all screens
2. **Title Display**: Show the screen title with optional exit instructions
3. **Theme Integration**: Use the application theme for consistent styling
4. **Layout Management**: Handle basic layout with flexbox properties

## Props

- `title`: The title to display at the top of the screen
- `exitState`: Object containing exit state information
  - `pending`: Boolean indicating if exit is pending
  - `keyName`: The key name to display for exit confirmation
- `children`: The content to display within the container

## Usage

The ScreenContainer component should be used as a wrapper for all screen components to ensure consistent styling and layout:

```tsx
<ScreenContainer 
  title="Provider Selection" 
  exitState={exitState}
>
  <Box flexDirection="column" gap={1}>
    {/* Screen-specific content */}
  </Box>
</ScreenContainer>
```

## Benefits

1. **Consistency**: Ensures all screens have the same visual appearance
2. **Maintainability**: Centralizes styling logic in one component
3. **Reusability**: Can be used across all screen components
4. **Theme Support**: Integrates with the application's theme system
5. **Flexibility**: Accepts any content through children prop

## Design Considerations

1. **Minimal Props**: Only accepts essential props to keep the API simple
2. **Theme Integration**: Uses the existing theme system for colors
3. **Accessibility**: Exit instructions are clearly displayed when relevant
4. **Responsive**: Uses flexbox for responsive layout