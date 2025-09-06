import React from 'react'
import { CostThresholdDialog } from '../../components/CostThresholdDialog'
import { type DialogManagerProps } from '../REPL.types'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config'
import { logEvent } from '../../services/featureFlags'

export const DialogManager: React.FC<DialogManagerProps> = ({
  showCostDialog,
  haveShownCostDialog,
  isLoading,
  verbose,
}) => {
  // only show the dialog once not loading
  const showingCostDialog = !isLoading && showCostDialog

  const handleCostDialogDone = () => {
    // This would be handled by the state manager
    // setShowCostDialog(false)
    // setHaveShownCostDialog(true)
    const projectConfig = getGlobalConfig()
    saveGlobalConfig({
      ...projectConfig,
      hasAcknowledgedCostThreshold: true,
    })
    logEvent('tengu_cost_threshold_acknowledged', {})
  }

  return (
    <>
      {showingCostDialog && (
        <CostThresholdDialog
          onDone={handleCostDialogDone}
        />
      )}
    </>
  )
}