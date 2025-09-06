import React from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { getTheme } from '../../../utils/theme';

interface SelectListProps {
  options: Array<{ label: string; value: string }>;
  selectedIndex: number;
  onChange: (value: string) => void;
  onCancel?: () => void;
  numbered?: boolean;
}

export function SelectList({ options, selectedIndex, onChange, onCancel, numbered = true }: SelectListProps) {
  const theme = getTheme();
  
  useInput((input, key) => {
    if (key.escape && onCancel) {
      onCancel();
    } else if (key.return) {
      onChange(options[selectedIndex].value);
    }
  });

  return (
    <Box flexDirection="column">
      {options.map((option, idx) => (
        <Box key={option.value}>
          <Text color={idx === selectedIndex ? theme.primary : undefined}>
            {idx === selectedIndex ? "❯ " : "  "}
            {numbered ? `${idx + 1}. ` : ''}{option.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
}