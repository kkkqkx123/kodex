import React from 'react'
import { Box, Text } from 'ink'
import TextInput from '../../TextInput'
import { Newline } from 'ink'
import { ScreenContainer } from '../ModelSelector'

type ResourceNameInputScreenProps = {
  resourceName: string
  setResourceName: (value: string) => void
  handleResourceNameSubmit: (name: string) => void
  resourceNameCursorOffset: number
  setResourceNameCursorOffset: (offset: number) => void
  exitState: { pending: boolean; keyName: string }
}

export function ResourceNameInputScreen({
  resourceName,
  setResourceName,
  handleResourceNameSubmit,
  resourceNameCursorOffset,
  setResourceNameCursorOffset,
  exitState,
}: ResourceNameInputScreenProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Box
        flexDirection="column"
        gap={1}
        borderStyle="round"
        borderColor="gray"
        paddingX={2}
        paddingY={1}
      >
        <Text bold>
          Azure Resource Setup{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>Enter your Azure OpenAI resource name:</Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              This is the name of your Azure OpenAI resource (without the full
              domain).
              <Newline />
              For example, if your endpoint is
              "https://myresource.openai.azure.com", enter "myresource".
            </Text>
          </Box>

          <Box>
            <TextInput
              placeholder="myazureresource"
              value={resourceName}
              onChange={setResourceName}
              onSubmit={handleResourceNameSubmit}
              columns={100}
              cursorOffset={resourceNameCursorOffset}
              onChangeCursorOffset={setResourceNameCursorOffset}
              showCursor={true}
            />
          </Box>

          <Box marginTop={1}>
            <Text>
              <Text color="blue" dimColor={!resourceName}>
                [Submit Resource Name]
              </Text>
              <Text> - Press Enter or click to continue</Text>
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>
              Press <Text color="blue">Enter</Text> to continue or{' '}
              <Text color="blue">Esc</Text> to go back
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}