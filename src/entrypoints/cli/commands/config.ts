// config 命令模块
import { Command } from '@commander-js/extra-typings';
import { CommandInterface } from '../types';
import { setup } from '../../cli/utils';
import { 
  getConfigForCLI, 
  setConfigForCLI, 
  deleteConfigForCLI, 
  listConfigForCLI 
} from '../../../utils/config';
import { cwd } from 'process';

/**
 * config 命令实现
 */
const configCommand: CommandInterface = {
  name: 'config',
  description: 'Manage configuration',
  
  configure(program: Command): Command {
    const config = program
      .command('config')
      .description(
        `Manage configuration (eg. claude config set -g theme dark)`,
      );

    config
      .command('get <key>')
      .description('Get a config value')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .option('-g, --global', 'Use global config')
      .action(async (key, { cwd, global }) => {
        await setup(cwd, false);
        console.log(getConfigForCLI(key, global ?? false));
        process.exit(0);
      });

    config
      .command('set <key> <value>')
      .description('Set a config value')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .option('-g, --global', 'Use global config')
      .action(async (key, value, { cwd, global }) => {
        await setup(cwd, false);
        setConfigForCLI(key, value, global ?? false);
        console.log(`Set ${key} to ${value}`);
        process.exit(0);
      });

    config
      .command('remove <key>')
      .description('Remove a config value')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .option('-g, --global', 'Use global config')
      .action(async (key, { cwd, global }) => {
        await setup(cwd, false);
        deleteConfigForCLI(key, global ?? false);
        console.log(`Removed ${key}`);
        process.exit(0);
      });

    config
      .command('list')
      .description('List all config values')
      .option('-c, --cwd <cwd>', 'The current working directory', String, cwd())
      .option('-g, --global', 'Use global config', false)
      .action(async ({ cwd, global }) => {
        await setup(cwd, false);
        console.log(
          JSON.stringify(listConfigForCLI(global), null, 2),
        );
        process.exit(0);
      });

    return program;
  },
  
  async execute(args: any): Promise<void> {
    // config命令主要通过子命令执行，这里不需要额外的执行逻辑
  }
};

export default configCommand;