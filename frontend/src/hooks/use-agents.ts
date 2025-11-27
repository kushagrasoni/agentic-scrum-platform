/**
 * React Query Hooks for Agent Execution
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ExecutionRequest, ExecutionResponse, AgentStatusResponse } from '@/types';

export function useExecuteAgents() {
  const queryClient = useQueryClient();
  
  return useMutation<ExecutionResponse, Error, ExecutionRequest>({
    mutationFn: (payload) => apiClient.agents.execute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useAgentStatus(sessionId: string | null, enabled = true) {
  return useQuery<AgentStatusResponse>({
    queryKey: ['agent-status', sessionId],
    queryFn: () => apiClient.agents.getStatus(sessionId!),
    enabled: enabled && !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

export function useCancelExecution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => apiClient.agents.cancel(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['agent-status', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
