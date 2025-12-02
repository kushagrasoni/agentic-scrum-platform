import { create } from "zustand";
import { CheckpointMessage } from "@/types";

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
   checkpoints: CheckpointMessage[];
  artifacts: string[];
  
  startExecution: (sessionId: string) => void;
  setSessionId: (sessionId: string) => void;
   setAgents: (agents: AgentStatus[]) => void;
  updateAgentStatus: (agentId: string, updates: Partial<AgentStatus>) => void;
  addLog: (log: Omit<LogEntry, "timestamp"> & { timestamp?: string }) => void;
   addCheckpoint: (checkpoint: CheckpointMessage) => void;
  setArtifacts: (artifacts: string[]) => void;
  setStatus: (status: ExecutionStatus) => void;
  clearCheckpoints: () => void;
  clearLogs: () => void;
  reset: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  sessionId: null,
  status: "idle",
  agents: [],
  logs: [],
   checkpoints: [],
  artifacts: [],
  
  startExecution: (sessionId) => set({
    sessionId,
    status: "running",
    agents: [],
    logs: [],
     checkpoints: [],
    artifacts: [],
  }),

  setSessionId: (sessionId) => set({ sessionId }),

  setAgents: (agents) => set({ agents }),
  
  updateAgentStatus: (agentId, updates) => set((state) => ({
    agents: state.agents.map((agent) =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    ),
  })),
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, { ...log, timestamp: log.timestamp || new Date().toISOString() }],
  })),

  addCheckpoint: (checkpoint) => set((state) => ({
    checkpoints: [...state.checkpoints, checkpoint],
  })),
  
  setArtifacts: (artifacts) => set({ artifacts }),
  setStatus: (status) => set({ status }),
  
  clearCheckpoints: () => set({ checkpoints: [] }),
  clearLogs: () => set({ logs: [] }),
  
  reset: () => set({
    sessionId: null,
    status: "idle",
    agents: [],
    logs: [],
     checkpoints: [],
    artifacts: [],
  }),
}));
