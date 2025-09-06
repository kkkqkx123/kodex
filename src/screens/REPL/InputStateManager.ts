import { type UnsubscribeFunction } from '../REPL.types'

export interface InputState {
  value: string
  offset: number
  isComposing: boolean
  selection: { start: number; end: number }
}

type InputStateListener = (state: InputState) => void

export class InputStateManager {
  private state: InputState
  private listeners: Set<InputStateListener> = new Set()

  constructor(initialValue: string = '') {
    this.state = {
      value: initialValue,
      offset: initialValue.length,
      isComposing: false,
      selection: { start: initialValue.length, end: initialValue.length }
    }
  }

  getState(): InputState {
    return { ...this.state }
  }

  updateState(updater: (prev: InputState) => InputState): void {
    const newState = updater(this.state)
    
    // 浅比较状态，避免不必要的更新
    if (!this.shallowEqual(this.state, newState)) {
      this.state = newState
      this.notifyListeners()
    }
  }

  private shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true
    if (obj1 === null || obj2 === null) return obj1 === obj2
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
      if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
        return false
      }
    }

    return true
  }

  subscribe(listener: InputStateListener): UnsubscribeFunction {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  // 便捷方法用于特定状态更新
  setValue(value: string): void {
    this.updateState(prev => ({
      ...prev,
      value
      // 注意：这里不自动更新光标位置，由 useTextInput 负责管理光标位置
    }))
  }

  setOffset(offset: number): void {
    this.updateState(prev => ({ ...prev, offset }))
  }

  setIsComposing(isComposing: boolean): void {
    this.updateState(prev => ({ ...prev, isComposing }))
  }

  setSelection(selection: { start: number; end: number }): void {
    this.updateState(prev => ({ ...prev, selection }))
  }

  // 批量更新方法，避免多次触发监听器
  batchUpdate(updates: Partial<InputState>): void {
    this.updateState(prev => ({ ...prev, ...updates }))
  }
}