# Kode Hooks Documentation

This document provides a comprehensive overview of all React hooks used in the Kode project, organized by functionality and purpose.

## Table of Contents
1. [Auto-completion Hooks](#auto-completion-hooks)
2. [Input Processing Hooks](#input-processing-hooks)
3. [Permission Control Hooks](#permission-control-hooks)
4. [Tool Usage Hooks](#tool-usage-hooks)
5. [System API Hooks](#system-api-hooks)
6. [Utility Hooks](#utility-hooks)

## Auto-completion Hooks

### useUnifiedCompletion
**File**: `src/hooks/useUnifiedCompletion.ts`

The main hook for handling all types of auto-completion in the application. It integrates all completion utilities and provides a unified interface for:
- Command completion (`/command`)
- Subcommand completion (`/command/subcommand`)
- Agent completion (`#agent-name`)
- File completion (relative and absolute paths)
- Unix command completion

Key features:
- Handles Tab key navigation through suggestions
- Supports Enter key confirmation of selections
- Implements smart auto-triggering based on context
- Integrates with all completion utility classes

### Completion Utility Classes

#### CommandCompletionUtility
**File**: `src/hooks/completion/CommandCompletionUtility.ts`

Handles command-related completions:
- Slash command suggestions (`/command`)
- Subcommand suggestions for commands that support them
- Unix command suggestions with fuzzy matching
- Command classification based on intrinsic features (core, common, dev, system)

#### FileCompletionUtility
**File**: `src/hooks/completion/FileCompletionUtility.ts`

Manages file path completions:
- Relative and absolute path suggestions
- Directory and file differentiation with icons
- Deep file search for `@` references
- Unicode/Chinese character support
- Integration with `.gitignore` and ignore patterns

#### AgentCompletionUtility
**File**: `src/hooks/completion/AgentCompletionUtility.ts`

Provides agent and model completion suggestions:
- Agent suggestions (`%run-agent-*`)
- Model consultation suggestions (`%ask-*`)
- Smart description processing for clean display
- Fuzzy matching for intelligent completion

#### CompletionContextUtility
**File**: `src/hooks/completion/CompletionContextUtility.ts`

Analyzes input context to determine completion type:
- Detects completion context at cursor position
- Identifies completion type (command, file, agent, etc.)
- Implements smart auto-trigger conditions
- Handles Unicode characters and special path patterns

#### CompletionStateUtility
**File**: `src/hooks/completion/CompletionStateUtility.ts`

Manages the state of the completion system:
- State updates and transitions
- Tab key handling and navigation
- Suggestion activation and reset
- Preview mode management

## Input Processing Hooks

### useTextInput
**File**: `src/hooks/useTextInput.ts`

Core hook for text input handling:
- Multi-line text input support
- Cursor movement and editing operations
- Keyboard shortcuts (Ctrl+A, Ctrl+E, etc.)
- Image paste support from clipboard
- History navigation integration

### useArrowKeyHistory
**File**: `src/hooks/useArrowKeyHistory.ts`

Manages command history navigation:
- Up/down arrow key handling for history
- History index tracking
- Last typed input preservation
- History reset functionality

## Permission Control Hooks

### useCanUseTool
**File**: `src/hooks/useCanUseTool.ts`

Handles tool usage permission checks:
- Permission verification against configuration
- User confirmation prompts for restricted tools
- Automatic permission granting based on configuration
- Integration with permission handling options

### usePermissionRequestLogging
**File**: `src/hooks/usePermissionRequestLogging.ts`

Logs permission request events:
- Statsig event logging
- Unary event logging with language information
- Tool usage permission request tracking

## Tool Usage Hooks

### useCancelRequest
**File**: `src/hooks/useCancelRequest.ts`

Manages request cancellation:
- Escape key handling for cancellation
- Tool UI cleanup on cancellation
- Integration with loading states and message selectors

## System API Hooks

### useApiKeyVerification
**File**: `src/hooks/useApiKeyVerification.ts`

Handles API key validation:
- Anthropic API key verification
- Status tracking (valid, invalid, missing, error)
- Re-verification capability
- Default/demo key detection

### useLogMessages
**File**: `src/hooks/useLogMessages.ts`

Manages message logging:
- Automatic message log updates
- Progress message filtering
- Integration with message persistence

### useLogStartupTime
**File**: `src/hooks/useLogStartupTime.ts`

Logs application startup time:
- Startup duration tracking
- Statsig event logging

## Utility Hooks

### useDoublePress
**File**: `src/hooks/useDoublePress.ts`

Handles double key press detection:
- Configurable timeout (default 2000ms)
- First and second press handling
- Pending state management

### useExitOnCtrlCD
**File**: `src/hooks/useExitOnCtrlCD.ts`

Manages application exit via Ctrl+C/D:
- Double press detection for exit
- Pending exit state tracking
- Integration with exit handlers

### useInterval
**File**: `src/hooks/useInterval.ts`

Provides interval-based callbacks:
- Configurable interval timing
- Automatic cleanup on unmount
- Interval restart on delay changes

### useNotifyAfterTimeout
**File**: `src/hooks/useNotifyAfterTimeout.ts`

Handles desktop notifications after timeout:
- Idle time detection
- Notification triggering based on inactivity
- User interaction tracking

### useSubcommandCompletion
**File**: `src/hooks/useSubcommandCompletion.ts`

Manages subcommand completion triggers:
- Subcommand completion detection
- External system integration
- Command subcommand availability checking

### useSubcommandRegistry
**File**: `src/hooks/useSubcommandRegistry.ts`

Handles command subcommand registration:
- Subcommand registration and management
- Subcommand querying and availability checking
- Dynamic subcommand registration

### useTerminalSize
**File**: `src/hooks/useTerminalSize.ts`

Tracks terminal dimensions:
- Real-time terminal size updates
- Global state sharing across components
- Resize event handling
