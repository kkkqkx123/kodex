import React from 'react'
import { Box, Text } from 'ink'
import TextInput from '../../TextInput'
import { Newline } from 'ink'
import { ProviderType } from '../../../utils/config/types'

type ModelInputScreenProps = {
  selectedProvider: ProviderType
  customModelName: string
  setCustomModelName: (value: string) => void
  handleCustomModelSubmit: (model: string) => void
  customModelNameCursorOffset: number
  setCustomModelNameCursorOffset: (offset: number) => void
 exitState: { pending: boolean; keyName: string }
}

export function ModelInputScreen({
  selectedProvider,
  customModelName,
  setCustomModelName,
  handleCustomModelSubmit,
  customModelNameCursorOffset,
  setCustomModelNameCursorOffset,
  exitState,
}: ModelInputScreenProps) {
  const modelTypeText = 'this model profile'

  // Determine the screen title and description based on provider
  let screenTitle = 'Manual Model Setup'
  let description = 'Enter the model name manually'
  let placeholder = 'gpt-4'
  let examples = 'For example: "gpt-4", "gpt-3.5-turbo", etc.'

  if (selectedProvider === 'azure') {
    screenTitle = 'Azure Model Setup'
    description = `Enter your Azure OpenAI deployment name for ${modelTypeText}:`
    examples = 'For example: "gpt-4", "gpt-35-turbo", etc.'
    placeholder = 'gpt-4'
  } else if (selectedProvider === 'anthropic') {
    screenTitle = 'Claude Model Setup'
    description = `Enter the Claude model name for ${modelTypeText}:`
    examples =
      'For example: "claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", etc.'
    placeholder = 'claude-3-5-sonnet-latest'
  } else if (selectedProvider === 'bigdream') {
    screenTitle = 'BigDream Model Setup'
    description = `Enter the BigDream model name for ${modelTypeText}:`
    examples =
      'For example: "claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", etc.'
    placeholder = 'claude-3-5-sonnet-latest'
  } else if (selectedProvider === 'kimi') {
    screenTitle = 'Kimi Model Setup'
    description = `Enter the Kimi model name for ${modelTypeText}:`
    examples = 'For example: "kimi-k2-0711-preview"'
    placeholder = 'kimi-k2-0711-preview'
  } else if (selectedProvider === 'deepseek') {
    screenTitle = 'DeepSeek Model Setup'
    description = `Enter the DeepSeek model name for ${modelTypeText}:`
    examples =
      'For example: "deepseek-chat", "deepseek-coder", "deepseek-reasoner", etc.'
    placeholder = 'deepseek-chat'
  } else if (selectedProvider === 'siliconflow') {
    screenTitle = 'SiliconFlow Model Setup'
    description = `Enter the SiliconFlow model name for ${modelTypeText}:`
    examples =
      'For example: "Qwen/Qwen2.5-72B-Instruct", "meta-llama/Meta-Llama-3.1-8B-Instruct", etc.'
    placeholder = 'Qwen/Qwen2.5-72B-Instruct'
  } else if (selectedProvider === 'qwen') {
    screenTitle = 'Qwen Model Setup'
    description = `Enter the Qwen model name for ${modelTypeText}:`
    examples = 'For example: "qwen-plus", "qwen-turbo", "qwen-max", etc.'
    placeholder = 'qwen-plus'
  } else if (selectedProvider === 'glm') {
    screenTitle = 'GLM Model Setup'
    description = `Enter the GLM model name for ${modelTypeText}:`
    examples = 'For example: "glm-4", "glm-4v", "glm-3-turbo", etc.'
    placeholder = 'glm-4'
  } else if (selectedProvider === 'minimax') {
    screenTitle = 'MiniMax Model Setup'
    description = `Enter the MiniMax model name for ${modelTypeText}:`
    examples =
      'For example: "abab6.5s-chat", "abab6.5g-chat", "abab5.5s-chat", etc.'
    placeholder = 'abab6.5s-chat'
  } else if (selectedProvider === 'baidu-qianfan') {
    screenTitle = 'Baidu Qianfan Model Setup'
    description = `Enter the Baidu Qianfan model name for ${modelTypeText}:`
    examples =
      'For example: "ERNIE-4.0-8K", "ERNIE-3.5-8K", "ERNIE-Speed-128K", etc.'
    placeholder = 'ERNIE-4.0-8K'
  } else if (selectedProvider === 'custom-openai') {
    screenTitle = 'Custom API Model Setup'
    description = `Enter the model name for ${modelTypeText}:`
    examples = 'Enter the exact model name as supported by your API endpoint.'
    placeholder = 'model-name'
  }

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
          {screenTitle}{' '}
          {exitState.pending
            ? `(press ${exitState.keyName} again to exit)`
            : ''}
        </Text>
        <Box flexDirection="column" gap={1}>
          <Text bold>{description}</Text>
          <Box flexDirection="column" width={70}>
            <Text color="gray">
              {selectedProvider === 'azure'
                ? 'This is the deployment name you configured in your Azure OpenAI resource.'
                : selectedProvider === 'anthropic'
                  ? 'This should be a valid Claude model identifier from Claude.'
                  : selectedProvider === 'bigdream'
                    ? 'This should be a valid Claude model identifier supported by BigDream.'
                    : selectedProvider === 'kimi'
                      ? 'This should be a valid Kimi model identifier from Moonshot AI.'
                      : selectedProvider === 'deepseek'
                        ? 'This should be a valid DeepSeek model identifier.'
                        : selectedProvider === 'siliconflow'
                          ? 'This should be a valid SiliconFlow model identifier.'
                          : selectedProvider === 'qwen'
                            ? 'This should be a valid Qwen model identifier from Alibaba Cloud.'
                            : selectedProvider === 'glm'
                              ? 'This should be a valid GLM model identifier from Zhipu AI.'
                              : selectedProvider === 'minimax'
                                ? 'This should be a valid MiniMax model identifier.'
                                : selectedProvider === 'baidu-qianfan'
                                  ? 'This should be a valid Baidu Qianfan model identifier.'
                                  : 'This should match the model name supported by your API endpoint.'}
              <Newline />
              {examples}
            </Text>
          </Box>

          <Box>
            <TextInput
              placeholder={placeholder}
              value={customModelName}
              onChange={setCustomModelName}
              onSubmit={handleCustomModelSubmit}
              columns={100}
              cursorOffset={customModelNameCursorOffset}
              onChangeCursorOffset={setCustomModelNameCursorOffset}
              showCursor={true}
            />
          </Box>

          <Box marginTop={1}>
            <Text>
              <Text color="blue" dimColor={!customModelName}>
                [Submit Model Name]
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