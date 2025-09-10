import { Box, Text } from 'ink'
import React from 'react'
import { Spinner as FullSpinner } from './Spinner'
import { getTheme } from '../utils/theme'

type Props = {
  isError: boolean
  isUnresolved: boolean
  shouldAnimate: boolean
}

export function ToolUseLoader({
  isError,
  isUnresolved,
  shouldAnimate,
}: Props): React.ReactNode {
  if (!shouldAnimate) {
    return null
  }

  const color = isUnresolved
    ? getTheme().secondaryText
    : isError
      ? getTheme().error
      : getTheme().success

  return (
    <Box flexDirection="row">
      <FullSpinner />
    </Box>
  )
}
