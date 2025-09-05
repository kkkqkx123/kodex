// src/utils/fetchPolyfill.ts
// Polyfill global fetch for Anthropic SDK
// This file should be imported at the entry point of the application

import { fetch } from 'undici';

// Type assertion to resolve bun-types conflict
const typedFetch = fetch as unknown as typeof globalThis.fetch;

globalThis.fetch = typedFetch;