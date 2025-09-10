const { exec } = require('child_process');

// 模拟终端清除功能
function clearTerminal() {
  return new Promise((resolve, reject) => {
    try {
      if (process.platform === 'win32') {
        exec('cls', (error) => {
          if (error) {
            process.stdout.write('\x1b[2J\x1b[3J\x1b[H', () => resolve());
          } else {
            resolve();
          }
        });
      } else {
        process.stdout.write('\x1b[2J\x1b[3J\x1b[H', () => {
          setTimeout(resolve, 50);
        });
      }
    } catch (error) {
      reject(error);
    }
  });
}

function forceClearTerminal() {
  return new Promise((resolve, reject) => {
    try {
      if (process.platform === 'win32') {
        const aggressiveSequence = '\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m';
        process.stdout.write(aggressiveSequence, () => {
          exec('cls', (error) => {
            if (error) {
              process.stdout.write('\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m', () => {
                setTimeout(resolve, 100);
              });
            } else {
              setTimeout(resolve, 100);
            }
          });
        });
      } else {
        const aggressiveSequence = '\x1b[2J\x1b[3J\x1b[H\x1b[!p\x1b[0m';
        process.stdout.write(aggressiveSequence, () => {
          setTimeout(resolve, 100);
        });
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function testBasicClear() {
  console.log('🧪 基础清除功能测试开始...\n');
  
  // 生成测试内容
  console.log('=== 测试内容开始 ===');
  for (let i = 1; i <= 5; i++) {
    console.log(`测试行 ${i}: 这是用于验证清除功能的测试内容`);
  }
  console.log('=== 测试内容结束 ===\n');
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('执行标准清除...');
  try {
    await clearTerminal();
    console.log('✅ 标准清除完成');
  } catch (error) {
    console.error('❌ 标准清除失败:', error);
  }
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('执行强制清除...');
  try {
    await forceClearTerminal();
    console.log('✅ 强制清除完成');
  } catch (error) {
    console.error('❌ 强制清除失败:', error);
  }
  
  console.log('\n🎉 基础测试完成！');
}

// 直接运行
if (require.main === module) {
  testBasicClear().catch(console.error);
}