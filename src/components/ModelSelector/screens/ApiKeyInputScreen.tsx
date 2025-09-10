import React from 'react'
import { Box, Text } from 'ink'
import TextInput from '../../TextInput'
import { Newline } from 'ink'
import { ProviderType } from '../../../utils/config/types'
import { ScreenContainer } from '../ModelSelector'

type ApiKeyInputScreenProps = {
  selectedProvider: ProviderType
  anthropicProviderType: 'official' | 'bigdream' | 'opendev' | 'custom'
  apiKey: string
  handleApiKeyChange: (value: string) => void
  handleApiKeySubmit: (key: string) => void
  isLoadingModels: boolean
  modelLoadError: string | null
  cursorOffset: number
  handleCursorOffsetChange: (offset: number) => void
  exitState: { pending: boolean; keyName: string }
  getProviderLabel: (provider: string, modelCount: number) => string
}

export function ApiKeyInputScreen({
  selectedProvider,
  anthropicProviderType,
  apiKey,
  handleApiKeyChange,
  handleApiKeySubmit,
  isLoadingModels,
  modelLoadError,
  cursorOffset,
  handleCursorOffsetChange,
  exitState,
  getProviderLabel,
}: ApiKeyInputScreenProps) {
  const modelTypeText = 'this model profile'

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
          API Key Setup{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>
            Enter your {getProviderLabel(selectedProvider, 0).split(' (')[0]}{' '}
            API key for {modelTypeText}:
          </Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              This key will be stored locally and used to access the{' '}
              {selectedProvider} API.
              <Newline />
              Your key is never sent to our servers.
              <Newline />
              <Newline />
              {selectedProvider === 'kimi' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://platform.moonshot.cn/console/api-keys
                  </Text>
                </>
              )}
              {selectedProvider === 'deepseek' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://platform.deepseek.com/api_keys
                  </Text>
                </>
              )}
              {selectedProvider === 'siliconflow' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://cloud.siliconflow.cn/i/oJWsm6io
                  </Text>
                </>
              )}
              {selectedProvider === 'qwen' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://bailian.console.aliyun.com/?tab=model#/api-key
                  </Text>
                </>
              )}
              {selectedProvider === 'glm' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://open.bigmodel.cn (API Keys section)
                  </Text>
                </>
              )}
              {selectedProvider === 'minimax' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://www.minimax.io/platform/user-center/basic-information
                  </Text>
                </>
              )}
              {selectedProvider === 'baidu-qianfan' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://console.bce.baidu.com/iam/#/iam/accesslist
                  </Text>
                </>
              )}
              {selectedProvider === 'anthropic' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    {anthropicProviderType === 'official'
                      ? 'https://console.anthropic.com/settings/keys'
                      : anthropicProviderType === 'bigdream'
                        ? 'https://api-key.info/register?aff=MSl4'
                        : anthropicProviderType === 'opendev'
                          ? 'https://api.openai-next.com/register/?aff_code=4xo7'
                          : 'your custom API provider'}
                  </Text>
                </>
              )}
              {selectedProvider === 'openai' && (
                <>
                  💡 Get your API key from:{' '}
                  <Text color="blue">
                    https://platform.openai.com/api-keys
                  </Text>
                </>
              )}
            </Text>
          </Box>

          <Box>
            <TextInput
              placeholder="sk-..."
              value={apiKey}
              onChange={handleApiKeyChange}
              onSubmit={handleApiKeySubmit}
              mask="*"
              columns={500}
              cursorOffset={cursorOffset}
              onChangeCursorOffset={handleCursorOffsetChange}
              showCursor={true}
            />
          </Box>

          <Box marginTop={1}>
            <Text>
              <Text color="blue" dimColor={!apiKey}>
                [Submit API Key]
              </Text>
              <Text>
                {' '}
                - Press Enter or click to continue with this API key
              </Text>
            </Text>
          </Box>

          {isLoadingModels && (
            <Box>
              <Text color="blue">
                Loading available models...
              </Text>
            </Box>
          )}
          {modelLoadError && (
            <Box>
              <Text color="red">Error: {modelLoadError}</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor>
              Press <Text color="blue">Enter</Text> to continue,{' '}
              <Text color="blue">Tab</Text> to{' '}
              {selectedProvider === 'anthropic' ||
              selectedProvider === 'kimi' ||
              selectedProvider === 'deepseek' ||
              selectedProvider === 'qwen' ||
              selectedProvider === 'glm' ||
              selectedProvider === 'minimax' ||
              selectedProvider === 'baidu-qianfan' ||
              selectedProvider === 'siliconflow' ||
              selectedProvider === 'custom-openai'
                ? 'skip to manual model input'
                : 'skip using a key'}
              , or <Text color="blue">Esc</Text> to go back
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}