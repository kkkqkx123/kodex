import { resolveFileReferences } from '../../src/services/customCommands';

async function testFileEmbedding() {
    // 测试文件内容嵌入
    const testContent = '请查看这个文件 @test-file.txt';
    const result = await resolveFileReferences(testContent);
    console.log('文件内容嵌入测试:');
    console.log(result);
    console.log('\n' + '='.repeat(50) + '\n');
}

async function testFolderEmbedding() {
    // 测试文件夹内容嵌入（需要创建一个测试文件夹）
    const testContent = '请查看这个文件夹 @src';
    const result = await resolveFileReferences(testContent);
    console.log('文件夹内容嵌入测试:');
    console.log(result);
}

async function runTests() {
    try {
        await testFileEmbedding();
        await testFolderEmbedding();
        console.log('✅ 所有测试完成，自动退出...');
        process.exit(0);
    } catch (error) {
        console.error('测试失败:', error);
        process.exit(1);
    }
}

runTests();