import { useState } from 'react'
import { type Key } from 'ink'
import { useDoublePress } from './useDoublePress'
import { Cursor } from '../utils/Cursor'
import {
  getImageFromClipboard,
  CLIPBOARD_ERROR_MESSAGE,
} from '../utils/imagePaste.js'

const IMAGE_PLACEHOLDER = '[Image pasted]'

type MaybeCursor = void | Cursor
type InputHandler = (input: string) => MaybeCursor
type InputMapper = (input: string) => MaybeCursor
function mapInput(input_map: Array<[string, InputHandler]>): InputMapper {
  return function (input: string): MaybeCursor {
    const handler = new Map(input_map).get(input) ?? (() => {})
    return handler(input)
  }
}

type UseTextInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  onExit?: () => void
  onExitMessage?: (show: boolean, key?: string) => void
  onMessage?: (show: boolean, message?: string) => void
  onHistoryUp?: () => void
  onHistoryDown?: () => void
  onHistoryReset?: () => void
  focus?: boolean
  mask?: string
  multiline?: boolean
  cursorChar: string
  highlightPastedText?: boolean
  invert: (text: string) => string
  themeText: (text: string) => string
  columns: number
  onImagePaste?: (base64Image: string) => void
  disableCursorMovementForUpDownKeys?: boolean
  externalOffset: number
  onOffsetChange: (offset: number) => void
}

type UseTextInputResult = {
  renderedValue: string
  onInput: (input: string, key: Key) => void
  offset: number
  setOffset: (offset: number) => void
}

