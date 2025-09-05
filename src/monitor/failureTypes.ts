/**
 * 工具调用失败类型定义和检测
 */

export enum FailureType {
  /** 格式错误 */
  FORMAT_ERROR = 'format_error',
  
  /** diff反复 */
  DIFF_REPETITIVE = 'diff_repetitive',
  
  /** 其他类型错误 */
  OTHER = 'other',
  
  /** 非错误（成功或不相关响应）*/
  NON_ERROR = 'non_error'
}

/**
 * 检查工具调用结果内容的失败类型
 * @param content 工具调用结果内容
 * @param previousFailures 之前的失败记录（用于检测diff反复）
 * @returns 失败类型
 */
export function checkFailureType(content: string, previousFailures: string[] = []): FailureType {
  // 检查是否为格式错误
  if (isFormatError(content)) {
    return FailureType.FORMAT_ERROR;
  }
  
  // 检查是否为diff反复
  if (isDiffRepetitive(content, previousFailures)) {
    return FailureType.DIFF_REPETITIVE;
  }
  
  // 检查是否为错误
  if (isError(content)) {
    return FailureType.OTHER;
  }
  
  // 非错误
  return FailureType.NON_ERROR;
}

/**
 * 判断是否为格式错误
 * @param content 工具调用结果内容
 * @returns 是否为格式错误
 */
function isFormatError(content: string): boolean {
  // 检查常见的格式错误关键词
  const formatErrorKeywords = [
    'InputValidationError',
    'invalid input',
    'input validation failed',
    'zod error',
    'validation error'
  ];
  
  return formatErrorKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 判断是否为diff反复
 * @param content 工具调用结果内容
 * @param previousFailures 之前的失败记录
 * @returns 是否为diff反复
 */
function isDiffRepetitive(content: string, previousFailures: string[]): boolean {
  // 如果没有之前的失败记录，则不可能是反复
  if (previousFailures.length === 0) {
    return false;
  }
  
  // 检查是否与之前的失败内容相似
  // 这里使用简单的字符串包含检查，实际实现可能需要更复杂的相似度算法
  return previousFailures.some(prev => 
    content.length > 20 && prev.length > 20 && 
    (content.includes(prev.substring(0, 20)) || prev.includes(content.substring(0, 20)))
  );
}

/**
 * 判断是否为错误
 * @param content 工具调用结果内容
 * @returns 是否为错误
 */
function isError(content: string): boolean {
  // 检查是否标记为错误
  if (content.includes('is_error: true')) {
    return true;
  }
  
  // 检查常见的错误关键词
  const errorKeywords = [
    'error',
    'exception',
    'failed',
    'failure'
  ];
  
  return errorKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 工具调用结果记录
 */
export interface ToolCallResultRecord {
  /** 工具调用ID */
  id: string;
  
  /** 工具名称 */
  name: string;
  
  /** 工具调用结果内容 */
  content: string;
  
  /** 调用时间戳 */
  timestamp: number;
  
  /** 是否为错误 */
  is_error: boolean;
  
  /** 关联的响应ID */
  responseId?: string;
}