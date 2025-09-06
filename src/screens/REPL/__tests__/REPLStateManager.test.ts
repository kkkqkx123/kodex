import { REPLStateManager } from '../REPLStateManager'

describe('REPLStateManager', () => {
  it('should initialize with correct initial state', () => {
    const manager = new REPLStateManager()
    const state = manager.getState()
    expect(state.messages).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.inputValue).toBe('')
  })

  it('should update state correctly', () => {
    const manager = new REPLStateManager()
    const listener = jest.fn()
    manager.subscribe(listener)

    manager.setMessages([{ id: '1', content: 'test' } as any])
    const state = manager.getState()
    expect(state.messages).toEqual([{ id: '1', content: 'test' } as any])
    expect(listener).toHaveBeenCalled()
  })

  it('should not notify listeners when state is the same', () => {
    const manager = new REPLStateManager()
    const listener = jest.fn()
    manager.subscribe(listener)

    // Set the same messages again
    manager.setMessages([])
    expect(listener).not.toHaveBeenCalled()
  })

  it('should handle input value separately', () => {
    const manager = new REPLStateManager()
    const listener = jest.fn()
    const inputListener = jest.fn()
    
    manager.subscribe(listener)
    manager.subscribeToInputState(inputListener)

    manager.setInputValue('test input')
    
    // Input listener should be called
    expect(inputListener).toHaveBeenCalledWith({
      value: 'test input',
      offset: 10,
      isComposing: false,
      selection: { start: 10, end: 10 }
    })
    
    // Main listener should not be called for input changes
    expect(listener).not.toHaveBeenCalled()
  })

  it('should batch update input state', () => {
    const manager = new REPLStateManager()
    const inputListener = jest.fn()
    manager.subscribeToInputState(inputListener)

    manager.batchUpdateInputState({
      value: 'test',
      offset: 2,
      selection: { start: 1, end: 3 }
    })

    expect(inputListener).toHaveBeenCalledWith({
      value: 'test',
      offset: 2,
      isComposing: false,
      selection: { start: 1, end: 3 }
    })
  })
})