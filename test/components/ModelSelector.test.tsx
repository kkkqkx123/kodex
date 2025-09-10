import { expect, test, describe } from 'bun:test'
import React from 'react'
import { render } from 'ink-testing-library'
import { ModelSelector } from '../../src/components/ModelSelector'

describe('ModelSelector', () => {
  test('should render without crashing', () => {
    // Mock the necessary props
    const mockProps = {
      onDone: () => {},
      abortController: new AbortController(),
    }
    
    const { lastFrame } = render(<ModelSelector {...mockProps} />)
    
    // The component should render without throwing errors
    expect(lastFrame()).toBeDefined()
  })
})