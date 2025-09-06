import { useInput } from 'ink'
import { ToolUseConfirm } from '../components/permissions/PermissionRequest'
import { logEvent } from '../services/featureFlags'
import { type BinaryFeedbackContext } from '../screens/REPL.types'
import type { SetToolJSXFn } from '../Tool'

export function useCancelRequest(
  setToolJSX: SetToolJSXFn,
  setToolUseConfirm: (toolUseConfirm: ToolUseConfirm | null) => void,
  setBinaryFeedbackContext: (bfContext: BinaryFeedbackContext | null) => void,
  onCancel: () => void,
  isLoading: boolean,
  isMessageSelectorVisible: boolean,
  abortSignal?: AbortSignal,
) {
  useInput((_, key) => {
    if (!key.escape) {
      return
    }
    if (abortSignal?.aborted) {
      return
    }
    if (!abortSignal) {
      return
    }
    if (!isLoading) {
      return
    }
    if (isMessageSelectorVisible) {
      // Esc closes the message selector
      return
    }
    logEvent('tengu_cancel', {})
    setToolJSX(null)
    setToolUseConfirm(null)
    setBinaryFeedbackContext(null)
    onCancel()
  })
}
