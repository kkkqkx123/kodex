import { Box, Text } from 'ink'
import * as React from 'react'
import { getTheme } from '../utils/theme'

type Props = {
  tokenUsage: number
  contextLimit?: number
}

const DEFAULT_CONTEXT_LIMIT = 200000

export function TokenWarning({ tokenUsage, contextLimit = DEFAULT_CONTEXT_LIMIT }: Props): React.ReactNode {
  const theme = getTheme()
  const warningThreshold = contextLimit * 0.6
  const errorThreshold = contextLimit * 0.8

  if (tokenUsage < warningThreshold) {
    return null
  }

  const isError = tokenUsage >= errorThreshold

  return (
    <Box flexDirection="row">
      <Text color={isError ? theme.error : theme.warning}>
        Context low (
        {Math.max(0, 100 - Math.round((tokenUsage / contextLimit) * 100))}%
        remaining) &middot; Run /compact to compact & continue
      </Text>
    </Box>
  )
}
