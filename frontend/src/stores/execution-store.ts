import { create } from "zustand";

export type ExecutionStatus = "idle" | "running" | "completed" | "error" | "cancelled";

export interface AgentStatus {
  id: string;
  name: string;
  status: "waiting" | "running" | "completed" | "error";
  progress: number;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  agent: string;
  message: string;
}

export interface ExecutionState {
  sessionId: string | null;
  status: ExecutionStatus;
  agents: AgentStatus[];
  logs: LogEntry[];
  artifacts: string[];
  
  startExecution: (sessionId: string) => void;
  updateAgentStatus: (agentId: string, updates: Partial<AgentStatus>) => void;
  addLog: (log: Omit<LogEntry, "timestamp">) => void;
  setArtifacts: (artifacts: string[]) => void;
  setStatus: (status: ExecutionStatus) => void;
  reset: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  sessionId: null,
  status: "idle",
  agents: [],
  logs: [],
  artifacts: [],
  
  startExecution: (sessionId) => set({
    sessionId,
    status: "running",
    agents: [],
    logs: [],
    artifacts: [],
  }),
  
  updateAgentStatus: (agentId, updates) => set((state) => ({
    agents: state.agents.map((agent) =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    ),
  })),
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, { ...log, timestamp: new Date().toISOString() }],
  })),
  
  setArtifacts: (artifacts) => set({ artifacts }),
  setStatus: (status) => set({ status }),
  
  reset: () => set({
    sessionId: null,
    status: "idle",
    agents: [],
    logs: [],
    artifacts: [],
  }),
}));
