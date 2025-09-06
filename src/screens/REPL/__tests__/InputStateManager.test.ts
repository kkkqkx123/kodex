import { InputStateManager } from '../InputStateManager'

describe('InputStateManager', () => {
  it('should initialize with correct initial value', () => {
    const manager = new InputStateManager('test')
    expect(manager.getState().value).toBe('test')
    expect(manager.getState().offset).toBe(4)
  })

  it('should update state correctly', () => {
    const manager = new InputStateManager('')
    const listener = jest.fn()
    manager.subscribe(listener)

    manager.setValue('new value')
    expect(manager.getState().value).toBe('new value')
    expect(listener).toHaveBeenCalledWith({
      value: 'new value',
      offset: 9,
      isComposing: false,
      selection: { start: 9, end: 9 }
    })
  })

  it('should not notify listeners when value is the same', () => {
    const manager = new InputStateManager('test')
    const listener = jest.fn()
    manager.subscribe(listener)

    manager.setValue('test')
    expect(listener).not.toHaveBeenCalled()
  })

  it('should handle multiple listeners', () => {
    const manager = new InputStateManager('')
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    
    manager.subscribe(listener1)
    manager.subscribe(listener2)
    
    manager.setValue('test')
    
    expect(listener1).toHaveBeenCalledWith({
      value: 'test',
      offset: 4,
      isComposing: false,
      selection: { start: 4, end: 4 }
    })
    expect(listener2).toHaveBeenCalledWith({
      value: 'test',
      offset: 4,
      isComposing: false,
      selection: { start: 4, end: 4 }
    })
  })

  it('should unsubscribe correctly', () => {
    const manager = new InputStateManager('')
    const listener = jest.fn()
    const unsubscribe = manager.subscribe(listener)
    
    manager.setValue('test')
    expect(listener).toHaveBeenCalledTimes(1)
    
    unsubscribe()
    manager.setValue('new test')
    expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
  })
})