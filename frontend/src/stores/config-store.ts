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

export interface ConfigProfile<T> {
  llmProfileId: string;
  name: string;
  data: T;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigState {
  apiMode: ApiMode | null;

  ollamaConfigs: ConfigProfile<OllamaConfigData>[];
  openaiConfigs: ConfigProfile<OpenAIConfigData>[];
  azureConfigs: ConfigProfile<AzureConfigData>[];

  selectedOllamaId: string | null;
  selectedOpenAIId: string | null;
  selectedAzureId: string | null;

  isConfigured: boolean;

  // Getters
  ollamaConfig: OllamaConfigData | null;
  openaiConfig: OpenAIConfigData | null;
  azureConfig: AzureConfigData | null;
  activeApiConfig: OllamaConfigData | OpenAIConfigData | AzureConfigData | null;

  // Actions
  setApiMode: (mode: ApiMode | null) => void;
  addOllamaConfig: (name: string, config: OllamaConfigData) => void;
  addOpenAIConfig: (name: string, config: OpenAIConfigData) => void;
  addAzureConfig: (name: string, config: AzureConfigData) => void;
  addOllamaProfile: (profile: ConfigProfile<OllamaConfigData>) => void;
  addOpenAIProfile: (profile: ConfigProfile<OpenAIConfigData>) => void;
  addAzureProfile: (profile: ConfigProfile<AzureConfigData>) => void;
  selectOllamaConfig: (id: string) => void;
  selectOpenAIConfig: (id: string) => void;
  selectAzureConfig: (id: string) => void;
  updateOllamaConfig: (id: string, patch: Partial<ConfigProfile<OllamaConfigData>>) => void;
  updateOpenAIConfig: (id: string, patch: Partial<ConfigProfile<OpenAIConfigData>>) => void;
  updateAzureConfig: (id: string, patch: Partial<ConfigProfile<AzureConfigData>>) => void;
  replaceProfiles: (payload: {
    ollama?: ConfigProfile<OllamaConfigData>[];
    openai?: ConfigProfile<OpenAIConfigData>[];
    azure?: ConfigProfile<AzureConfigData>[];
  }) => void;
  setConfigured: (configured: boolean) => void;
  reset: () => void;
}

const createProfile = <T,>(name: string, data: T): ConfigProfile<T> => {
  const now = new Date().toISOString();
  const llmProfileId = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
  return {
    llmProfileId,
    name: name || 'Default',
    data,
    createdAt: now,
    updatedAt: now,
  };
};

const defaultTimestamp = "2024-01-01T00:00:00.000Z";

const defaultOllama: ConfigProfile<OllamaConfigData> = {
  llmProfileId: "default-ollama",
  name: "Local Llama",
  data: {
    url: "http://localhost:11434",
    model: "llama2",
  },
  createdAt: defaultTimestamp,
  updatedAt: defaultTimestamp,
};

const defaultOpenAI: ConfigProfile<OpenAIConfigData> = {
  llmProfileId: "default-openai",
  name: "OpenAI GPT-4",
  data: {
    apiKey: "",
    model: "gpt-4",
  },
  createdAt: defaultTimestamp,
  updatedAt: defaultTimestamp,
};

const defaultAzure: ConfigProfile<AzureConfigData> = {
  llmProfileId: "default-azure",
  name: "Azure APIM GPT-5",
  data: {
    apiKey: "787ea8781af74e4dbe4ebc6673aa8ccd",
    endpoint: "https://genaipoc-apimgmtservices.azure-api.net/",
    deployment: "gpt-5-chat",
    apiVersion: "2025-01-01-preview",
  },
  createdAt: defaultTimestamp,
  updatedAt: defaultTimestamp,
};

const initialState = {
  apiMode: 'azure' as ApiMode | null,
  ollamaConfigs: [defaultOllama],
  openaiConfigs: [defaultOpenAI],
  azureConfigs: [defaultAzure],
  selectedOllamaId: defaultOllama.llmProfileId,
  selectedOpenAIId: defaultOpenAI.llmProfileId,
  selectedAzureId: defaultAzure.llmProfileId,
  isConfigured: false,
};

const findActive = <T,>(arr: ConfigProfile<T>[], id: string | null) => {
  if (id) {
    const found = arr.find((c) => c.llmProfileId === id);
    if (found) return found;
  }
  return arr[0] || null;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...initialState,

      get ollamaConfig() {
        return findActive(get().ollamaConfigs, get().selectedOllamaId)?.data || null;
      },

      get openaiConfig() {
        return findActive(get().openaiConfigs, get().selectedOpenAIId)?.data || null;
      },

      get azureConfig() {
        return findActive(get().azureConfigs, get().selectedAzureId)?.data || null;
      },

      get activeApiConfig() {
        const mode = get().apiMode;
        if (mode === 'ollama') return get().ollamaConfig;
        if (mode === 'openai') return get().openaiConfig;
        if (mode === 'azure') return get().azureConfig;
        return null;
      },

      setApiMode: (mode) => set({ apiMode: mode }),

      addOllamaConfig: (name, config) => set((state) => {
        const profile = createProfile(name, config);
        return {
          ollamaConfigs: [...state.ollamaConfigs, profile],
          selectedOllamaId: profile.llmProfileId,
          apiMode: state.apiMode ?? 'ollama',
        };
      }),

      addOpenAIConfig: (name, config) => set((state) => {
        const profile = createProfile(name, config);
        return {
          openaiConfigs: [...state.openaiConfigs, profile],
          selectedOpenAIId: profile.llmProfileId,
          apiMode: state.apiMode ?? 'openai',
        };
      }),

      addAzureConfig: (name, config) => set((state) => {
        const profile = createProfile(name, config);
        return {
          azureConfigs: [...state.azureConfigs, profile],
          selectedAzureId: profile.llmProfileId,
          apiMode: state.apiMode ?? 'azure',
        };
      }),

      addOllamaProfile: (profile) => set((state) => ({
        ollamaConfigs: [...state.ollamaConfigs, profile],
        selectedOllamaId: profile.llmProfileId,
        apiMode: state.apiMode ?? 'ollama',
      })),

      addOpenAIProfile: (profile) => set((state) => ({
        openaiConfigs: [...state.openaiConfigs, profile],
        selectedOpenAIId: profile.llmProfileId,
        apiMode: state.apiMode ?? 'openai',
      })),

      addAzureProfile: (profile) => set((state) => ({
        azureConfigs: [...state.azureConfigs, profile],
        selectedAzureId: profile.llmProfileId,
        apiMode: state.apiMode ?? 'azure',
      })),

      selectOllamaConfig: (id) => set({ selectedOllamaId: id, apiMode: 'ollama' }),
      selectOpenAIConfig: (id) => set({ selectedOpenAIId: id, apiMode: 'openai' }),
      selectAzureConfig: (id) => set({ selectedAzureId: id, apiMode: 'azure' }),

      updateOllamaConfig: (id, patch) => set((state) => ({
        ollamaConfigs: state.ollamaConfigs.map((c) =>
          c.llmProfileId === id
            ? {
                ...c,
                name: patch.name ?? c.name,
                data: { ...c.data, ...(patch.data as Partial<OllamaConfigData> ?? {}) },
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      })),

      updateOpenAIConfig: (id, patch) => set((state) => ({
        openaiConfigs: state.openaiConfigs.map((c) =>
          c.llmProfileId === id
            ? {
                ...c,
                name: patch.name ?? c.name,
                data: { ...c.data, ...(patch.data as Partial<OpenAIConfigData> ?? {}) },
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      })),

      updateAzureConfig: (id, patch) => set((state) => ({
        azureConfigs: state.azureConfigs.map((c) =>
          c.llmProfileId === id
            ? {
                ...c,
                name: patch.name ?? c.name,
                data: { ...c.data, ...(patch.data as Partial<AzureConfigData> ?? {}) },
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      })),

      setConfigured: (configured) => set({ isConfigured: configured }),

      replaceProfiles: (payload) => set((state) => {
        const newOllamaConfigs = payload.ollama ?? state.ollamaConfigs;
        const newOpenAIConfigs = payload.openai ?? state.openaiConfigs;
        const newAzureConfigs = payload.azure ?? state.azureConfigs;
        
        // Preserve current selection if it still exists in the new list, otherwise use first item
        const newSelectedOllamaId = 
          state.selectedOllamaId && newOllamaConfigs.find(c => c.llmProfileId === state.selectedOllamaId)
            ? state.selectedOllamaId
            : newOllamaConfigs[0]?.llmProfileId ?? state.selectedOllamaId;
            
        const newSelectedOpenAIId = 
          state.selectedOpenAIId && newOpenAIConfigs.find(c => c.llmProfileId === state.selectedOpenAIId)
            ? state.selectedOpenAIId
            : newOpenAIConfigs[0]?.llmProfileId ?? state.selectedOpenAIId;
            
        const newSelectedAzureId = 
          state.selectedAzureId && newAzureConfigs.find(c => c.llmProfileId === state.selectedAzureId)
            ? state.selectedAzureId
            : newAzureConfigs[0]?.llmProfileId ?? state.selectedAzureId;
        
        return {
          ollamaConfigs: newOllamaConfigs,
          openaiConfigs: newOpenAIConfigs,
          azureConfigs: newAzureConfigs,
          selectedOllamaId: newSelectedOllamaId,
          selectedOpenAIId: newSelectedOpenAIId,
          selectedAzureId: newSelectedAzureId,
        };
      }),

      reset: () => set(initialState),
    }),
    {
      name: 'agentic-scrum-config',
      version: 2,
      migrate: (persistedState: any, version) => {
        // If coming from a pre-v2 store, lift singular configs into arrays
        if (version < 2) {
          const legacy = persistedState as Partial<ConfigState> & {
            ollamaUrl?: string;
            ollamaModel?: string;
            openaiApiKey?: string;
            openaiModel?: string;
            azureApiKey?: string;
            azureEndpoint?: string;
            azureDeployment?: string;
            azureApiVersion?: string;
          };

          const migratedOllama = legacy.ollamaUrl && legacy.ollamaModel
            ? [createProfile('Migrated Ollama', { url: legacy.ollamaUrl, model: legacy.ollamaModel })]
            : initialState.ollamaConfigs;

          const migratedOpenAI = legacy.openaiApiKey && legacy.openaiModel
            ? [createProfile('Migrated OpenAI', { apiKey: legacy.openaiApiKey, model: legacy.openaiModel })]
            : initialState.openaiConfigs;

          const migratedAzure = legacy.azureApiKey && legacy.azureEndpoint && legacy.azureDeployment && legacy.azureApiVersion
            ? [createProfile('Migrated Azure', { apiKey: legacy.azureApiKey, endpoint: legacy.azureEndpoint, deployment: legacy.azureDeployment, apiVersion: legacy.azureApiVersion })]
            : initialState.azureConfigs;

          return {
            ...initialState,
            apiMode: legacy.apiMode ?? initialState.apiMode,
            ollamaConfigs: migratedOllama,
            openaiConfigs: migratedOpenAI,
            azureConfigs: migratedAzure,
            selectedOllamaId: migratedOllama[0]?.llmProfileId ?? initialState.selectedOllamaId,
            selectedOpenAIId: migratedOpenAI[0]?.llmProfileId ?? initialState.selectedOpenAIId,
            selectedAzureId: migratedAzure[0]?.llmProfileId ?? initialState.selectedAzureId,
            isConfigured: legacy.isConfigured ?? false,
          };
        }
        return persistedState as ConfigState;
      },
    }
  )
);
