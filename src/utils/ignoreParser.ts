import * as fs from 'fs';
import * as path from 'path';
import { minimatch } from 'minimatch';

/**
 * Normalize path for Git Bash environment
 * Converts Unix-style paths back to Windows paths when in Git Bash
 */
function normalizePathForFs(p: string): string {
  if (process.platform === 'win32' && process.env.MSYSTEM?.includes('MINGW')) {
    // Convert Unix-style path (/d/path/to/file) back to Windows path (D:\path\to\file)
    if (p.startsWith('/') && /^[a-z]/.test(p.substring(1))) {
      const driveLetter = p.substring(1, 2).toUpperCase();
      const restOfPath = p.substring(2).replace(/\//g, '\\');
      return `${driveLetter}:${restOfPath}`;
    }
    // Fix paths that start with single backslash (incorrect normalization)
    if (p.startsWith('\\') && p.length > 1 && /^[a-z]/.test(p.substring(1, 2))) {
      const driveLetter = p.substring(1, 2).toUpperCase();
      const restOfPath = p.substring(2);
      return `${driveLetter}:${restOfPath}`;
    }
  }
  return p;
}

export interface IgnoreRule {
  pattern: string;
  basePath: string;
  isNegation: boolean;
  isDirectory: boolean;
}

export class IgnoreParser {
  private rules: Map<string, IgnoreRule[]> = new Map();
  private cache = new Map<string, IgnoreRule[]>();
  private projectRoot: string | null = null;

  /**
   * 扫描目录中的所有.gitignore和.kodeignore文件
   */
  async scanIgnoreFiles(rootPath: string): Promise<void> {
    this.rules.clear();
    this.cache.clear();
    this.projectRoot = rootPath;
    await this.scanDirectory(rootPath);
  }

  /**
   * 刷新所有忽略规则
   */
  async refreshIgnoreRules(rootPath: string): Promise<{
    success: boolean;
    filesScanned: number;
    rulesLoaded: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    try {
      this.rules.clear();
      this.cache.clear();
      this.projectRoot = rootPath;
      
      const result = await this.scanDirectoryWithStats(rootPath);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        filesScanned: result.filesScanned,
        rulesLoaded: result.rulesLoaded,
        duration
      };
    } catch (error) {
      console.warn(`刷新ignore规则失败: ${error}`);
      return {
        success: false,
        filesScanned: 0,
        rulesLoaded: 0,
        duration: Date.now() - startTime
      };
    }
  }

  private async scanDirectoryWithStats(dirPath: string): Promise<{
    filesScanned: number;
    rulesLoaded: number;
  }> {
    let filesScanned = 0;
    let rulesLoaded = 0;

    try {
      // Normalize path for file system operations in Git Bash
      const normalizedDirPath = normalizePathForFs(dirPath);
      
      // Check if the normalized path exists
      if (!fs.existsSync(normalizedDirPath)) {
        // If it doesn't exist, try the original path
        if (fs.existsSync(dirPath)) {
          // Use original path if it exists
          const files = fs.readdirSync(dirPath, { withFileTypes: true });
          return await this.processDirectoryFilesWithStats(dirPath, files);
        } else {
          console.warn(`[DEBUG] Directory does not exist: ${dirPath} (normalized: ${normalizedDirPath})`);
          return { filesScanned, rulesLoaded };
        }
      }
      
      const files = fs.readdirSync(normalizedDirPath, { withFileTypes: true });
      return await this.processDirectoryFilesWithStats(dirPath, files);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EACCES') {
        console.warn(`扫描目录失败: ${dirPath}`, error);
      }
      return { filesScanned, rulesLoaded };
    }
  }

  /**
   * 处理目录中的文件并返回统计信息
   */
  private async processDirectoryFilesWithStats(dirPath: string, files: fs.Dirent[]): Promise<{
    filesScanned: number;
    rulesLoaded: number;
  }> {
    let filesScanned = 0;
    let rulesLoaded = 0;
    
    // 处理当前目录的ignore文件
    const gitignorePath = path.join(dirPath, '.gitignore');
    const kodeignorePath = path.join(dirPath, '.kodeignore');

    if (fs.existsSync(normalizePathForFs(gitignorePath))) {
      const rules = this.parseIgnoreFile(gitignorePath, dirPath);
      this.rules.set(gitignorePath, rules);
      filesScanned++;
      rulesLoaded += rules.length;
    }

    if (fs.existsSync(normalizePathForFs(kodeignorePath))) {
      const rules = this.parseIgnoreFile(kodeignorePath, dirPath);
      this.rules.set(kodeignorePath, rules);
      filesScanned++;
      rulesLoaded += rules.length;
    }

    // 递归处理子目录
    for (const file of files) {
      if (file.isDirectory() && !this.shouldSkipDirectory(file.name)) {
        const subDirPath = path.join(dirPath, file.name);
        const subResult = await this.scanDirectoryWithStats(subDirPath);
        filesScanned += subResult.filesScanned;
        rulesLoaded += subResult.rulesLoaded;
      }
    }

    return { filesScanned, rulesLoaded };
  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      // Normalize path for file system operations in Git Bash
      const normalizedDirPath = normalizePathForFs(dirPath);
      
      // Check if the normalized path exists
      if (!fs.existsSync(normalizedDirPath)) {
        // If it doesn't exist, try the original path
        if (fs.existsSync(dirPath)) {
          // Use original path if it exists
          const files = fs.readdirSync(dirPath, { withFileTypes: true });
          this.processDirectoryFiles(dirPath, files);
          return;
        } else {
          console.warn(`[DEBUG] Directory does not exist: ${dirPath} (normalized: ${normalizedDirPath})`);
          return;
        }
      }
      
      const files = fs.readdirSync(normalizedDirPath, { withFileTypes: true });
      this.processDirectoryFiles(dirPath, files);
    } catch (error) {
      // 忽略权限错误等
      if ((error as NodeJS.ErrnoException).code !== 'EACCES') {
        console.warn(`扫描目录失败: ${dirPath}`, error);
      }
    }
  }

  /**
   * 处理目录中的文件
   */
  private async processDirectoryFiles(dirPath: string, files: fs.Dirent[]): Promise<void> {
    // 处理当前目录的ignore文件
    const gitignorePath = path.join(dirPath, '.gitignore');
    const kodeignorePath = path.join(dirPath, '.kodeignore');

    if (fs.existsSync(normalizePathForFs(gitignorePath))) {
      const rules = this.parseIgnoreFile(gitignorePath, dirPath);
      this.rules.set(gitignorePath, rules);
    }

    if (fs.existsSync(normalizePathForFs(kodeignorePath))) {
      const rules = this.parseIgnoreFile(kodeignorePath, dirPath);
      this.rules.set(kodeignorePath, rules);
    }

    // 递归处理子目录
    for (const file of files) {
      if (file.isDirectory() && !this.shouldSkipDirectory(file.name)) {
        const subDirPath = path.join(dirPath, file.name);
        await this.scanDirectory(subDirPath);
      }
    }
  }

  /**
   * 是否应该跳过目录扫描
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules', '.git', '.svn', '.hg',
      'dist', 'build', 'coverage',
      '.next', '.nuxt', '.cache'
    ];
    return skipDirs.includes(dirName.toLowerCase());
  }

  /**
   * 解析ignore文件
   */
  private parseIgnoreFile(filePath: string, basePath: string): IgnoreRule[] {
    try {
      // Normalize path for file system operations in Git Bash
      const normalizedFilePath = normalizePathForFs(filePath);
      const content = fs.readFileSync(normalizedFilePath, 'utf8');
      const lines = content.split('\n');
      
      return lines
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(pattern => this.parsePattern(pattern, basePath))
        .filter(rule => rule !== null) as IgnoreRule[];
    } catch (error) {
      console.warn(`解析ignore文件失败: ${filePath}`, error);
      return [];
    }
  }

  /**
   * 解析单个模式
   */
  private parsePattern(pattern: string, basePath: string): IgnoreRule | null {
    let cleanPattern = pattern.trim();
    if (!cleanPattern || cleanPattern.startsWith('#')) {
      return null;
    }

    const isNegation = cleanPattern.startsWith('!');
    if (isNegation) {
      cleanPattern = cleanPattern.substring(1);
    }

    const isDirectory = cleanPattern.endsWith('/');
    if (isDirectory) {
      cleanPattern = cleanPattern.slice(0, -1);
    }

    // 处理相对路径
    if (cleanPattern.startsWith('./')) {
      cleanPattern = cleanPattern.substring(2);
    }

    return {
      pattern: cleanPattern,
      basePath,
      isNegation,
      isDirectory
    };
  }

  /**
   * 检查文件是否应该被忽略
   */
  shouldIgnore(filePath: string, isDirectory?: boolean): boolean {
    if (!this.projectRoot) {
      throw new Error('Project root not set. Call scanIgnoreFiles first.');
    }

    const fullPath = path.resolve(filePath);
    
    // 如果没有明确指定isDirectory，自动检测
    if (isDirectory === undefined) {
      try {
        isDirectory = fs.existsSync(normalizePathForFs(fullPath)) && fs.statSync(normalizePathForFs(fullPath)).isDirectory();
      } catch {
        isDirectory = false;
      }
    }
    
    let result = false;

    // 收集所有规则（按文件顺序应用）
    const allRules: IgnoreRule[] = [];
    
    // 按文件名排序，确保.gitignore在.kodeignore之前
    const sortedRules = Array.from(this.rules.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    for (const [ignoreFilePath, rules] of sortedRules) {
      allRules.push(...rules);
    }

    // 计算相对于项目根的路径
    const relativePath = path.relative(this.projectRoot, fullPath).replace(/\\/g, '/');
    
    // 空路径表示根目录
    if (relativePath === '') {
      return false;
    }

    // 按规则顺序应用
    for (const rule of allRules) {
      let testPath = relativePath;
      
      // 为目录添加尾部斜杠
      if (isDirectory && !testPath.endsWith('/')) {
        testPath += '/';
      }

      // 使用minimatch进行模式匹配
      try {
        let matches = false;
        
        // 处理目录规则
        if (rule.isDirectory) {
          const dirName = rule.pattern;
          
          // 对于目录规则，即使目录不存在也应该匹配
          // 这样可以处理测试用例中未创建的目录
          
          // 检查是否为目录名本身
          if (testPath === dirName || testPath === dirName + '/') {
            matches = true;
          }
          // 检查目录匹配（支持各种路径格式）
          else if (isDirectory) {
            matches = minimatch(testPath, dirName, {
              dot: true,
              matchBase: true
            }) || minimatch(testPath, dirName + '/**', {
              dot: true,
              matchBase: true
            }) || minimatch(testPath, '**/' + dirName, {
              dot: true,
              matchBase: true
            }) || minimatch(testPath, '**/' + dirName + '/**', {
              dot: true,
              matchBase: true
            });
          } else {
            // 检查文件是否在匹配的目录中
            matches = testPath.startsWith(dirName + '/') ||
                     testPath.includes('/' + dirName + '/') ||
                     minimatch(testPath, dirName + '/**', {
                       dot: true,
                       matchBase: true
                     }) ||
                     minimatch(testPath, '**/' + dirName + '/**', {
                       dot: true,
                       matchBase: true
                     });
          }
        } else {
          // 普通文件/通配符匹配
          matches = minimatch(testPath, rule.pattern, {
            dot: true,
            matchBase: true
          });
        }

        if (matches) {
          if (rule.isNegation) {
            result = false; // 取消忽略
          } else {
            result = true; // 添加忽略
          }
        }
      } catch (error) {
        // 如果模式无效，跳过此规则
        continue;
      }
    }

    return result;
  }

  /**
   * 获取所有ignore规则（用于调试）
   */
  getAllRules(): Map<string, IgnoreRule[]> {
    return new Map(this.rules);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取统计信息
   */
  getStats(): { files: number; rules: number } {
    let totalRules = 0;
    const rulesValues = Array.from(this.rules.values());
    for (let i = 0; i < rulesValues.length; i++) {
      totalRules += rulesValues[i].length;
    }
    return {
      files: this.rules.size,
      rules: totalRules
    };
  }
}