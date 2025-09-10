/**
 * Static元素管理器
 * 确保任务执行过程中static元素不再刷新，直到任务结束才统一刷新
 */

import { useRef, useEffect, useState } from 'react'

export interface StaticElementManagerState {
  isTaskInProgress: boolean
  pendingStaticUpdates: Array<{
    type: 'add' | 'update' | 'remove'
    key: string
    element: any
  }>
}

export class StaticElementManager {
  private static instance: StaticElementManager | null = null
  private listeners: Array<(state: StaticElementManagerState) => void> = []
  private state: StaticElementManagerState = {
    isTaskInProgress: false,
    pendingStaticUpdates: []
  }

  static getInstance(): StaticElementManager {
    if (!StaticElementManager.instance) {
      StaticElementManager.instance = new StaticElementManager()
    }
    return StaticElementManager.instance
  }

  setTaskStatus(inProgress: boolean): void {
    this.state.isTaskInProgress = inProgress
    
    // 如果任务结束，处理所有挂起的static更新
    if (!inProgress) {
      this.processPendingUpdates()
    }
    
    this.notifyListeners()
  }

  addStaticUpdate(type: 'add' | 'update' | 'remove', key: string, element?: any): void {
    if (this.state.isTaskInProgress) {
      // 任务进行中，缓存更新
      this.state.pendingStaticUpdates.push({ type, key, element })
    } else {
      // 任务未进行，立即处理
      this.processStaticUpdate(type, key, element)
    }
  }

  private processPendingUpdates(): void {
    this.state.pendingStaticUpdates.forEach(update => {
      this.processStaticUpdate(update.type, update.key, update.element)
    })
    this.state.pendingStaticUpdates = []
  }

  private processStaticUpdate(type: 'add' | 'update' | 'remove', key: string, element?: any): void {
    // 这里可以触发实际的static元素更新
    // 具体实现将在组件中使用
    console.log(`Processing static update: ${type} ${key}`)
  }

  subscribe(listener: (state: StaticElementManagerState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  getCurrentState(): StaticElementManagerState {
    return { ...this.state }
  }
}

// React Hook for easy usage
export const useStaticElementManager = () => {
  const [state, setState] = useState(() => StaticElementManager.getInstance().getCurrentState())
  
  useEffect(() => {
    const unsubscribe = StaticElementManager.getInstance().subscribe(setState)
    return unsubscribe
  }, [])
  
  return {
    ...state,
    setTaskStatus: (inProgress: boolean) => StaticElementManager.getInstance().setTaskStatus(inProgress),
    addStaticUpdate: (type: 'add' | 'update' | 'remove', key: string, element?: any) => 
      StaticElementManager.getInstance().addStaticUpdate(type, key, element)
  }
}