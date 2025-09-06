import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getTheme } from '../../../utils/theme';

const UI_ICONS = {
  loading: "◐◑◒◓"
} as const;

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text }: LoadingSpinnerProps) {
  const theme = getTheme();
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % UI_ICONS.loading.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Box>
      <Text color={theme.primary}>{UI_ICONS.loading[frame]}</Text>
      {text && <Text color={theme.secondary}> {text}</Text>}
    </Box>
  );
}