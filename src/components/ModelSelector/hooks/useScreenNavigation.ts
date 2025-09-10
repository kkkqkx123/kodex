import { useState } from 'react'
import { ScreenType } from '../ModelSelector.types'

export const useScreenNavigation = () => {
  // Screen navigation stack
  const [screenStack, setScreenStack] = useState<ScreenType[]>(['provider'])

  // Current screen is always the last item in the stack
  const currentScreen = screenStack[screenStack.length - 1]

  // Function to navigate to a new screen
  const navigateTo = (screen: ScreenType) => {
    setScreenStack(prev => [...prev, screen])
  }

  // Function to go back to the previous screen
  const goBack = () => {
    if (screenStack.length > 1) {
      // Remove the current screen from the stack
      setScreenStack(prev => prev.slice(0, -1))
    }
  }

  return {
    currentScreen,
    navigateTo,
    goBack,
    screenStack,
    setScreenStack,
  }
}