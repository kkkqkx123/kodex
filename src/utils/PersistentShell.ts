import * as fs from 'fs'
import { homedir } from 'os'
import { existsSync } from 'fs'
import shellquote from 'shell-quote'
import { spawn, execSync, type ChildProcess } from 'child_process'
import { isAbsolute, resolve, join } from 'path'
import { logError } from './log'
import * as os from 'os'
import { logEvent } from '../services/featureFlags'
import { PRODUCT_COMMAND } from '../constants/product'

type ExecResult = {
  stdout: string
  stderr: string
  code: number
  interrupted: boolean
}
type QueuedCommand = {
  command: string
  abortSignal?: AbortSignal
  timeout?: number
  resolve: (result: ExecResult) => void
  reject: (error: Error) => void
}

const TEMPFILE_PREFIX = os.tmpdir() + `/${PRODUCT_COMMAND}-`
const DEFAULT_TIMEOUT = 5 * 60 * 1000
const SIGTERM_CODE = 143 // Standard exit code for SIGTERM
const FILE_SUFFIXES = {
  STATUS: '-status',
  STDOUT: '-stdout',
  STDERR: '-stderr',
  CWD: '-cwd',
}
const SHELL_CONFIGS: Record<string, string> = {
  '/bin/bash': '.bashrc',
  '/bin/zsh': '.zshrc',
}

// Shell detection function to determine available shell
type ShellType = 'bash' | 'powershell' | 'unknown'

function detectShell(): { path: string; type: ShellType } {
  // Check environment variables first
  if (process.env.SHELL) {
    if (process.env.SHELL.includes('bash')) {
      return { path: process.env.SHELL, type: 'bash' }
    }
  }

  // On Windows, check available shells in priority order: Git Bash > PowerShell > cmd
  if (process.platform === 'win32') {
    // 1. Check for Git Bash first
    const gitPaths = [
      process.env.GIT_INSTALL_ROOT + '\\bin\\bash.exe',
      process.env.ProgramFiles + '\\Git\\bin\\bash.exe',
      process.env['ProgramFiles(x86)'] + '\\Git\\bin\\bash.exe',
    ]
    
    for (const path of gitPaths) {
      if (existsSync(path)) {
        return { path, type: 'bash' }
      }
    }
    
    // 2. Check for PowerShell
    const pwshPaths = [
      process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      process.env.SystemRoot + '\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe',
    ]

    for (const path of pwshPaths) {
      if (existsSync(path)) {
        return { path, type: 'powershell' }
      }
    }

    // 3. Fallback to cmd.exe
    const cmdPath = process.env.SystemRoot + '\\System32\\cmd.exe'
    if (existsSync(cmdPath)) {
      return { path: cmdPath, type: 'unknown' }
    }
  }

  // Check common shell paths for Unix-like systems
  const shellPaths = [
    '/bin/bash',
    '/usr/bin/bash',
    '/bin/zsh',
    '/usr/bin/zsh',
  ]

  for (const path of shellPaths) {
    if (existsSync(path)) {
      return { path, type: 'bash' }
    }
  }

  // Final fallback
  return { path: '/bin/sh', type: 'bash' }
}

export class PersistentShell {
  private commandQueue: QueuedCommand[] = []
  private isExecuting: boolean = false
  private shell: ChildProcess
  private isAlive: boolean = true
  private commandInterrupted: boolean = false
  private statusFile: string
  private stdoutFile: string
  private stderrFile: string
  private cwdFile: string
  private cwd: string
  private binShell: string
  private shellReady: boolean = false

