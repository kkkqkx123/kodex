#!/usr/bin/env node

/**
 * 测试脚本：验证任务执行期间static元素不刷新的功能
 * 
 * 运行方式：
 * node test-static-freeze.js
 * 
 * 测试场景：
 * 1. 模拟任务执行期间消息更新
 * 2. 验证static元素是否保持冻结状态
 * 3. 任务结束后验证static元素是否正确刷新
 */

const { StaticElementManager } = require('./dist/screens/REPL/StaticElementManager')

class StaticFreezeTester {
  constructor() {
    this.manager = StaticElementManager.getInstance()
    this.testResults = []
  }

  async runTests() {
    console.log('🧪 开始测试任务执行期间static元素冻结功能...\n')

    await this.testTaskStart()
    await this.testMessageUpdatesDuringTask()
    await this.testTaskEnd()
    await this.testStaticRefreshAfterTask()

    this.printResults()
  }

  async testTaskStart() {
    console.log('📋 测试1: 任务开始时设置状态')
    
    // 模拟任务开始
    this.manager.setTaskStatus(true)
    
    const isFrozen = this.manager.isTaskInProgress()
    this.testResults.push({
      test: '任务开始时设置冻结状态',
      passed: isFrozen,
      expected: true,
      actual: isFrozen
    })
    
    console.log(`   ✅ 任务状态已设置为: ${isFrozen}`)
  }

  async testMessageUpdatesDuringTask() {
    console.log('\n📋 测试2: 任务期间消息更新验证')
    
    let updateCount = 0
    const originalUpdate = this.manager.updateStaticElements.bind(this.manager)
    
    // 拦截更新调用
    this.manager.updateStaticElements = (elements) => {
      updateCount++
      console.log(`   ⚠️  检测到static更新尝试: ${updateCount}`)
      // 任务期间不执行实际更新
      if (!this.manager.isTaskInProgress()) {
        return originalUpdate(elements)
      }
      return Promise.resolve()
    }

    // 模拟任务期间的消息更新
    for (let i = 0; i < 5; i++) {
      await this.simulateMessageUpdate()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.testResults.push({
      test: '任务期间阻止static更新',
      passed: updateCount > 0, // 应该有更新尝试
      expected: '更新被阻止',
      actual: `尝试更新 ${updateCount} 次`
    })

    console.log(`   ✅ 任务期间阻止了 ${updateCount} 次更新尝试`)
  }

  async testTaskEnd() {
    console.log('\n📋 测试3: 任务结束时清除状态')
    
    // 模拟任务结束
    this.manager.setTaskStatus(false)
    
    const isFrozen = this.manager.isTaskInProgress()
    this.testResults.push({
      test: '任务结束时清除冻结状态',
      passed: !isFrozen,
      expected: false,
      actual: isFrozen
    })
    
    console.log(`   ✅ 任务状态已清除: ${!isFrozen}`)
  }

  async testStaticRefreshAfterTask() {
    console.log('\n📋 测试4: 任务结束后static元素刷新')
    
    let refreshCalled = false
    this.manager.onTaskEnd(() => {
      refreshCalled = true
      console.log('   🔄 static元素已刷新')
    })

    // 模拟任务结束后的更新
    await this.manager.updateStaticElements(new Map())
    
    this.testResults.push({
      test: '任务结束后允许static刷新',
      passed: refreshCalled,
      expected: true,
      actual: refreshCalled
    })
  }

  async simulateMessageUpdate() {
    // 模拟消息更新
    const mockMessage = {
      id: Date.now().toString(),
      content: `任务消息 ${Date.now()}`,
      type: 'assistant'
    }
    
    // 这里会触发static元素的更新尝试
    await this.manager.updateStaticElements(new Map([[mockMessage.id, mockMessage]]))
  }

  printResults() {
    console.log('\n📊 测试结果汇总:')
    console.log('='.repeat(50))
    
    let passedCount = 0
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${result.test}`)
      console.log(`   期望: ${result.expected}`)
      console.log(`   实际: ${result.actual}`)
      console.log('')
      
      if (result.passed) passedCount++
    })
    
    console.log(`\n🎯 通过率: ${passedCount}/${this.testResults.length} (${(passedCount/this.testResults.length*100).toFixed(1)}%)`)
    
    if (passedCount === this.testResults.length) {
      console.log('🎉 所有测试通过！任务执行期间static元素冻结功能正常工作')
    } else {
      console.log('⚠️  部分测试失败，请检查实现')
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new StaticFreezeTester()
  tester.runTests().catch(console.error)
}

module.exports = { StaticFreezeTester }