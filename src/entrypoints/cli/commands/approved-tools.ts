// approved-tools 命令模块
import { Command } from '@commander-js/extra-typings';
import { CommandInterface } from '../types';
import { 
  handleListApprovedTools, 
  handleRemoveApprovedTool 
} from '../../../commands/approvedTools';
import { getCwd } from '../../../utils/state';
import { logEvent } from '../../../services/featureFlags';

/**
 * approved-tools 命令实现
 */
const approvedToolsCommand: CommandInterface = {
  name: 'approved-tools',
  description: 'Manage approved tools',
  
  configure(program: Command): Command {
    const allowedTools = program
      .command('approved-tools')
      .description('Manage approved tools');

    allowedTools
      .command('list')
      .description('List all approved tools')
      .action(async () => {
        const result = handleListApprovedTools(getCwd());
        console.log(result);
        process.exit(0);
      });

    allowedTools
      .command('remove <tool>')
      .description('Remove a tool from the list of approved tools')
      .action(async (tool: string) => {
        const result = handleRemoveApprovedTool(tool);
        logEvent('tengu_approved_tool_remove', {
          tool,
          success: String(result.success),
        });
        console.log(result.message);
        process.exit(result.success ? 0 : 1);
      });

    return program;
  },
  
  async execute(args: any): Promise<void> {
    // approved-tools命令主要通过子命令执行，这里不需要额外的执行逻辑
  }
};

export default approvedToolsCommand;