export function useTextInput({
  value: originalValue,
  onChange,
  onSubmit,
  onExit,
  onExitMessage,
  onMessage,
  onHistoryUp,
  onHistoryDown,
  onHistoryReset,
  mask = '',
  multiline = false,
  cursorChar,
  invert,
  columns,
  onImagePaste,
  disableCursorMovementForUpDownKeys = false,
  externalOffset,
  onOffsetChange,
}: UseTextInputProps): UseTextInputResult {
  const offset = externalOffset
  const setOffset = onOffsetChange
  // Create cursor dynamically to ensure it always uses the latest offset
  const getCursor = () => Cursor.fromText(originalValue, columns, offset)
  const [imagePasteErrorTimeout, setImagePasteErrorTimeout] =
    useState<NodeJS.Timeout | null>(null)

  function maybeClearImagePasteErrorTimeout() {
    if (!imagePasteErrorTimeout) {
      return
    }
    clearTimeout(imagePasteErrorTimeout)
    setImagePasteErrorTimeout(null)
    onMessage?.(false)
  }

  const handleCtrlC = useDoublePress(
    show => {
      maybeClearImagePasteErrorTimeout()
      onExitMessage?.(show, 'Ctrl-C')
    },
    () => onExit?.(),
    () => {
      if (originalValue) {
        onChange('')
        onHistoryReset?.()
      }
    },
  )

  // Keep Escape for clearing input
  const handleEscape = useDoublePress(
    show => {
      maybeClearImagePasteErrorTimeout()
      onMessage?.(!!originalValue && show, `Press Escape again to clear`)
    },
    () => {
      if (originalValue) {
        onChange('')
      }
    },
  )
  function clear() {
    return Cursor.fromText('', columns, 0)
  }

  const handleEmptyCtrlD = useDoublePress(
    show => onExitMessage?.(show, 'Ctrl-D'),
    () => onExit?.(),
  )

  function handleCtrlD(): MaybeCursor {
    maybeClearImagePasteErrorTimeout()
    if (getCursor().text === '') {
      // When input is empty, handle double-press
      handleEmptyCtrlD()
      return getCursor()
    }
    // When input is not empty, delete forward like iPython
    return getCursor().del()
  }

  function tryImagePaste() {
    const base64Image = getImageFromClipboard()
    if (base64Image === null) {
      if (process.platform !== 'darwin') {
        return getCursor()
      }
      onMessage?.(true, CLIPBOARD_ERROR_MESSAGE)
      maybeClearImagePasteErrorTimeout()
      setImagePasteErrorTimeout(
        setTimeout(() => {
          onMessage?.(false)
        }, 4000),
      )
      return getCursor()
    }

    onImagePaste?.(base64Image)
    return getCursor().insert(IMAGE_PLACEHOLDER)
  }

  const handleCtrl = mapInput([
    ['a', () => getCursor().startOfLine()],
    ['b', () => getCursor().left()],
    ['c', handleCtrlC],
    ['d', handleCtrlD],
    ['e', () => getCursor().endOfLine()],
    ['f', () => getCursor().right()],
    [
      'h',
      () => {
        maybeClearImagePasteErrorTimeout()
        return getCursor().backspace()
      },
    ],
    ['k', () => getCursor().deleteToLineEnd()],
    ['l', () => clear()],
    ['n', () => downOrHistoryDown()],
    ['p', () => upOrHistoryUp()],
    ['u', () => getCursor().deleteToLineStart()],
    ['v', tryImagePaste],
    ['w', () => getCursor().deleteWordBefore()],
  ])

  const handleMeta = mapInput([
    ['b', () => getCursor().prevWord()],
    ['f', () => getCursor().nextWord()],
    ['d', () => getCursor().deleteWordAfter()],
  ])

  function handleEnter(key: Key) {
    if (
      multiline &&
      getCursor().offset > 0 &&
      getCursor().text[getCursor().offset - 1] === '\\'
    ) {
      return getCursor().backspace().insert('\n')
    }
    if (key.meta) {
      return getCursor().insert('\n')
    }
    onSubmit?.(originalValue)
  }

  function upOrHistoryUp() {
    if (disableCursorMovementForUpDownKeys) {
      onHistoryUp?.()
      return getCursor()
    }
    const cursorUp = getCursor().up()
    if (cursorUp.equals(getCursor())) {
      // already at beginning
     onHistoryUp?.()
    }
    return cursorUp
  }
  function downOrHistoryDown() {
    if (disableCursorMovementForUpDownKeys) {
      onHistoryDown?.()
      return getCursor()
    }
    const cursorDown = getCursor().down()
    if (cursorDown.equals(getCursor())) {
      onHistoryDown?.()
    }
    return cursorDown
  }

  function onInput(input: string, key: Key): void {
    if (key.tab) {
      return // Skip Tab key processing - let completion system handle it
    }
    
    // Direct handling for backspace (delete before cursor) or delete (delete after cursor)
    if (
      key.backspace ||
      input === '\b' ||
      input === '\x7f' ||
      input === '\x08'
    ) {
      const currentCursor = getCursor()
      const nextCursor = currentCursor.backspace()
      if (!currentCursor.equals(nextCursor)) {
        // 先更新文本，再更新光标位置
        onChange(nextCursor.text)
        setOffset(nextCursor.offset)
      }
      return
    }
    if (key.delete) {
      const currentCursor = getCursor()
      const nextCursor = currentCursor.del()
      if (!currentCursor.equals(nextCursor)) {
        // 先更新文本，再更新光标位置
        onChange(nextCursor.text)
        setOffset(nextCursor.offset)
      }
      return
    }
    // Handle regular character input and paste/IME input
    // Check if this is likely regular text input (including paste/IME)
    // Exclude enter/return keys which should be handled by mapKey
    if (input && !key.meta && !key.ctrl && !key.escape && !key.return) {
      // For paste/IME input, we might get multiple characters or special characters
      // We should process them as regular input insertion
      const currentCursor = getCursor()
      const nextCursor = currentCursor.insert(input.replace(/\r/g, '\n'))
      if (!currentCursor.equals(nextCursor)) {
        // 先更新文本，再更新光标位置
        onChange(nextCursor.text)
        setOffset(nextCursor.offset)
      }
      return
    }
    
    // Only process through mapKey for special keys that weren't handled above
    // This should only handle special keys, not regular character input
    const currentCursor = getCursor()
    const nextCursor = mapKey(key)(input)
    if (nextCursor) {
      if (!currentCursor.equals(nextCursor)) {
        // 先更新文本，再更新光标位置
        onChange(nextCursor.text)
        setOffset(nextCursor.offset)
      }
    }
  }

  function mapKey(key: Key): InputMapper {
    // Direct handling for backspace (delete极before cursor) or delete (delete after cursor)
    if (key.backspace) {
      maybeClearImagePasteErrorTimeout()
      return () => getCursor().backspace()
    }
    if (key.delete) {
      maybeClearImagePasteErrorTimeout()
      return () => getCursor().del()
    }

    switch (true) {
      case key.escape:
        return handleEscape
      case key.leftArrow && (key.ctrl || key.meta):
        return () => getCursor().prevWord()
      case key.rightArrow && (key.ctrl || key.meta):
        return () => getCursor().nextWord()
      case key.ctrl:
        return handleCtrl
      case key.pageDown:
        return () => getCursor().endOfLine()
      case key.pageUp:
        return () => getCursor().startOfLine()
      case key.meta:
        return handleMeta
      case key.return:
        return () => handleEnter(key)
      // Remove Tab handling - let completion system handle it
      case key.upArrow:
        return upOrHistoryUp
      case key.downArrow:
        return downOrHistoryDown
      case key.leftArrow:
        return () => getCursor().left()
      case key.rightArrow:
        return () => getCursor().right()
    }
    return function (input: string) {
      switch (true) {
        // Home key
        case input == '\x1b[H' || input == '\x1b[1~':
          return getCursor().startOfLine()
        // End key
        case input == '\x1b[F' || input == '\x1b[4~':
          return getCursor().endOfLine()
        // Handle backspace character explicitly - this is the key fix
        case input === '\b' || input === '\x7f' || input === '\x08':
          maybeClearImagePasteErrorTimeout()
          return getCursor().backspace()
        default:
          // Don't handle regular character input here - it should be handled above
          // in the main onInput function to avoid duplicate processing
          return getCursor()
      }
    }
  }

  return {
    onInput,
    renderedValue: getCursor().render(cursorChar, mask, invert),
    offset,
    setOffset,
  }
}
