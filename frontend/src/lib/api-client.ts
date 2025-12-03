/**
 * API Client for Agentic Scrum Platform
 * Handles all HTTP requests to the FastAPI backend
 */

import type {
  ApiConfig,
  TestConnectionResponse,
  ExecutionRequest,
  ExecutionResponse,
  SingleAgentRequest,
  SingleAgentResponse,
  MiniFlowRequest,
  MiniFlowResponse,
  AgentName,
  AgentStatusResponse,
  Session,
  Artifact,
} from '@/types';
import type { StructuredAgentOutput, ValidationResult } from '@/types/agent-outputs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data
    );
  }
  return response.json();
}

export const apiClient = {
  // Configuration endpoints
  config: {
    test: async (config: any): Promise<TestConnectionResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/config/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return handleResponse<TestConnectionResponse>(response);
    },
    
    getModels: async (): Promise<string[]> => {
      const response = await fetch(`${API_BASE_URL}/api/config/models`);
      return handleResponse<string[]>(response);
    },
    
    save: async (config: ApiConfig): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/config/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return handleResponse<{ success: boolean }>(response);
    },

    profiles: {
      list: async (): Promise<Record<string, any[]>> => {
        const response = await fetch(`${API_BASE_URL}/api/config/profiles`);
        return handleResponse<Record<string, any[]>>(response);
      },
      create: async (profile: { mode: string; name: string; data: any }) => {
        const response = await fetch(`${API_BASE_URL}/api/config/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
        return handleResponse(response);
      },
      update: async (id: string, profile: { mode: string; name: string; data: any }) => {
        const response = await fetch(`${API_BASE_URL}/api/config/profiles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
        return handleResponse(response);
      },
      delete: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/config/profiles/${id}`, {
          method: 'DELETE',
        });
        return handleResponse(response);
      },
    }
  },

  // Agent execution endpoints
  agents: {
    listAvailable: async (): Promise<AgentName[]> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/available`);
      const data = await handleResponse<{ success?: boolean; data?: AgentName[] } | AgentName[]>(response);
      if (Array.isArray(data)) return data as AgentName[];
      return (data as any).data || [];
    },

    execute: async (payload: ExecutionRequest): Promise<ExecutionResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<ExecutionResponse>(response);
    },

    runSingle: async (payload: SingleAgentRequest): Promise<SingleAgentResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<SingleAgentResponse>(response);
    },

    runMiniFlow: async (payload: MiniFlowRequest): Promise<MiniFlowResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/mini-flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<MiniFlowResponse>(response);
    },
    
    getStatus: async (sessionId: string): Promise<AgentStatusResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/status/${sessionId}`);
      return handleResponse<AgentStatusResponse>(response);
    },
    
    streamSession: (sessionId: string): EventSource => {
      return new EventSource(`${API_BASE_URL}/api/agents/stream/${sessionId}`);
    },

    getLogs: (sessionId: string): EventSource => {
      return new EventSource(`${API_BASE_URL}/api/agents/logs/${sessionId}`);
    },
    
    persistSession: async (sessionId: string): Promise<{success: boolean, message: string}> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/persist/${sessionId}`, {
        method: 'POST',
      });
      return handleResponse<{success: boolean, message: string}>(response);
    },
    
    cancel: async (sessionId: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/cancel/${sessionId}`, {
        method: 'POST',
      });
      return handleResponse<{ success: boolean }>(response);
    },

    regenerate: async (sessionId: string, agentName: string): Promise<ExecutionResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/regenerate/${sessionId}/${agentName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return handleResponse<ExecutionResponse>(response);
    },

    regenerateItem: async (sessionId: string, agentName: string, itemId: string, feedback?: string): Promise<ExecutionResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/regenerate-item/${sessionId}/${agentName}/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedback || '' }),
      });
      return handleResponse<ExecutionResponse>(response);
    },
  },

  // Session management endpoints
  sessions: {
    list: async (): Promise<Session[]> => {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      const result = await handleResponse<{ success: boolean; data: Session[] }>(response);
      return result.data;
    },
    
    get: async (sessionId: string): Promise<Session> => {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      const result = await handleResponse<{ success: boolean; data: Session }>(response);
      return result.data;
    },
    
    getById: async (sessionId: string): Promise<Session> => {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      const result = await handleResponse<{ success: boolean; data: Session }>(response);
      return result.data;
    },
    
    delete: async (sessionId: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return handleResponse<{ success: boolean }>(response);
    },

    getStructured: async (sessionId: string): Promise<StructuredAgentOutput> => {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/structured`);
      const result = await handleResponse<{ success: boolean; data: StructuredAgentOutput }>(response);
      return result.data;
    },
  },

  // Artifacts endpoints
  artifacts: {
    list: async (sessionId: string): Promise<Artifact[]> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}`);
      const result = await handleResponse<{ success?: boolean; data?: Artifact[] } | Artifact[]>(response);
      if (Array.isArray(result)) return result as Artifact[];
      return (result as any).data || [];
    },
    
    get: async (sessionId: string, fileName: string): Promise<string> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}/${fileName}`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch artifact: ${response.statusText}`, response.status);
      }
      return response.text();
    },
    
    download: async (sessionId: string): Promise<Blob> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}/download`);
      if (!response.ok) {
        throw new ApiError(`Download failed: ${response.statusText}`, response.status);
      }
      return response.blob();
    },

    downloadZip: async (sessionId: string): Promise<Blob> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}/download`);
      if (!response.ok) {
        throw new ApiError(`Download failed: ${response.statusText}`, response.status);
      }
      return response.blob();
    },

    export: async (sessionId: string, format: 'jira' | 'github' | 'markdown'): Promise<Blob> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}/export?format=${format}`);
      if (!response.ok) {
        throw new ApiError(`Export failed: ${response.statusText}`, response.status);
      }
      return response.blob();
    },

    validate: async (sessionId: string, target: 'jira' | 'github' = 'jira'): Promise<ValidationResult> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}/validate?target=${target}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await handleResponse<{ success: boolean; data: ValidationResult }>(response);
      return result.data;
    },
  },

  // Integrations endpoints (Jira/GitHub)
  integrations: {
    jira: {
      connect: async (credentials: { url: string; email: string; api_token: string }) => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/jira/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        return handleResponse<{ success: boolean; message: string; data: any }>(response);
      },
      
      status: async () => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/jira/status`);
        return handleResponse<{ success: boolean; data: any }>(response);
      },
      
      disconnect: async () => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/jira/disconnect`, {
          method: 'DELETE',
        });
        return handleResponse<{ success: boolean; message: string }>(response);
      },
      
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/jira/test`, {
          method: 'POST',
        });
        return handleResponse<{ success: boolean; message: string; data: any }>(response);
      },
      
      push: async (payload: { project_key: string; items: any[]; default_issue_type?: string; default_labels?: string[] }) => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/jira/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return handleResponse<{ success: boolean; message: string; data: any }>(response);
      },
    },
    
    github: {
      connect: async (credentials: { token: string; owner?: string; repo?: string }) => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/github/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        return handleResponse<{ success: boolean; message: string; data: any }>(response);
      },
      
      status: async () => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/github/status`);
        return handleResponse<{ success: boolean; data: any }>(response);
      },
      
      disconnect: async () => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/github/disconnect`, {
          method: 'DELETE',
        });
        return handleResponse<{ success: boolean; message: string }>(response);
      },
      
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/github/test`, {
          method: 'POST',
        });
        return handleResponse<{ success: boolean; message: string; data: any }>(response);
      },
      
      push: async (payload: { owner: string; repo: string; items: any[]; default_labels?: string[] }) => {
        const response = await fetch(`${API_BASE_URL}/api/integrations/github/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return handleResponse<{ success: boolean; message: string; data: any }>(response);
      },
    },
  },

  // Telemetry endpoints
  telemetry: {
    getSession: async (sessionId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/telemetry/${sessionId}`);
      return handleResponse<{ success: boolean; data: any }>(response);
    },
    
    getSummary: async () => {
      const response = await fetch(`${API_BASE_URL}/api/telemetry/summary`);
      return handleResponse<{ success: boolean; data: any }>(response);
    },
  },

  baseURL: API_BASE_URL,
};
