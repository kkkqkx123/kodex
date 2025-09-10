# Connection Testing Utilities

This document outlines the structure and responsibilities of the connection testing utilities that will be extracted from the ModelSelector component.

## Utility Structure

The connection testing utilities will be organized by test type:

```
src/components/ModelSelector/utils/connection-testing/
├── index.ts                 # Main export file
├── chat-endpoint.ts        # Standard chat endpoint testing
├── provider-specific.ts    # Provider-specific testing
└── gpt5.ts                 # GPT-5 specific testing
```

## Key Functions

### 1. testConnection (Main Entry Point)
- **Purpose**: Main function to test connection based on provider
- **Parameters**: Provider, model, API key, base URL, max tokens
- **Returns**: Promise<ConnectionTestResult>
- **Features**:
  - Route to appropriate testing function based on provider
  - Handle GPT-5 specific testing
  - Coordinate between different testing strategies

### 2. testChatEndpoint
- **Purpose**: Test standard chat completion endpoints
- **Parameters**: baseURL, endpointPath, endpointName, test parameters
- **Returns**: Promise<ConnectionTestResult>
- **Features**:
  - Support for different endpoint paths (/chat/completions, /v1/chat/completions)
  - Standardized test payload with "YES" response verification
  - GPT-5 parameter compatibility handling
  - Comprehensive error handling with detailed messages

### 3. testResponsesEndpoint
- **Purpose**: Test GPT-5 Responses API endpoints
- **Parameters**: baseURL, endpointPath, endpointName, test parameters
- **Returns**: Promise<ConnectionTestResult>
- **Features**:
  - Specialized handling for GPT-5 Responses API
  - Reasoning configuration for better performance
  - Detailed error handling with specific guidance
  - Fallback to Chat Completions API

### 4. testProviderSpecificEndpoint
- **Purpose**: Test provider-specific endpoints
- **Parameters**: Provider, API key, base URL
- **Returns**: Promise<ConnectionTestResult>
- **Features**:
  - Anthropic SDK integration for official testing
  - Placeholder success for other providers
  - Provider-specific error handling

## GPT-5 Specific Functions

### 1. validateGPT5Config
- **Purpose**: Validate GPT-5 configuration before testing
- **Parameters**: Model, API key, base URL, max tokens, provider
- **Returns**: { valid: boolean, errors: string[] }
- **Features**:
  - Parameter validation for GPT-5 requirements
  - Provider-specific validation rules
  - Detailed error messages

### 2. testGPT5Connection
- **Purpose**: Specialized GPT-5 connection testing
- **Parameters**: Model, API key, base URL, max tokens, provider
- **Returns**: Promise<ConnectionTestResult>
- **Features**:
  - Integration with existing GPT-5 testing service
  - Fallback strategies for different API versions
  - Specialized error handling for GPT-5

## Test Result Structure

```typescript
interface ConnectionTestResult {
  success: boolean
  message: string
  endpoint?: string
  details?: string
}
```

## Testing Strategies

### 1. Standard Approach
- Send a simple test message requesting "YES" response
- Verify response content matches expectation
- Handle different response formats (choices, reply, output)

### 2. Provider-Specific Approach
- Use official SDKs where available (Anthropic)
- Implement provider-specific test payloads
- Handle provider-specific error codes

### 3. Fallback Approach
- Try multiple endpoints in order of preference
- Provide detailed error information for each attempt
- Offer actionable suggestions for common issues

## Error Handling

### Common Error Types
1. **Authentication Errors**: Invalid API keys or missing credentials
2. **Connection Errors**: Network issues or unreachable endpoints
3. **Rate Limiting**: Too many requests to the API
4. **Model Errors**: Invalid model or unsupported features
5. **Parameter Errors**: Incorrect parameter formats or values

### Error Response Enhancement
- Add provider-specific suggestions
- Include troubleshooting tips
- Provide links to relevant documentation
- Suggest alternative approaches

## Integration Points

### 1. With State Management
- Update `setIsTestingConnection` during tests
- Update `setConnectionTestResult` with results
- Handle auto-advance on successful tests

### 2. With Navigation
- Navigate to confirmation screen on successful test
- Allow retry on failed tests
- Handle loading states during testing

### 3. With Services
- Utilize existing services like `testGPT5Connection`
- Integrate with provider SDKs
- Use specialized testing functions

## Benefits

1. **Separation of Concerns**: Connection testing logic is separated from UI logic
2. **Reusability**: Utilities can be used across different components
3. **Maintainability**: Easier to understand and modify testing logic
4. **Testability**: Individual functions can be tested in isolation
5. **Provider Isolation**: Each provider's testing logic is contained in its own module

## Design Considerations

1. **Consistent Interface**: All functions return Promise<ConnectionTestResult>
2. **Comprehensive Testing**: Cover different endpoint types and response formats
3. **User-Friendly Feedback**: Clear success/failure messages with actionable guidance
4. **Fallback Strategies**: Implement fallbacks for unreliable endpoints
5. **Performance**: Optimize for quick response times
6. **Extensibility**: Easy to add new providers or testing approaches

## Future Extensions

1. **Parallel Testing**: Test multiple endpoints simultaneously
2. **Performance Metrics**: Collect and display performance data
3. **Advanced Diagnostics**: More detailed diagnostic information
4. **Automated Fixes**: Suggest and apply common fixes automatically