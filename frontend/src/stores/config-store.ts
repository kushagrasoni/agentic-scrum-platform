/**
 * Zustand Store for Configuration State
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApiMode = 'ollama' | 'openai' | 'azure';

export interface OllamaConfigData {
  url: string;
  model: string;
}

export interface OpenAIConfigData {
  apiKey: string;
  model: string;
}

export interface AzureConfigData {
  apiKey: string;
  endpoint: string;
  deployment: string;
  apiVersion: string;
}

export interface ConfigState {
  // API Configuration
  apiMode: ApiMode | null;  // Allow null for unconfigured state
  ollamaUrl: string;
  ollamaModel: string;
  openaiApiKey: string;
  openaiModel: string;
  azureApiKey: string;
  azureEndpoint: string;
  azureDeployment: string;
  azureApiVersion: string;
  
  // UI State
  isConfigured: boolean;
  
  // Getters
  ollamaConfig: OllamaConfigData;
  openaiConfig: OpenAIConfigData;
  azureConfig: AzureConfigData;
  
  // Actions
  setApiMode: (mode: ApiMode | null) => void;
  setOllamaConfig: (config: OllamaConfigData) => void;
  setOpenAIConfig: (config: OpenAIConfigData) => void;
  setAzureConfig: (config: AzureConfigData) => void;
  setConfigured: (configured: boolean) => void;
  reset: () => void;
}

const initialState = {
  apiMode: 'azure' as ApiMode | null,  // Default to Azure for development
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama2',
  openaiApiKey: '',
  openaiModel: 'gpt-4',
  azureApiKey: '787ea8781af74e4dbe4ebc6673aa8ccd',
  azureEndpoint: 'https://genaipoc-apimgmtservices.azure-api.net/',
  azureDeployment: 'gpt-5-chat',
  azureApiVersion: '2025-01-01-preview',
  isConfigured: false,
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Computed getters
      get ollamaConfig() {
        return {
          url: get().ollamaUrl,
          model: get().ollamaModel
        };
      },
      
      get openaiConfig() {
        return {
          apiKey: get().openaiApiKey,
          model: get().openaiModel
        };
      },
      
      get azureConfig() {
        return {
          apiKey: get().azureApiKey,
          endpoint: get().azureEndpoint,
          deployment: get().azureDeployment,
          apiVersion: get().azureApiVersion
        };
      },
      
      setApiMode: (mode) => set({ apiMode: mode }),
      
      setOllamaConfig: (config) => set({ 
        ollamaUrl: config.url, 
        ollamaModel: config.model 
      }),
      
      setOpenAIConfig: (config) => set({ 
        openaiApiKey: config.apiKey, 
        openaiModel: config.model 
      }),
      
      setAzureConfig: (config) => set({
        azureApiKey: config.apiKey,
        azureEndpoint: config.endpoint,
        azureDeployment: config.deployment,
        azureApiVersion: config.apiVersion,
      }),
      
      setConfigured: (configured) => set({ isConfigured: configured }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'agentic-scrum-config',
    }
  )
);
