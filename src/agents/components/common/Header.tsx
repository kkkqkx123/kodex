import React from 'react';
import { Box, Text } from 'ink';
import { getTheme } from '../../../utils/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, step, totalSteps, children }: HeaderProps) {
  const theme = getTheme();
  return (
    <Box flexDirection="column">
      <Text bold color={theme.primary}>{title}</Text>
      {subtitle && (
        <Text color={theme.secondary}>
          {step && totalSteps ? `Step ${step}/${totalSteps}: ` : ''}{subtitle}
        </Text>
      )}
      {children}
    </Box>
  );
}