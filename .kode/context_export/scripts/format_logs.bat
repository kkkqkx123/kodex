@echo off
chcp 65001 >nul
echo 正在格式化Kode上下文日志文件...
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请确保Python已安装并添加到PATH
    pause
    exit /b 1
)

REM 运行Python脚本
python format_context_logs.py

echo.
echo 格式化完成!
pause