● Based on my analysis of the /src directory, I've identified the remaining logic layers that need to be migrated to the backend. Here's a comprehensive summary:

  Remaining CLI Backend Logic to Migrate

  1. Core Query Engine

  - src/query.ts - Main query orchestration engine (801 lines)
    - Tool execution coordination
    - Message processing and validation
    - Tool call parsing and handling
    - Binary feedback support
    - Context management integration

  2. AI Service Adapters

  - src/services/claude.ts - Claude AI service (71,540 lines - needs optimization)
  - src/services/openai.ts - OpenAI-compatible service (45,901 lines)
  - src/services/modelAdapterFactory.ts - Model adapter factory (69 lines)

  3. Model Management

  - src/utils/model.ts - Model manager and switching logic (853 lines)
    - Multi-model configuration
    - Context window management
    - Model fallback mechanisms
    - Profile management

  4. Agent System

  - src/utils/agentLoader.ts - Agent configuration loading (280 lines)
    - Dynamic agent loading from markdown files
    - Priority-based agent selection
    - Hot reload support

  5. Message Context Management

  - src/utils/messageContextManager.ts - Context window management (282 lines)
    - Smart message truncation
    - Multiple retention strategies
    - Token counting and optimization

  6. MCP (Model Context Protocol) Client

  - src/services/mcpClient.ts - MCP tool integration (642 lines)
    - External tool connections
    - Dynamic tool loading
    - Server management

  7. Permission System

  - src/permissions.ts - Tool permission management (428 lines)
    - Command-level permissions
    - Project-level permission configuration
    - Interactive permission UI support

  8. Tool Registry

  - src/tools.ts - Tool registration and management (70 lines)
    - Tool discovery and filtering
    - MCP tool integration

  9. Configuration System

  - src/utils/config.ts - Configuration re-export (points to modular system)
  - src/utils/config/ - Modular configuration system
    - Environment variable handling
    - Multi-level configuration merging
    - Model profile management

  10. Context Management

  - src/context.ts - Project context understanding
  - src/utils/contextStatistics.ts - Context analytics

  11. Monitoring and Debugging

  - src/utils/debugLogger.ts - Comprehensive logging system
  - src/services/TaskMonitor.ts - Task execution monitoring
  - src/utils/toolExecutionController.ts - Tool execution coordination

  12. State Management

  - src/utils/state.ts - Application state management
  - src/utils/sessionState.ts - Session state persistence

● Migration Plan for Remaining Components

  Phase 2: Core Backend Services (High Priority)

  2.1 Query Engine Migration

  - Target: src/query.ts → backend/src/services/query/
  - Components:
    - Query orchestration service
    - Tool execution coordinator
    - Message processing pipeline
    - Tool call parser and validator

  2.2 AI Service Integration

  - Target: src/services/claude.ts, src/services/openai.ts → backend/src/services/ai/
  - Components:
    - Unified AI service interface
    - Multi-provider support (Claude, OpenAI, GPT-5)
    - Streaming response handling
    - Error recovery and retry logic

  2.3 Model Management System

  - Target: src/utils/model.ts → backend/src/services/model/
  - Components:
    - Model profile management
    - Context window optimization
    - Model switching and fallback
    - Capability validation

  Phase 3: Advanced Features (Medium Priority)

  3.1 Agent System Enhancement

  - Target: src/utils/agentLoader.ts → backend/src/services/agent/
  - Components:
    - Dynamic agent loading
    - Agent configuration management
    - Hot reload capabilities

  3.2 Context Management

  - Target: src/utils/messageContextManager.ts → backend/src/services/context/
  - Components:
    - Smart message truncation
    - Context window optimization
    - Retention strategy management

  3.3 MCP Integration

  - Target: src/services/mcpClient.ts → backend/src/services/mcp/
  - Components:
    - External tool connections
    - Dynamic tool discovery
    - Server lifecycle management

  Phase 4: Security and Permissions (Medium Priority)

  4.1 Permission System

  - Target: src/permissions.ts → backend/src/services/permissions/
  - Components:
    - Tool authorization
    - Command-level permissions
    - Project-level configuration

  4.2 Configuration Management

  - Target: src/utils/config/ → backend/src/services/config/
  - Components:
    - Hierarchical configuration
    - Environment variable handling
    - Model profile management

  Phase 5: Monitoring and Operations (Low Priority)

  5.1 Observability

  - Target: Debug logging, monitoring utilities → backend/src/services/monitoring/
  - Components:
    - Request tracing
    - Performance metrics
    - Error tracking

  5.2 State Management

  - Target: State utilities → backend/src/services/state/
  - Components:
    - Session management
    - Context persistence
    - Recovery mechanisms

● Implementation Strategy

  Key Principles for Migration:

  1. API-First Design: Convert all CLI-specific logic to RESTful APIs
  2. Stateless Services: Remove UI dependencies, make services self-contained
  3. Database Integration: Replace file-based state with PostgreSQL/Redis
  4. Security: Implement proper authentication and authorization
  5. WebSocket Support: Maintain real-time capabilities where needed

  Technical Approach:

  1. Service Layer: Create Express.js controllers for each major component
  2. Data Models: Define TypeScript interfaces and database schemas
  3. API Endpoints: Expose functionality through REST APIs
  4. WebSocket Events: Real-time updates for tool execution and messaging
  5. Error Handling: Standardized error responses and logging
  6. Testing: Unit tests for services, integration tests for APIs