  constructor(cwd: string) {
    const detectedShell = detectShell()
    this.binShell = detectedShell.path
    
    // Debug logging
    console.log(`[DEBUG] PersistentShell: Detected shell: ${detectedShell.path} (${detectedShell.type})`)

    // Set appropriate spawn arguments based on shell type
    let spawnArgs: string[] = []
    let spawnOptions = {
      stdio: ['pipe', 'pipe', 'pipe'] as const,
      cwd,
      env: {
        ...process.env,
        GIT_EDITOR: 'true',
      },
    }

    if (detectedShell.type === 'bash') {
      spawnArgs = ['-l']
    } else if (detectedShell.type === 'powershell') {
      spawnArgs = ['-NoLogo', '-NoProfile', '-Command', '-']
    }

    try {
      this.shell = spawn(this.binShell, spawnArgs, { ...spawnOptions, stdio: ['pipe', 'pipe', 'pipe'] })
      
      // Set up error handling
      this.shell.on('error', (error) => {
        logError(`Shell process error: ${error}`)
      })
    } catch (error) {
      console.error(`[ERROR] PersistentShell: Failed to spawn shell: ${error}`)
      throw error
    }

    this.cwd = cwd

    this.shell.on('exit', (code, signal) => {
      if (code) {
        // TODO: It would be nice to alert the user that shell crashed
        logError(`Shell exited with code ${code} and signal ${signal}`)
        logEvent('persistent_shell_exit', {
          code: code?.toString() || 'null',
          signal: signal || 'null',
        })
      }
      for (const file of [
        this.statusFile,
        this.stdoutFile,
        this.stderrFile,
        this.cwdFile,
      ]) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      }
      this.isAlive = false
    })

    const id = Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0')

    this.statusFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.STATUS
    this.stdoutFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.STDOUT
    this.stderrFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.STDERR
    this.cwdFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.CWD
    for (const file of [this.statusFile, this.stdoutFile, this.stderrFile]) {
      fs.writeFileSync(file, '')
    }
    // Initialize CWD file with initial directory
    fs.writeFileSync(this.cwdFile, cwd)
    
    const configFile = SHELL_CONFIGS[this.binShell]
    if (configFile) {
      const configFilePath = join(homedir(), configFile)
      if (existsSync(configFilePath)) {
        // Wait a bit before sourcing config file
        setTimeout(() => {
          this.sendToShell(`source ${configFilePath}`)
        }, 1000)
      }
    }
    
