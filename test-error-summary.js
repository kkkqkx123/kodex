#!/usr/bin/env node

/**
 * 测试错误摘要功能
 */

// 直接包含错误摘要函数进行测试
function summarizeError(error) {
  if (!(error instanceof Error)) {
    return {
      message: String(error),
      type: 'Unknown',
      suggestion: '请检查输入参数或重试操作'
    };
  }

  const errorName = error.name || 'Error';
  const errorMessage = error.message || '发生未知错误';
  
  const summary = {
    message: errorMessage,
    type: errorName
  };

  if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
    summary.suggestion = '请检查文件权限或使用管理员权限运行';
  } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
    summary.suggestion = '请检查网络连接或稍后重试';
  } else if (errorMessage.includes('file') || errorMessage.includes('File')) {
    summary.suggestion = '请检查文件路径是否正确或文件是否存在';
  } else if (errorMessage.includes('command') || errorMessage.includes('Command')) {
    summary.suggestion = '请检查命令语法或参数是否正确';
  } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    summary.suggestion = '操作超时，请稍后重试或增加超时时间';
  } else {
    summary.suggestion = '请检查操作参数或重试';
  }

  return summary;
}

function formatErrorBrief(error) {
  const summary = summarizeError(error);
  let output = `❌ ${summary.type}: ${summary.message}`;
  
  if (summary.suggestion) {
    output += `\n💡 ${summary.suggestion}`;
  }
  
  return output;
}

// 测试不同类型的错误
console.log('=== 错误摘要测试 ===\n');

// 1. 普通错误
const error1 = new Error('文件未找到: config.json');
console.log('1. 普通错误:');
console.log(formatErrorBrief(error1));
console.log();

// 2. 权限错误
const error2 = new Error('Permission denied: 无法访问文件');
console.log('2. 权限错误:');
console.log(formatErrorBrief(error2));
console.log();

// 3. 网络错误
const error3 = new Error('Network timeout: 连接超时');
console.log('3. 网络错误:');
console.log(formatErrorBrief(error3));
console.log();

// 4. 复杂错误对象
const error4 = {
  message: 'Command failed: git status',
  stderr: 'fatal: not a git repository',
  stdout: ''
};
Object.setPrototypeOf(error4, Error.prototype);
console.log('4. 复杂错误:');
console.log(formatErrorBrief(error4));
console.log();

// 5. 非错误对象
console.log('5. 非错误对象:');
console.log(formatErrorBrief('字符串错误'));
console.log();

console.log('=== 测试完成 ===');