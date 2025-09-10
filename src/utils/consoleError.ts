/**
 * 统一控制台错误输出
 * 提供简洁的错误信息展示
 */

import { formatErrorSingleLine } from './errorSummary';

/**
 * 统一的错误输出函数
 */
export function printError(error: unknown, context?: string): void {
  const message = formatErrorSingleLine(error);
  const prefix = context ? `[${context}] ` : '';
  console.error(`❌ ${prefix}${message}`);
}

/**
 * 警告输出函数
 */
export function printWarning(message: string, context?: string): void {
  const prefix = context ? `[${context}] ` : '';
  console.warn(`⚠️  ${prefix}${message}`);
}

/**
 * 信息输出函数
 */
export function printInfo(message: string, context?: string): void {
  const prefix = context ? `[${context}] ` : '';
  console.info(`ℹ️  ${prefix}${message}`);
}

/**
 * 静默错误处理 - 只记录不显示
 */
export function silentError(error: unknown, context?: string): void {
  // 只在调试模式下输出
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--debug')) {
    const message = formatErrorSingleLine(error);
    const prefix = context ? `[${context}] ` : '';
    console.error(`🐛 ${prefix}${message}`);
  }
}