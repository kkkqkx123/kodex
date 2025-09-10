import { useCallback } from 'react'
import type { CompletionState, CompletionContext, UnifiedSuggestion } from './types'
import * as React from 'react'

export class CompletionStateUtility {
  // State update helpers - clean and simple
  updateState = useCallback((
    setState: React.Dispatch<React.SetStateAction<CompletionState>>,
    updates: Partial<CompletionState>
  ) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  resetCompletion = useCallback((
    setState: React.Dispatch<React.SetStateAction<CompletionState>>
  ) => {
    setState(prev => ({
      ...prev,
      suggestions: [],
      selectedIndex: 0,
      isActive: false,
      context: null,
      preview: null,
      emptyDirMessage: ''
    }))
  }, [])

  activateCompletion = useCallback((
    setState: React.Dispatch<React.SetStateAction<CompletionState>>,
    suggestions: UnifiedSuggestion[],
    context: CompletionContext
  ) => {
    setState(prev => ({
      ...prev,
      suggestions: suggestions,
      selectedIndex: 0,
      isActive: true,
      context,
      preview: null
    }))
  }, [])

  // Handle Tab key - simplified and unified
  handleTabKey = useCallback(async (
    input: string,
    state: CompletionState,
    context: CompletionContext | null,
    generateSuggestions: (context: CompletionContext) => UnifiedSuggestion[],
    completeWith: (suggestion: UnifiedSuggestion, context: CompletionContext) => void,
    setState: React.Dispatch<React.SetStateAction<CompletionState>>,
    onInputChange: (value: string) => void,
    setCursorOffset: (offset: number) => void
  ): Promise<boolean> => {
    if (!context) return false

    // If menu is already showing, cycle through suggestions
    if (state.isActive && state.suggestions.length > 0) {
      const nextIndex = (state.selectedIndex + 1) % state.suggestions.length
      const nextSuggestion = state.suggestions[nextIndex]

      if (state.context) {
        // Calculate proper word boundaries
        const currentWord = input.slice(state.context.startPos)
        const wordEnd = currentWord.search(/\s/)
        const actualEndPos = wordEnd === -1
          ? input.length
          : state.context.startPos + wordEnd

        // Apply appropriate prefix based on context type and suggestion type
        let preview: string
        if (state.context.type === 'command') {
          preview = `/${nextSuggestion.value}`
        } else if (state.context.type === 'agent') {
          preview = `#${nextSuggestion.value}`
        } else if (nextSuggestion.isSmartMatch) {
          preview = `#${nextSuggestion.value}`
        } else {
          preview = nextSuggestion.value
        }

        // Apply preview
        const newInput = input.slice(0, state.context.startPos) +
          preview +
          input.slice(actualEndPos)

        onInputChange(newInput)
        setCursorOffset(state.context.startPos + preview.length)

        // Update state
        this.updateState(setState, {
          selectedIndex: nextIndex,
          preview: {
            isActive: true,
            originalInput: input,
            wordRange: [state.context.startPos, state.context.startPos + preview.length]
          }
        })
      }
      return true
    }

    // Generate new suggestions
    const currentSuggestions = generateSuggestions(context)

    if (currentSuggestions.length === 0) {
      return false
    } else if (currentSuggestions.length === 1) {
      // Single match: complete immediately
      completeWith(currentSuggestions[0], context)
      return true
    } else {
      // Show menu and apply first suggestion
      await this.activateCompletion(setState, currentSuggestions, context)

      // Immediately apply first suggestion as preview
      const firstSuggestion = currentSuggestions[0]
      const currentWord = input.slice(context.startPos)
      const wordEnd = currentWord.search(/\s/)
      const actualEndPos = wordEnd === -1
        ? input.length
        : context.startPos + wordEnd

      let preview: string
      if (context.type === 'command') {
        preview = `/${firstSuggestion.value}`
      } else if (context.type === 'agent') {
        preview = `#${firstSuggestion.value}`
      } else if (firstSuggestion.isSmartMatch) {
        preview = `#${firstSuggestion.value}`
      } else {
        preview = firstSuggestion.value
      }

      const newInput = input.slice(0, context.startPos) +
        preview +
        input.slice(actualEndPos)

      onInputChange(newInput)
      setCursorOffset(context.startPos + preview.length)

      this.updateState(setState, {
        preview: {
          isActive: true,
          originalInput: input,
          wordRange: [context.startPos, context.startPos + preview.length]
        }
      })

      return true
    }
  }, [this.updateState, this.activateCompletion])

  // Handle navigation keys
  handleNavigationKeys = useCallback((
    input: string,
    key: any,
    state: CompletionState,
    onInputChange: (value: string) => void,
    setCursorOffset: (offset: number) => void,
    setState: React.Dispatch<React.SetStateAction<CompletionState>>,
    completeWith: (suggestion: UnifiedSuggestion, context: CompletionContext) => void,
    generateSuggestions: (context: CompletionContext) => UnifiedSuggestion[],
    resetCompletion: () => void
  ): boolean => {
    // Enter key - confirm selection
    if (key.return && state.isActive && state.suggestions.length > 0) {
      const selectedSuggestion = state.suggestions[state.selectedIndex]
      if (selectedSuggestion && state.context) {
        let completion: string

        if (state.context.type === 'command') {
          completion = `/${selectedSuggestion.value} `
        } else if (state.context.type === 'agent') {
          if (selectedSuggestion.type === 'agent') {
            completion = `#${selectedSuggestion.value} `
          } else if (selectedSuggestion.type === 'ask') {
            completion = `#${selectedSuggestion.value} `
          } else {
            completion = `#${selectedSuggestion.value} `
          }
        } else if (selectedSuggestion.isSmartMatch) {
          completion = `#${selectedSuggestion.value} `
        } else {
          completion = selectedSuggestion.value + ' '
        }

        const currentWord = input.slice(state.context.startPos)
        const nextSpaceIndex = currentWord.indexOf(' ')
        const actualEndPos = nextSpaceIndex === -1 ? input.length : state.context.startPos + nextSpaceIndex

        const newInput = input.slice(0, state.context.startPos) + completion + input.slice(actualEndPos)
        
        // 立即清除补全状态，避免UI延迟
        resetCompletion()
        
        // 然后更新输入框
        onInputChange(newInput)
        setCursorOffset(state.context.startPos + completion.length)
      }
      return true
    }

    if (!state.isActive || state.suggestions.length === 0) return false

    // Arrow key navigation with preview
    const handleNavigation = (newIndex: number) => {
      const preview = state.suggestions[newIndex].value

      if (state.preview?.isActive && state.context) {
        const newInput = input.slice(0, state.context.startPos) +
          preview +
          input.slice(state.preview.wordRange[1])

        onInputChange(newInput)
        setCursorOffset(state.context.startPos + preview.length)

        this.updateState(setState, {
          selectedIndex: newIndex,
          preview: {
            ...state.preview,
            wordRange: [state.context.startPos, state.context.startPos + preview.length]
          }
        })
      } else {
        this.updateState(setState, { selectedIndex: newIndex })
      }
    }

    if (key.downArrow) {
      const nextIndex = (state.selectedIndex + 1) % state.suggestions.length
      handleNavigation(nextIndex)
      return true
    }

    if (key.upArrow) {
      const nextIndex = state.selectedIndex === 0
        ? state.suggestions.length - 1
        : state.selectedIndex - 1
      handleNavigation(nextIndex)
      return true
    }

    // Space key - complete and potentially continue for directories
    if (key.space && state.isActive && state.suggestions.length > 0) {
      const selectedSuggestion = state.suggestions[state.selectedIndex]
      const isDirectory = selectedSuggestion.value.endsWith('/')

      if (!state.context) return false

      // 立即清除补全状态，避免UI延迟
      resetCompletion()
      completeWith(selectedSuggestion, state.context)

      if (isDirectory) {
        setTimeout(async () => {
          const newContext = {
            ...state.context,
            prefix: selectedSuggestion.value,
            endPos: state.context.startPos + selectedSuggestion.value.length
          }

          const newSuggestions = generateSuggestions(newContext)

          if (newSuggestions.length > 0) {
            await this.activateCompletion(setState, newSuggestions, newContext)
          } else {
            this.updateState(setState, {
              emptyDirMessage: `Directory is empty: ${selectedSuggestion.value}`
            })
            setTimeout(() => this.updateState(setState, { emptyDirMessage: '' }), 3000)
          }
        }, 50)
      }

      return true
    }

    // Escape key
    if (key.escape) {
      if (state.preview?.isActive && state.context) {
        onInputChange(state.preview.originalInput)
        setCursorOffset(state.context.startPos + state.context.prefix.length)
      }
      resetCompletion()
      return true
    }

    return false
  }, [this.updateState, this.activateCompletion])

  // Handle delete/backspace keys
  handleDeleteKeys = useCallback((
    key: any,
    state: CompletionState,
    setState: React.Dispatch<React.SetStateAction<CompletionState>>,
    resetCompletion: () => void,
    input: string
  ): boolean => {
    if (key.backspace || key.delete) {
      if (state.isActive) {
        resetCompletion()
        // Smart suppression based on input complexity
        const suppressionTime = input.length > 10 ? 200 : 100
        this.updateState(setState, {
          suppressUntil: Date.now() + suppressionTime
        })
        return true
      }
    }
    return false
  }, [this.updateState])
}