    // Initialize a ready flag
    this.shellReady = false
    setTimeout(() => {
      this.shellReady = true
    }, 1500)
  }

  private static instance: PersistentShell | null = null

  static restart() {
    if (PersistentShell.instance) {
      PersistentShell.instance.close()
      PersistentShell.instance = null
    }
  }

  static getInstance(): PersistentShell {
    if (!PersistentShell.instance || !PersistentShell.instance.isAlive) {
      PersistentShell.instance = new PersistentShell(process.cwd())
    }
    return PersistentShell.instance
  }

  killChildren() {
    const parentPid = this.shell.pid
    try {
      let childPids: string[] = []

      if (process.platform === 'win32') {
        // Windows: use wmic to get child processes
        try {
          const result = execSync(`wmic process where (ParentProcessId=${parentPid}) get ProcessId`)
            .toString()
            .trim()
            .split('\r\n')
            .filter(line => line.trim() && !isNaN(Number(line.trim())))

          childPids = result.slice(1) // Remove header
        } catch {
          // wmic might not be available, fallback to taskkill
          try {
            execSync(`taskkill /F /T /PID ${parentPid}`)
          } catch {
            // Ignore errors if taskkill also fails
          }
        }
      } else {
        // Unix: use pgrep
        childPids = execSync(`pgrep -P ${parentPid}`)
          .toString()
          .trim()
          .split('\n')
          .filter(Boolean) // Filter out empty strings
      }

      if (childPids.length > 0) {
        logEvent('persistent_shell_command_interrupted', {
          numChildProcesses: childPids.length.toString(),
        })
      }

      childPids.forEach(pid => {
        try {
          process.kill(Number(pid), process.platform === 'win32' ? 0 : 'SIGTERM')
        } catch (error) {
          logError(`Failed to kill process ${pid}: ${error}`)
          logEvent('persistent_shell_kill_process_error', {
            error: (error as Error).message.substring(0, 10),
          })
        }
      })
    } catch {
      // Command returns non-zero when no processes are found - this is expected
    } finally {
      this.commandInterrupted = true
    }
  }

  private async processQueue() {
    /**
     * Processes commands from the queue one at a time.
     * Concurrency invariants:
     * - Only one instance runs at a time (controlled by isExecuting)
     * - Is the only caller of updateCwd() in the system
     * - Calls updateCwd() after each command completes
     * - Ensures commands execute serially via the queue
     * - Handles interruption via abortSignal by calling killChildren()
     * - Cleans up abortSignal listeners after command completion or interruption
     */
    if (this.isExecuting || this.commandQueue.length === 0) {
      return
    }

    this.isExecuting = true
    const { command, abortSignal, timeout, resolve, reject } =
      this.commandQueue.shift()!

    const killChildren = () => this.killChildren()
    if (abortSignal) {
      abortSignal.addEventListener('abort', killChildren)
    }

    try {
      const result = await this.exec_(command, timeout)

      // No need to update cwd - it's handled in exec_ via the CWD file

      resolve(result)
    } catch (error) {
      logEvent('persistent_shell_command_error', {
        error: (error as Error).message.substring(0, 10),
      })
      reject(error as Error)
    } finally {
      this.isExecuting = false
      if (abortSignal) {
        abortSignal.removeEventListener('abort', killChildren)
      }
      // Process next command in queue
      this.processQueue()
    }
  }

  async exec(
    command: string,
    abortSignal?: AbortSignal,
    timeout?: number,
  ): Promise<ExecResult> {
    // Wait for shell to be ready if this is the first command
    if (!this.shellReady) {
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (this.shellReady) {
            resolve()
          } else {
            setTimeout(checkReady, 100)
          }
        }
        checkReady()
      })
    }
    
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ command, abortSignal, timeout, resolve, reject })
      this.processQueue()
    })
  }

  private getShellType(): ShellType {
    if (this.binShell.includes('powershell') || this.binShell.includes('pwsh')) {
      return 'powershell'
    } else if (this.binShell.includes('bash') || this.binShell.includes('zsh') || this.binShell.includes('sh')) {
      return 'bash'
    }
    return 'unknown'
  }

  private buildCommandForShell(command: string, shellType: ShellType): string {
    const quotedCommand = shellquote.quote([command])

    if (shellType === 'powershell') {
      // PowerShell command execution with proper output redirection
      return [
        `try {`,
        `  ${quotedCommand} | Out-File -FilePath '${this.stdoutFile}' -Encoding utf8`,
        `  $LASTEXITCODE`,
        `} catch {`,
        `  $_.Exception.Message | Out-File -FilePath '${this.stderrFile}' -Encoding utf8`,
        `  1`,
        `}`,
        `Get-Location | Out-File -FilePath '${this.cwdFile}' -Encoding utf8`,
        `$LASTEXITCODE | Out-File -FilePath '${this.statusFile}' -Encoding utf8`
      ].join('; ')
    } else {
      // Bash/Zsh command execution
      // Convert Windows paths to Unix-style paths for Git Bash
      const convertPathForBash = (path: string): string => {
        if (process.platform === 'win32') {
          // Convert C:\path\to\file to /c/path/to/file
          return path.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/')
        }
        return path
      }
      
      const stdoutFile = convertPathForBash(this.stdoutFile)
      const stderrFile = convertPathForBash(this.stderrFile)
      const cwdFile = convertPathForBash(this.cwdFile)
      const statusFile = convertPathForBash(this.statusFile)
      
      return [
        `eval ${quotedCommand} < /dev/null > ${stdoutFile} 2> ${stderrFile}`,
        `EXEC_EXIT_CODE=$?`,
        `pwd > ${cwdFile}`,
        `echo $EXEC_EXIT_CODE > ${statusFile}`
      ].join('\n')
    }
  }

  private async exec_(command: string, timeout?: number): Promise<ExecResult> {
    /**
     * Direct command execution without going through the queue.
     * Concurrency invariants:
     * - Not safe for concurrent calls (uses shared files)
     * - Called only when queue is idle
     * - Relies on file-based IPC to handle shell interaction
     * - Does not modify the command queue state
     * - Tracks interruption state via commandInterrupted flag
     * - Resets interruption state at start of new command
     * - Reports interruption status in result object
     *
     * Exit Code & CWD Handling:
     * - Executes command and immediately captures its exit code into a shell variable
     * - Updates the CWD file with the working directory after capturing exit code
     * - Writes the preserved exit code to the status file as the final step
     * - This sequence eliminates race conditions between exit code capture and CWD updates
     * - The pwd() method reads the CWD file directly for current directory info
     */
    
    // PowerShell-specific optimization: Skip complex shell commands in PowerShell
    if (process.platform === 'win32' && process.env.PSModulePath) {
      // For PowerShell, use a simpler direct execution approach to prevent memory leaks
      return new Promise<ExecResult>((resolve) => {
        const commandTimeout = timeout || DEFAULT_TIMEOUT;
        this.commandInterrupted = false;
        
        // Truncate output files
        fs.writeFileSync(this.stdoutFile, '');
        fs.writeFileSync(this.stderrFile, '');
        fs.writeFileSync(this.statusFile, '');
        fs.writeFileSync(this.cwdFile, this.cwd);
        
        try {
          // Execute command directly with execSync for simpler approach in PowerShell
          const result = execSync(command, {
            cwd: this.cwd,
            timeout: commandTimeout,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              GIT_EDITOR: 'true',
            }
          });
          
          const stdout = result.toString();
          fs.writeFileSync(this.stdoutFile, stdout);
          
          resolve({
            stdout,
            stderr: '',
            code: 0,
            interrupted: false,
          });
        } catch (error: any) {
          const stdout = error.stdout ? error.stdout.toString() : '';
          const stderr = error.stderr ? error.stderr.toString() : error.message || '';
          
          fs.writeFileSync(this.stdoutFile, stdout);
          fs.writeFileSync(this.stderrFile, stderr);
          
          const code = error.status || 1;
          fs.writeFileSync(this.statusFile, code.toString());
          
          resolve({
            stdout,
            stderr,
            code,
            interrupted: this.commandInterrupted,
          });
        }
      });
    }
    
    console.log(`[DEBUG] PersistentShell.exec_: Starting execution of command: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`)
    const shellType = this.getShellType()

    // Check the syntax of the command
    try {
      if (shellType === 'powershell') {
        // PowerShell syntax check
        execSync(`powershell -NoProfile -Command "try { ${command} } catch { exit 1 }"`, {
          stdio: 'ignore',
          timeout: 1000,
        })
      } else {
        // Bash syntax check
        const quotedCommand = shellquote.quote([command])
        execSync(`${this.binShell} -n -c ${quotedCommand}`, {
          stdio: 'ignore',
          timeout: 1000,
        })
      }
    } catch (stderr) {
      // If there's a syntax error, return an error and log it
      const errorStr =
        typeof stderr === 'string' ? stderr : String(stderr || '')
      logEvent('persistent_shell_syntax_error', {
        error: errorStr.substring(0, 10),
      })
      return Promise.resolve({
        stdout: '',
        stderr: errorStr,
        code: 128,
        interrupted: false,
      })
    }

    const commandTimeout = timeout || DEFAULT_TIMEOUT
    // Reset interrupted state for new command
    this.commandInterrupted = false
    return new Promise<ExecResult>(resolve => {
      // Truncate output files
      fs.writeFileSync(this.stdoutFile, '')
      fs.writeFileSync(this.stderrFile, '')
      fs.writeFileSync(this.statusFile, '')

      // Build the appropriate command for the detected shell
      const shellCommand = this.buildCommandForShell(command, shellType)

      // Send the command to the shell
      this.sendToShell(shellCommand)

      // Check for command completion or timeout
      const start = Date.now()
      const checkCompletion = setInterval(() => {
        const elapsed = Date.now() - start
        try {
          let statusFileSize = 0
          if (fs.existsSync(this.statusFile)) {
            statusFileSize = fs.statSync(this.statusFile).size
          }

          if (
            statusFileSize > 0 ||
            elapsed > commandTimeout ||
            this.commandInterrupted
          ) {
            clearInterval(checkCompletion)
            
            // Try reading files with both Windows and Unix-style paths
            const readFileWithFallback = (filePath: string): string => {
              if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8')
              }
              
              // If on Windows and file not found, try Unix-style path
              if (process.platform === 'win32') {
                const unixPath = filePath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/')
                if (fs.existsSync(unixPath)) {
                  return fs.readFileSync(unixPath, 'utf8')
                }
              }
              
              return ''
            }
            
            const stdout = readFileWithFallback(this.stdoutFile)
            let stderr = readFileWithFallback(this.stderrFile)
            let code: number
            
            if (statusFileSize) {
              const statusContent = readFileWithFallback(this.statusFile)
              code = Number(statusContent)
            } else {
              // Timeout occurred - kill any running processes
              this.killChildren()
              code = SIGTERM_CODE
              stderr += (stderr ? '\n' : '') + 'Command execution timed out'
              logEvent('persistent_shell_command_timeout', {
                command: command.substring(0, 10),
                timeout: commandTimeout.toString(),
              })
            }
            resolve({
              stdout,
              stderr,
              code,
              interrupted: this.commandInterrupted,
            })
          }
        } catch {
          // Ignore file system errors during polling - they are expected
          // as we check for completion before files exist
        }
      }, 10) // increasing this will introduce latency
    })
  }

  private sendToShell(command: string) {
    try {
      this.shell!.stdin!.write(command + '\n')
    } catch (error) {
      const errorString =
        error instanceof Error
          ? error.message
          : String(error || 'Unknown error')
      logError(`Error in sendToShell: ${errorString}`)
      logEvent('persistent_shell_write_error', {
        error: errorString.substring(0, 100),
        command: command.substring(0, 30),
      })
      throw error
    }
  }

  pwd(): string {
    try {
      let newCwd = ''
      
      // Try Windows path first
      if (fs.existsSync(this.cwdFile)) {
        newCwd = fs.readFileSync(this.cwdFile, 'utf8').trim()
      }
      
      // If not found and on Windows, try Unix-style path
      if (!newCwd && process.platform === 'win32') {
        const unixPath = this.cwdFile.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/')
        if (fs.existsSync(unixPath)) {
          newCwd = fs.readFileSync(unixPath, 'utf8').trim()
          // Convert back to Windows path format
          if (newCwd.startsWith('/') && /^[a-z]/.test(newCwd.substring(1))) {
            newCwd = newCwd.substring(1).toUpperCase() + ':' + newCwd.substring(2).replace(/\//g, '\\')
          }
        }
      }
      
      if (newCwd) {
        this.cwd = newCwd
      }
    } catch (error) {
      logError(`Shell pwd error ${error}`)
    }
    // Always return the cached value
    return this.cwd
  }

  async setCwd(cwd: string) {
    const resolved = isAbsolute(cwd) ? cwd : resolve(process.cwd(), cwd)
    if (!existsSync(resolved)) {
      throw new Error(`Path "${resolved}" does not exist`)
    }
    await this.exec(`cd ${resolved}`)
  }

  close(): void {
    this.shell!.stdin!.end()
    this.shell.kill()
  }
}