/**
 * TypeScript Types for Agentic Scrum Platform
 */

// API Configuration Types
export interface OllamaConfig {
  mode: 'ollama';
  url: string;
  model: string;
}

export interface OpenAIConfig {
  mode: 'openai';
  apiKey: string;
  model: string;
}

export interface AzureConfig {
  mode: 'azure';
  apiKey: string;
  endpoint: string;
  deployment: string;
  apiVersion: string;
}

export type ApiConfig = OllamaConfig | OpenAIConfig | AzureConfig;

// Agent Types
export interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
}

// Session Types
export interface Session {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'error' | 'cancelled';
  config: ApiConfig;
  agents: string[];
  artifacts: string[];
  error?: string;
}

// Execution Request
export interface ExecutionRequest {
  config: ApiConfig;
  inputs: {
    [key: string]: string;
  };
}

// Execution Response
export interface ExecutionResponse {
  sessionId: string;
  status: string;
  message: string;
}

// Agent Status
export interface AgentStatusResponse {
  sessionId: string;
  status: 'running' | 'completed' | 'error' | 'cancelled';
  agents: {
    name: string;
    status: 'waiting' | 'running' | 'completed' | 'error';
    progress: number;
    error?: string;
  }[];
  artifacts: string[];
}

// Log Entry
export interface LogMessage {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  agent: string;
  message: string;
}

// Artifact Types
export interface Artifact {
  name: string;
  path: string;
  size: number;
  type: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Test Connection Response
export interface TestConnectionResponse {
  success: boolean;
  message: string;
  models?: string[];
}
