// 示例命令模块
import { Command } from '@commander-js/extra-typings';
import { CommandInterface } from '../types';

/**
 * 示例命令实现
 */
const exampleCommand: CommandInterface = {
  name: 'example',
  description: '示例命令',
  
  configure(program: Command): Command {
    return program
      .command('example')
      .description('示例命令')
      .action(async () => {
        await this.execute({});
      });
  },
  
  async execute(args: any): Promise<void> {
    console.log('示例命令执行成功');
  }
};

export default exampleCommand;