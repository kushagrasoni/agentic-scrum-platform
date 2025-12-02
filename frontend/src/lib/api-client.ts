/**
 * API Client for Agentic Scrum Platform
 * Handles all HTTP requests to the FastAPI backend
 */

import type {
  ApiConfig,
  TestConnectionResponse,
  ExecutionRequest,
  ExecutionResponse,
  AgentStatusResponse,
  Session,
  Artifact,
} from '@/types';

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
    execute: async (payload: ExecutionRequest): Promise<ExecutionResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/agents/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<ExecutionResponse>(response);
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
  },

  // Artifacts endpoints
  artifacts: {
    list: async (sessionId: string): Promise<Artifact[]> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}`);
      return handleResponse<Artifact[]>(response);
    },
    
    get: async (sessionId: string, fileName: string): Promise<string> => {
      const response = await fetch(`${API_BASE_URL}/api/artifacts/${sessionId}/${fileName}`);
      return handleResponse<string>(response);
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
  },

  baseURL: API_BASE_URL,
};
