"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AgentHub } from "@/components/agent-hub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { useConfigStore } from "@/stores/config-store";
import type { AgentName, SingleAgentResponse } from "@/types";
import {
  Sparkles,
  Workflow,
  Play,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type FlowId = "po-sm" | "po-qa" | "po-tech-dev" | "tech-qa";

type FlowDefinition = {
  id: FlowId;
  title: string;
  summary: string;
  steps: AgentName[];
};

const flowDefinitions: FlowDefinition[] = [
  {
    id: "po-sm",
    title: "PO -> SM",
    summary: "Generate stories then break them into tasks and risks.",
    steps: ["product_owner", "scrum_master"],
  },
  {
    id: "po-qa",
    title: "PO -> QA",
    summary: "Create stories and immediately derive test cases.",
    steps: ["product_owner", "qa_automation"],
  },
  {
    id: "po-tech-dev",
    title: "PO -> Tech Lead -> Dev",
    summary: "Vision to design to code skeleton in one pass.",
    steps: ["product_owner", "tech_lead", "developer"],
  },
  {
    id: "tech-qa",
    title: "Tech Lead -> QA",
    summary: "Turn a design into a focused automation plan.",
    steps: ["tech_lead", "qa_automation"],
  },
];

const agentLabel = (name: AgentName) =>
  ({
    product_owner: "Product Owner",
    scrum_master: "Scrum Master",
    tech_lead: "Tech Lead",
    developer: "Developer",
    qa_automation: "QA Automation",
    release_manager: "Release Manager",
  }[name] || name);

type StepStatus = {
  status: "pending" | "running" | "done" | "error";
  output?: string;
  sessionId?: string;
};

function useActiveProfileId() {
  const config = useConfigStore();
  const { data: profiles } = useQuery({
    queryKey: ["config-profiles"],
    queryFn: () => apiClient.config.profiles.list(),
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const selected =
      config.apiMode === "azure"
        ? config.selectedAzureId
        : config.apiMode === "openai"
        ? config.selectedOpenAIId
        : config.apiMode === "ollama"
        ? config.selectedOllamaId
        : null;

    const modeProfiles = config.apiMode ? (profiles?.[config.apiMode] as any[] | undefined) : undefined;
    const hasSelected = selected && modeProfiles?.some((p) => p.llmProfileId === selected);
    const fallbackAny = profiles ? Object.values(profiles).flat()?.[0]?.llmProfileId || null : null;
    if (hasSelected) return selected;
    return modeProfiles?.[0]?.llmProfileId || fallbackAny;
  }, [config.apiMode, config.selectedAzureId, config.selectedOpenAIId, config.selectedOllamaId, profiles]);
}

function MiniFlowRunner() {
  const { toast } = useToast();
  const activeProfileId = useActiveProfileId();
  const [selectedFlow, setSelectedFlow] = useState<FlowId>("po-sm");
  const [requirement, setRequirement] = useState("");
  const [constraints, setConstraints] = useState("");
  const [stepStatus, setStepStatus] = useState<Record<AgentName, StepStatus>>({});
  const [lastRunOutputs, setLastRunOutputs] = useState<Record<AgentName, string>>({});

  const flow = flowDefinitions.find((f) => f.id === selectedFlow) ?? flowDefinitions[0];

  const resetStatuses = () => {
    const next: Record<AgentName, StepStatus> = {};
    flow.steps.forEach((s) => {
      next[s] = { status: "pending" };
    });
    setStepStatus(next);
  };

  const flowMutation = useMutation({
    mutationFn: async () => {
      if (!activeProfileId) {
        throw new Error("Select an API profile in Settings first.");
      }
      if (!requirement.trim()) {
        throw new Error("Add a requirement or task to run the mini flow.");
      }

      resetStatuses();
      const outputs: Record<AgentName, string> = {};
      let aggregatedContext = `Requirement:\n${requirement.trim()}`;
      if (constraints.trim()) {
        aggregatedContext += `\nConstraints:\n${constraints.trim()}`;
      }

      for (const agent of flow.steps) {
        setStepStatus((prev) => ({ ...prev, [agent]: { status: "running" } }));

        const response: SingleAgentResponse = await apiClient.agents.runSingle({
          llmProfileId: activeProfileId,
          agentName: agent,
          inputs: {
            requirement: requirement.trim(),
            constraints: constraints.trim(),
          },
          context: { context: aggregatedContext },
        });

        outputs[agent] = response.output;
        aggregatedContext += `\n\n${agentLabel(agent)} Output:\n${response.output}`;

        setStepStatus((prev) => ({
          ...prev,
          [agent]: { status: "done", output: response.output, sessionId: response.sessionId },
        }));
      }

      setLastRunOutputs(outputs);
      return outputs;
    },
    onSuccess: () => {
      toast({
        title: "Mini flow completed",
        description: `${flow.title} finished.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Mini flow failed",
        description: error?.message || "Unable to run mini flow.",
      });
    },
  });

  const progressValue =
    flow.steps.length === 0
      ? 0
      : (Object.values(stepStatus).filter((s) => s.status === "done").length / flow.steps.length) * 100;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            Mini Flows (Beta)
          </CardTitle>
          <CardDescription>Chain 2-3 agents in one go without the full workflow.</CardDescription>
        </div>
        <Badge variant="secondary">Beta</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          {flowDefinitions.map((item) => (
            <Button
              key={item.id}
              variant={item.id === flow.id ? "default" : "outline"}
              className="h-full w-full justify-start items-start text-left whitespace-normal flex-col gap-2 border"
              onClick={() => setSelectedFlow(item.id)}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{item.title}</span>
                <Badge variant="secondary" className="text-[11px]">
                  {item.steps.length} steps
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{item.summary}</p>
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                {item.steps.map((step, idx) => (
                  <span key={step} className="flex items-center gap-1">
                    {idx > 0 && <ArrowRight className="h-3 w-3 opacity-70" />}
                    {agentLabel(step)}
                  </span>
                ))}
              </div>
            </Button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Requirement / Task *</label>
              <Textarea
                placeholder="Describe what you need across these agents..."
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Constraints (optional)</label>
              <Input
                placeholder="Deadlines, scope, formats..."
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => flowMutation.mutate()}
                disabled={!activeProfileId || flowMutation.isPending || !requirement.trim()}
                className="gap-2"
              >
                {flowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start {flow.title}
              </Button>
              {!activeProfileId && (
                <Badge variant="destructive" className="text-xs">
                  Select an API profile first
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Run status</p>
              </div>
              <span className="text-xs text-muted-foreground">{flow.steps.length} steps</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="space-y-2">
              {flow.steps.map((agent) => {
                const status = stepStatus[agent]?.status ?? "pending";
                return (
                  <div key={agent} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                    <div className="flex items-center gap-2">
                      {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {status === "pending" && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium">{agentLabel(agent)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Latest outputs</p>
          </div>
          {Object.keys(lastRunOutputs).length === 0 ? (
            <p className="text-sm text-muted-foreground">Run a mini flow to see combined outputs.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {flow.steps.map((agent) => {
                const output = lastRunOutputs[agent];
                if (!output) return null;
                return (
                  <Card key={agent}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline">{agentLabel(agent)}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-y-auto">{output}</pre>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentHubPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Hub</h1>
          <p className="text-muted-foreground">
            Run single agents or chain mini flows without triggering the full crew workflow.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          Ad-hoc & Mini Flows
        </Badge>
      </div>

      <AgentHub />

      <MiniFlowRunner />
    </div>
  );
}

