# Agents 模块重构实施计划

## 实施步骤详情

### 第一步：创建基础目录结构
```bash
# 创建agents模块目录结构
mkdir -p src/agents/{types,utils,components/{common,creation,editing,viewing},services}
```

### 第二步：提取类型定义

**src/agents/types/index.ts**
```typescript
export * from './AgentConfig';
export * from './CreateState'; 
export * from './ModeState';
export * from './Tool';
```

**src/agents/types/AgentConfig.ts**
```typescript
export interface AgentConfig {
  agentType: string;
  whenToUse: string;
  tools: string[] | '*';
  systemPrompt: string;
  location: 'built-in' | 'user' | 'project';
  color?: string;
  model_name?: string;
}

export const AGENT_LOCATIONS = {
  USER: "user",
  PROJECT: "project", 
  BUILT_IN: "built-in",
  ALL: "all"
} as const;

export type AgentLocation = typeof AGENT_LOCATIONS[keyof typeof AGENT_LOCATIONS];
```

**src/agents/types/CreateState.ts**
```typescript
export interface CreateState {
  location: AgentLocation | null;
  agentType: string;
  method: 'generate' | 'manual' | null;
  generationPrompt: string;
  whenToUse: string;
  selectedTools: string[];
  selectedModel: string | null;
  selectedColor: string | null;
  systemPrompt: string;
  isGenerating: boolean;
  wasGenerated: boolean;
  isAIGenerated: boolean;
  error: string | null;
  warnings: string[];
  agentTypeCursor: number;
  whenToUseCursor: number;
  promptCursor: number;
  generationPromptCursor: number;
}
```

### 第三步：提取工具函数

**src/agents/utils/index.ts**
```typescript
export * from './agentUtils';
export * from './validationUtils';
export * from './fileUtils';
export * from './aiUtils';
```

**src/agents/utils/agentUtils.ts**
```typescript
import { getModelManager } from '../../utils/model';

export function getDisplayModelName(modelId?: string | null): string {
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
```

**src/agents/utils/validationUtils.ts**
```typescript
import { AgentConfig } from '../types';

export function validateAgentType(agentType: string, existingAgents: AgentConfig[] = []) {
  // 实现验证逻辑
}

export function validateAgentConfig(config: Partial<CreateState>, existingAgents: AgentConfig[] = []) {
  // 实现配置验证逻辑
}
```

### 第四步：提取UI组件

**src/agents/components/common/Header.tsx**
```typescript
import React from 'react';
import { Box, Text } from 'ink';
import { getTheme } from '../../../utils/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, step, totalSteps, children }: HeaderProps) {
  const theme = getTheme();
  return (
    <Box flexDirection="column">
      <Text bold color={theme.primary}>{title}</Text>
      {subtitle && (
        <Text color={theme.secondary}>
          {step && totalSteps ? `Step ${step}/${totalSteps}: ` : ''}{subtitle}
        </Text>
      )}
      {children}
    </Box>
  );
}
```

### 第五步：创建主入口

**src/agents/index.ts**
```typescript
export { AgentsUI } from './components/AgentsUI';
export * from './types';
export * from './utils';
```

### 第六步：简化命令入口

**src/commands/agents.tsx**
```typescript
import React from 'react';
import { AgentsUI } from '../agents';

export default {
  name: 'agents',
  description: 'Manage agent configurations',
  type: 'local-jsx' as const,
  isEnabled: true,
  isHidden: false,
  
  async call(onExit: (message?: string) => void) {
    return <AgentsUI onExit={onExit} />;
  },
  
  userFacingName() {
    return 'agents';
  }
};
```

## 迁移顺序建议

1. **首先迁移类型定义** - 最低风险
2. **然后迁移工具函数** - 基础功能
3. **接着迁移通用组件** - Header, SelectList等
4. **再迁移业务组件** - 创建、编辑、查看组件
5. **最后迁移主组件** - AgentsUI
6. **更新所有导入路径**
7. **进行完整测试**

## 导入路径更新映射

| 原路径 | 新路径 |
|--------|--------|
| `../utils/agentLoader` | `../../utils/agentLoader` |
| `./components/Header` | `../agents/components/common/Header` |
| 工具函数 | `../agents/utils` |
| 类型定义 | `../agents/types` |

## 测试验证清单

- [ ] 代理列表显示正常
- [ ] 代理创建流程正常工作
- [ ] 代理编辑功能正常
- [ ] 代理删除功能正常
- [ ] 工具选择功能正常
- [ ] 模型选择功能正常
- [ ] 颜色选择功能正常
- [ ] 文件操作功能正常
- [ ] AI生成功能正常
- [ ] 所有键盘导航正常
- [ ] 错误处理正常

## 风险缓解措施

1. **分阶段迁移**：每次只迁移一个小功能模块
2. **充分测试**：每个阶段完成后进行完整测试
3. **版本控制**：使用git分支进行开发
4. **回滚计划**：准备好回滚到旧版本的方案

## 预计时间分配

- 类型定义提取：2小时
- 工具函数迁移：4小时  
- UI组件迁移：8小时
- 主组件迁移：4小时
- 测试和修复：6小时
- 文档更新：2小时

**总计：约26小时**

## 完成标准

- [ ] 所有测试通过
- [ ] 代码行数减少80%以上
- [ ] 组件可测试性提高
- [ ] 代码可维护性提高
- [ ] 性能无退化
- [ ] 功能完整性保持100%