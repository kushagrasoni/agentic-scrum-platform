/**
 * React Query Hooks for Artifacts
 */
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Artifact } from '@/types';

export function useArtifacts(sessionId: string | null) {
  return useQuery<Artifact[]>({
    queryKey: ['artifacts', sessionId],
    queryFn: () => apiClient.artifacts.list(sessionId!),
    enabled: !!sessionId,
  });
}

export function useArtifactContent(sessionId: string, fileName: string) {
  return useQuery<string>({
    queryKey: ['artifact', sessionId, fileName],
    queryFn: () => apiClient.artifacts.get(sessionId, fileName),
    enabled: !!sessionId && !!fileName,
  });
}

export function useDownloadArtifacts() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const blob = await apiClient.artifacts.download(sessionId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-artifacts.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}
