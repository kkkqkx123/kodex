import React, { useState, ReactNode } from 'react'
import { Box, Text } from 'ink'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

export function ErrorBoundary({ children, fallback }: Props) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleError = (error: Error) => {
    setHasError(true)
    setError(error)
    console.error('ErrorBoundary caught an error:', error)
  }

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>
          ⚠️  发生错误
        </Text>
        <Text color="gray">
          {error?.message || '未知错误'}
        </Text>
        <Text color="cyan" dimColor>
          请重启应用程序
        </Text>
      </Box>
    )
  }

  return <>{children}</>
}