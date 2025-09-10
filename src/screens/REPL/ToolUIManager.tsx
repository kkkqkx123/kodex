import React from 'react'
import { Box } from 'ink'
import { Spinner } from '../../components/Spinner'
import { BinaryFeedback } from '../../components/binary-feedback/BinaryFeedback'
import {
  PermissionRequest,
  type ToolUseConfirm,
} from '../../components/permissions/PermissionRequest'
import { CostThresholdDialog } from '../../components/CostThresholdDialog'
import { type ToolUIManagerProps } from '../REPL.types'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config'
import { logEvent } from '../../services/featureFlags'

export const ToolUIManager: React.FC<ToolUIManagerProps> = ({
  toolJSX,
  toolUseConfirm,
  binaryFeedbackContext,
  isMessageSelectorVisible,
  showingCostDialog,
  verbose,
  normalizedMessages,
  tools,
  debug,
  erroredToolUseIDs,
  inProgressToolUseIDs,
  unresolvedToolUseIDs,
}) => {
  return (
    <>
      {/* 调整Spinner显示条件，在任务执行时也能显示 */}
      {!toolJSX && !toolUseConfirm && !binaryFeedbackContext && (showingCostDialog || inProgressToolUseIDs.size > 0) && (
        <Spinner />
      )}
      {toolJSX ? toolJSX.jsx : null}
      {!toolJSX && binaryFeedbackContext && !isMessageSelectorVisible && (
        <BinaryFeedback
          m1={binaryFeedbackContext.m1}
          m2={binaryFeedbackContext.m2}
          resolve={result => {
            binaryFeedbackContext.resolve(result)
            setTimeout(() => {
              // This would be handled by the state manager
              // setBinaryFeedbackContext(null)
            }, 0)
          }}
          verbose={verbose}
          normalizedMessages={normalizedMessages}
          tools={tools}
          debug={debug}
          erroredToolUseIDs={erroredToolUseIDs}
          inProgressToolUseIDs={inProgressToolUseIDs}
          unresolvedToolUseIDs={unresolvedToolUseIDs}
        />
      )}
      {!toolJSX &&
        toolUseConfirm &&
        !isMessageSelectorVisible &&
        !binaryFeedbackContext && (
          <PermissionRequest
            toolUseConfirm={toolUseConfirm}
            onDone={() => {
              // This would be handled by the state manager
              // setToolUseConfirm(null)
            }}
            verbose={verbose}
          />
        )}
      {!toolJSX &&
        !toolUseConfirm &&
        !isMessageSelectorVisible &&
        !binaryFeedbackContext &&
        showingCostDialog && (
          <CostThresholdDialog
            onDone={() => {
              // This would be handled by the state manager
              // setShowCostDialog(false)
              // setHaveShownCostDialog(true)
              const projectConfig = getGlobalConfig()
              saveGlobalConfig({
                ...projectConfig,
                hasAcknowledgedCostThreshold: true,
              })
              logEvent('tengu_cost_threshold_acknowledged', {})
            }}
          />
        )}
    </>
  )
}

export const ToolUIRenderer: React.FC<{
  toolUIManagerProps: ToolUIManagerProps
}> = ({ toolUIManagerProps }) => {
  return (
    <Box
      borderColor="red"
      borderStyle={toolUIManagerProps.debug ? 'single' : undefined}
      flexDirection="column"
      width="100%"
    >
      <ToolUIManager {...toolUIManagerProps} />
    </Box>
  )
}