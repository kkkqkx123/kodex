#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kode Context Logs Formatter
用于整理.kode/context_export目录下的JSON日志文件，使其更具可读性
"""

import json
import os
import sys
import glob
from datetime import datetime
from pathlib import Path

def format_timestamp(timestamp_str):
    """格式化时间戳为可读格式"""
    try:
        dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except (ValueError, AttributeError):
        return timestamp_str

def format_message_content(content):
    """格式化消息内容"""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        formatted_parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get('type') == 'tool_use':
                    formatted_parts.append(f"[TOOL_USE] {item.get('name', 'unknown')}")
                    formatted_parts.append(f"[INPUT] {json.dumps(item.get('input', {}), ensure_ascii=False, indent=2)}")
                elif item.get('type') == 'tool_result':
                    result_content = item.get('content', '')
                    if item.get('is_error', False):
                        formatted_parts.append(f"[TOOL_ERROR] {result_content}")
                    else:
                        formatted_parts.append(f"[TOOL_RESULT] {result_content}")
                else:
                    formatted_parts.append(str(item.get('text', str(item))))
            else:
                formatted_parts.append(str(item))
        return '\n'.join(formatted_parts)
    elif isinstance(content, dict):
        return content.get('text', str(content))
    else:
        return str(content)

def format_messages(messages):
    """格式化消息列表"""
    formatted = []
    for i, msg in enumerate(messages, 1):
        role = msg.get('type', 'unknown')
        content = msg.get('message', {})
        
        if isinstance(content, dict):
            role = content.get('role', role)
            content = content.get('content', '')
        
        formatted_content = format_message_content(content)
        timestamp = format_timestamp(msg.get('timestamp', ''))
        
        formatted.append(f"{i}. [{role.upper()}] {timestamp}\n   {formatted_content}\n")
    
    return formatted

def format_context(context_data):
    """格式化上下文数据"""
    formatted = []
    
    if 'directoryStructure' in context_data:
        formatted.append("目录结构:")
        formatted.append(context_data['directoryStructure'])
        formatted.append("")
    
    if 'gitStatus' in context_data:
        formatted.append("Git状态:")
        formatted.append(context_data['gitStatus'])
        formatted.append("")
    
    if 'codeStyle' in context_data:
        formatted.append("代码风格:")
        # 截断过长的代码风格内容
        code_style = context_data['codeStyle']
        if len(code_style) > 1000:
            code_style = code_style[:1000] + "... (内容过长已截断)"
        formatted.append(code_style)
        formatted.append("")
    
    return formatted

def process_json_file(json_file_path, output_dir):
    """处理单个JSON文件"""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 创建格式化输出
        output_lines = []
        
        # 文件头信息
        output_lines.append("=" * 80)
        output_lines.append(f"KODE CONTEXT EXPORT - {Path(json_file_path).name}")
        output_lines.append("=" * 80)
        output_lines.append("")
        
        # 导出时间
        export_time = format_timestamp(data.get('timestamp', ''))
        output_lines.append(f"导出时间: {export_time}")
        output_lines.append(f"导出ID: {data.get('exportId', 'N/A')}")
        output_lines.append("")
        
        # 消息记录
        if 'messages' in data and data['messages']:
            output_lines.append("会话消息:")
            output_lines.append("-" * 40)
            formatted_messages = format_messages(data['messages'])
            output_lines.extend(formatted_messages)
        
        # 上下文信息
        if 'context' in data and data['context']:
            output_lines.append("上下文信息:")
            output_lines.append("-" * 40)
            formatted_context = format_context(data['context'])
            output_lines.extend(formatted_context)
        
        # 写入输出文件
        output_filename = f"formatted_{Path(json_file_path).stem}.txt"
        output_path = os.path.join(output_dir, output_filename)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(output_lines))
        
        print(f"✓ 已处理: {Path(json_file_path).name} -> {output_filename}")
        return True
        
    except Exception as e:
        print(f"✗ 处理文件 {Path(json_file_path).name} 时出错: {e}")
        return False

def main():
    """主函数"""
    # 确定输入和输出目录
    script_dir = Path(__file__).parent
    context_export_dir = script_dir.parent  # .kode/context_export
    output_dir = script_dir  # .kode/context_export/scripts
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 查找所有JSON文件
    json_files = glob.glob(str(context_export_dir / "*.json"))
    
    if not json_files:
        print("在 .kode/context_export 目录中未找到JSON文件")
        return
    
    print(f"找到 {len(json_files)} 个JSON文件，开始处理...")
    print("-" * 50)
    
    success_count = 0
    for json_file in json_files:
        if process_json_file(json_file, output_dir):
            success_count += 1
    
    print("-" * 50)
    print(f"处理完成! 成功: {success_count}/{len(json_files)}")
    print(f"格式化后的文件保存在: {output_dir}")

if __name__ == "__main__":
    main()