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

export type AgentName =
  | 'product_owner'
  | 'scrum_master'
  | 'tech_lead'
  | 'developer'
  | 'qa_automation'
  | 'release_manager';

// Session Types
export interface Session {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'error' | 'cancelled' | 'failed';
  config: ApiConfig;
  agents: string[];
  artifacts: (string | Artifact)[];
  error?: string;
  flowType?: 'single_agent' | 'mini_flow' | 'feature_workflow';
  flowLabel?: string;
}

// Execution Request
export interface ExecutionRequest {
  llmProfileId?: string;
  config?: ApiConfig;
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

export interface SingleAgentRequest {
  llmProfileId: string;
  agentName: AgentName;
  inputs: {
    [key: string]: string;
  };
  context?: {
    [key: string]: string;
  };
}

export interface SingleAgentResponse {
  sessionId: string;
  agent: AgentName;
  output: string;
  status: 'completed' | 'error';
}

// Mini Flow Types
export interface MiniFlowRequest {
  llmProfileId: string;
  flowId: string;
  flowLabel: string;
  agents: AgentName[];
  inputs: {
    [key: string]: string;
  };
  context?: {
    [key: string]: string;
  };
}

export interface MiniFlowAgentResult {
  agent: AgentName;
  output: string;
  status: 'completed' | 'error';
}

export interface MiniFlowResponse {
  sessionId: string;
  status: 'completed' | 'error';
  outputs: MiniFlowAgentResult[];
  artifacts: string[];
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

export interface CheckpointMessage {
  agent: string;
  content: string;
  timestamp: string;
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

// Telemetry Types
export interface AgentTelemetry {
  agentName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  model: string;
  estimatedCost: number;
  startTime: string;
  endTime: string;
}

export interface SessionTelemetry {
  sessionId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalLatencyMs: number;
  totalEstimatedCost: number;
  model: string;
  provider: string;
  agents: AgentTelemetry[];
  createdAt: string;
}

export interface TelemetrySummary {
  totalSessions: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCost: number;
  avgTokensPerSession: number;
  avgLatencyPerSession: number;
  modelUsage: Record<string, number>;
  providerUsage: Record<string, number>;
}
