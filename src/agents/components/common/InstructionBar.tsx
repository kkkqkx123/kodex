import React from 'react';
import { Box, Text } from 'ink';
import { getTheme } from '../../../utils/theme';

interface InstructionBarProps {
 instructions?: string;
}

export function InstructionBar({ instructions = "Press ↑↓ to navigate · Enter to select · Esc to go back" }: InstructionBarProps) {
  const theme = getTheme();
  return (
    <Box marginTop={2}>
      <Box borderStyle="round" borderColor={theme.secondary} paddingX={1}>
        <Text color={theme.secondary}>{instructions}</Text>
      </Box>
    </Box>
  );
}