/**
 * React Query Hooks for Session Management
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Session } from '@/types';

export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => apiClient.sessions.list(),
  });
}

export function useSession(sessionId: string | null) {
  return useQuery<Session>({
    queryKey: ['session', sessionId],
    queryFn: () => apiClient.sessions.get(sessionId!),
    enabled: !!sessionId,
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => apiClient.sessions.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
