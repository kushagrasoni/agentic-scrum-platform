/**
 * React Query Hooks for Configuration
 */
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useConfigStore } from '@/stores/config-store';
import { ApiConfig, TestConnectionResponse } from '@/types';

export function useTestConnection() {
  return useMutation({
    mutationFn: async (config: ApiConfig) => {
      return apiClient.config.test(config);
    },
  });
}

export function useAvailableModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: () => apiClient.config.getModels(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSaveConfiguration() {
  const setConfigured = useConfigStore((state) => state.setConfigured);
  
  return useMutation({
    mutationFn: async (config: ApiConfig) => {
      return apiClient.config.save(config);
    },
    onSuccess: () => {
      setConfigured(true);
    },
  });
}
