import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import InkTextInput from 'ink-text-input';
import { getTheme } from '../../../utils/theme';

interface MultilineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  focus?: boolean;
  rows?: number;
  error?: string | null;
}

export function MultilineTextInput({
  value,
  onChange,
  placeholder = '',
  onSubmit,
  focus = true,
  rows = 5,
  error
}: MultilineTextInputProps) {
  const theme = getTheme();
  const [internalValue, setInternalValue] = useState(value);
  const [cursorBlink, setCursorBlink] = useState(true);
  
  // Sync with external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  
  // Cursor blink animation
  useEffect(() => {
    if (!focus) return;
    const timer = setInterval(() => {
      setCursorBlink(prev => !prev);
    }, 500);
    return () => clearInterval(timer);
  }, [focus]);
  
  // Calculate display metrics
  const lines = internalValue.split('\n');
  const lineCount = lines.length;
  const charCount = internalValue.length;
  const isEmpty = !internalValue.trim();
  const hasContent = !isEmpty;
  
  // Format lines for display with word wrapping
  const formatLines = (text: string): string[] => {
    if (!text && placeholder) {
      return [placeholder];
    }
    const maxWidth = 70; // Maximum characters per line
    const result: string[] = [];
    const textLines = text.split('\n');
    
    textLines.forEach(line => {
      if (line.length <= maxWidth) {
        result.push(line);
      } else {
        // Word wrap long lines
        let remaining = line;
        while (remaining.length > 0) {
          result.push(remaining.slice(0, maxWidth));
          remaining = remaining.slice(maxWidth);
        }
      }
    });
    
    return result.length > 0 ? result : [''];
  };
  
  const displayLines = formatLines(internalValue);
  const visibleLines = displayLines.slice(Math.max(0, displayLines.length - rows));
  
  // Handle submit
  const handleSubmit = () => {
    if (internalValue.trim() && onSubmit) {
      onSubmit();
    }
  };
  
  return (
    <Box flexDirection="column" width="100%">
      {/* Modern card-style input container */}
      <Box flexDirection="column">
        {/* Input area */}
        <Box 
          borderStyle="round"
          borderColor={focus ? theme.primary : 'gray'}
          paddingX={2}
          paddingY={1}
          minHeight={rows + 2}
        >
          <Box flexDirection="column">
            {/* Use ink-text-input for better input handling */}
            <InkTextInput
              value={internalValue}
              onChange={(val) => {
                setInternalValue(val);
                onChange(val);
              }}
              onSubmit={handleSubmit}
              focus={focus}
              placeholder={placeholder}
            />
            
            {/* Show cursor indicator when focused */}
            {focus && cursorBlink && hasContent && (
              <Text color={theme.primary}>_</Text>
            )}
          </Box>
        </Box>
        
        {/* Status bar */}
        <Box marginTop={1} flexDirection="row" justifyContent="space-between">
          <Box>
            {hasContent ? (
              <Text color={theme.success}>
                ✓ {charCount} chars • {lineCount} line{lineCount !== 1 ? 's' : ''}
              </Text>
            ) : (
              <Text dimColor>○ Type to begin...</Text>
            )}
          </Box>
          <Box>
            {error ? (
              <Text color={theme.error}>⚠ {error}</Text>
            ) : (
              <Text dimColor>
                {hasContent ? 'Ready' : 'Waiting'}
              </Text>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Instructions */}
      <Box marginTop={1}>
        <Text dimColor>
          Press Enter to submit · Shift+Enter for new line
        </Text>
      </Box>
    </Box>
  );
}