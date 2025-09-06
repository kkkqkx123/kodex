import { getModelManager } from '../../utils/model';

export function getDisplayModelName(modelId?: string | null): string {
  // null/undefined means inherit from parent (task model)
  if (!modelId) return 'Inherit';
  
  try {
    const profiles = getModelManager().getActiveModelProfiles();
    const profile = profiles.find((p: any) => p.modelName === modelId || p.name === modelId);
    return profile ? profile.name : `Custom (${modelId})`;
  } catch (error) {
    console.warn('Failed to get model profiles:', error);
    return modelId ? `Custom (${modelId})` : 'Inherit';
  }
}