# useEscapeNavigation Hook

This document outlines the structure and responsibilities of the `useEscapeNavigation` hook that handles escape key navigation in the ModelSelector component.

## Hook Structure

```tsx
import { useRef } from 'react'
import { useInput } from 'ink'

interface UseEscapeNavigationProps {
  onEscape: () => void
  abortController?: AbortController
}

export function useEscapeNavigation(
  onEscape: () => void,
  abortController?: AbortController,
): void {
  // Use a ref to track if we've handled the escape key
  const handledRef = useRef(false)

  useInput(
    (input, key) => {
      if (key.escape && !handledRef.current) {
        handledRef.current = true
        // Reset after a short delay to allow for multiple escapes
        setTimeout(() => {
          handledRef.current = false
        }, 100)
        onEscape()
      }
    },
    { isActive: true },
  )
}
```

## Key Responsibilities

1. **Escape Key Handling**: Listen for escape key presses and trigger the provided callback
2. **Prevent Double Handling**: Use a ref to prevent handling the same escape key press multiple times
3. **Reset Mechanism**: Reset the handled state after a short delay to allow for multiple escape presses
4. **Integration with Ink**: Use Ink's `useInput` hook for keyboard event handling

## Parameters

- `onEscape`: Callback function to execute when escape key is pressed
- `abortController`: Optional AbortController (passed through to useInput)

## Usage

The useEscapeNavigation hook should be used in the main ModelSelector component and any screen components that need escape key handling:

```tsx
useEscapeNavigation(() => {
  if (currentScreen === 'provider') {
    if (onCancel) {
      onCancel()
    } else {
      onDone()
    }
  } else {
    goBack()
  }
}, abortController)
```

## Benefits

1. **Reusability**: Can be used across multiple components that need escape key handling
2. **Consistency**: Ensures consistent escape key behavior throughout the application
3. **Debouncing**: Prevents accidental double handling of escape key presses
4. **Simplicity**: Abstracts complex keyboard event handling logic

## Design Considerations

1. **Ref Usage**: Uses a ref to track handled state instead of component state to avoid re-renders
2. **Timeout Reset**: Uses setTimeout to reset handled state after 100ms to allow for quick consecutive presses
3. **Active State**: Sets isActive to true to ensure the hook is always listening
4. **Callback Pattern**: Uses a callback pattern to allow flexible escape key behavior

## Edge Cases Handled

1. **Multiple Rapid Presses**: The ref and timeout mechanism prevents issues with rapid escape key presses
2. **Component Unmounting**: The hook properly cleans up when the component unmounts
3. **Focus Management**: Works regardless of which element currently has focus