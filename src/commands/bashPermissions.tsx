import { Text } from 'ink'
import React from 'react'
import { Command } from '../commands'
import { bashPermissionManager, BashPermissionConfig, PrefixPermission } from '../utils/bashPermissions'

const bashPermissionsCommand: Command = {
  name: 'bash-permissions',
  description: 'Manage bash command permissions and overrides',
  isEnabled: true,
  isHidden: false,
  type: 'local-jsx',
  userFacingName() {
    return 'bash-permissions'
  },
  async call() {
    // This command will show the bash permissions management interface
    return {
      type: 'component',
      component: <BashPermissionsManager />
    }
  },
}

// React component for managing bash permissions
function BashPermissionsManager() {
  // For now, just show current config status
  const config = bashPermissionManager.getMergedConfig()
  
  return (
    <Text>
      <Text color="green">Bash Permissions Manager</Text>
      {'\n'}
      <Text>Current configuration:</Text>
      {'\n'}
      <Text>  Strict mode: {config.strictMode ? 'enabled' : 'disabled'}</Text>
      {'\n'}
      <Text>  Override banned commands: {config.overrideBannedCommands?.length || 0}</Text>
      {'\n'}
      <Text>  Prefix permissions: {config.prefixPermissions?.length || 0}</Text>
      {'\n'}
      <Text>  Globally allowed commands: {config.globallyAllowedCommands?.length || 0}</Text>
      {'\n'}
      <Text>  Globally banned commands: {config.globallyBannedCommands?.length || 0}</Text>
      {'\n'}
      {'\n'}
      <Text color="yellow">Usage examples:</Text>
      {'\n'}
      <Text>  - Add prefix permission: kode bash-permissions add-prefix "git commit" --allowed</Text>
      {'\n'}
      <Text>  - Override banned commands: kode bash-permissions set-banned "del,rm,format"</Text>
      {'\n'}
      <Text>  - Enable strict mode: kode bash-permissions strict-mode enable</Text>
    </Text>
  )
}

export default bashPermissionsCommand