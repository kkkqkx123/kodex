/**
 * 错误摘要工具
 * 提供简洁的错误信息输出，避免显示详细堆栈
 */

export interface ErrorSummary {
  message: string;
  type: string;
  suggestion?: string;
}

/**
 * 生成简洁的错误摘要
 */
export function summarizeError(error: unknown): ErrorSummary {
  if (!(error instanceof Error)) {
    return {
      message: String(error),
      type: 'Unknown',
      suggestion: '请检查输入参数或重试操作'
    };
  }

  const errorName = error.name || 'Error';
  const errorMessage = error.message || '发生未知错误';
  
  // 针对常见错误类型提供简洁摘要
  const summary: ErrorSummary = {
    message: errorMessage,
    type: errorName
  };

  // 根据错误类型提供建议
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

/**
 * 格式化错误为简洁字符串
 */
export function formatErrorBrief(error: unknown): string {
  const summary = summarizeError(error);
  let output = `❌ ${summary.type}: ${summary.message}`;
  
  if (summary.suggestion) {
    output += `\n💡 ${summary.suggestion}`;
  }
  
  return output;
}

/**
 * 格式化错误为单行摘要
 */
export function formatErrorSingleLine(error: unknown): string {
  const summary = summarizeError(error);
  return `${summary.type}: ${summary.message}`;
}

/**
 * 检查是否为非关键错误
 */
export function isNonCriticalError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const nonCriticalPatterns = [
    'timeout',
    'network',
    'file not found',
    'permission denied'
  ];
  
  const message = error.message.toLowerCase();
  return nonCriticalPatterns.some(pattern => message.includes(pattern));
}