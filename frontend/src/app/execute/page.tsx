"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfigStore, ApiMode } from "@/stores/config-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useExecuteAgents } from "@/hooks/use-agents";
import { apiClient } from "@/lib/api-client";
import { CheckCircle2, Circle, Loader2, AlertCircle, Download, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExecutePage() {
  const router = useRouter();
  const config = useConfigStore();
  const execution = useExecutionStore();
  const { mutate: executeAgents, isPending } = useExecuteAgents();
  const eventSourceRef = useRef<EventSource | null>(null);
  const { replaceProfiles } = useConfigStore.getState();
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  // Update below values to a more relevant default corresponding to a Full Stack Payment Admin UI project
  const [inputs, setInputs] = useState({
    requirements: `Deliver a payment admin workspace this sprint that lets treasury ops search merchants and payment batches, drill into settlement timelines, trigger refunds/adjustments, and approve payouts with automated allocation rules. Integrate with PaymentCore for ledger data, Payment Rail APIs for disbursements, surface anomaly alerts, and export audit-ready reports.`,
    context: `Treasury Operations currently reconciles commercial payments across ACH, RTP, and wire rails using spreadsheets and terminal screens, which slows down exception handling and audit preparation. The new UI must unify PaymentCore (Postgres) and Payment Rail event streams, support ~60 analysts across US/EU regions, and preserve existing approval workflows so managers can sign off on 400+ payouts per day.`,
    constraints: `- Deliver production-ready MVP within the current 2-week sprint
- Frontend: Next.js 14 + TypeScript + shadcn/ui; align with existing design tokens
- Backend integrations must call PaymentCore GraphQL + Payment Rail REST APIs via API Gateway (mTLS + OAuth2 client credentials)
- All payment actions must emit audit logs to Kafka topic audit.payments and S3 archive for SOX
- Data sources are read-only replicas; mutation goes through Payment Actions service (no direct DB writes or schema changes)
- Enforce RBAC (OpsAnalyst, Manager, Auditor) with feature gating on approval actions
- Performance: search/filter < 1.5s, payout initiation < 4s round-trip
- Deploy inside private VNet — no third-party SaaS or external network calls`
  });

  // Check if API is configured
  useEffect(() => {
    if (!config.apiMode) {
      router.push("/configure");
    }
  }, [config.apiMode, router]);

  const handleExecute = () => {
    // Guard: Check if API mode is configured
    if (!config.apiMode) {
      console.error("No API mode configured");
      alert("Please configure an AI provider first");
      router.push("/configure");
      return;
    }

    const profileId = selectedConfigId || null;

    console.log("DEBUG - API Mode:", config.apiMode);
    console.log("DEBUG - Selected Ollama ID:", config.selectedOllamaId);
    console.log("DEBUG - Selected OpenAI ID:", config.selectedOpenAIId);
    console.log("DEBUG - Selected Azure ID:", config.selectedAzureId);
    console.log("DEBUG - Ollama Configs:", config.ollamaConfigs);
    console.log("DEBUG - OpenAI Configs:", config.openaiConfigs);
    console.log("DEBUG - Azure Configs:", config.azureConfigs);
    console.log("DEBUG - Selected Config ID:", profileId);

    if (!profileId) {
      alert("Please select and save a configuration profile for the chosen provider");
      return;
    }

    console.log("Executing with profile:", profileId);

    executeAgents(
      {
        llmProfileId: profileId,
        inputs
      },
      {
        onSuccess: (response) => {
          execution.startExecution(response.sessionId);
          startSessionStream(response.sessionId);
        },
        onError: (error) => {
          console.error("Execution failed:", error);
          alert(`Execution failed: ${error.message}`);
        }
      }
    );
  };

  const startSessionStream = (sessionId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const source = apiClient.agents.streamSession(sessionId);
    eventSourceRef.current = source;

    source.addEventListener("status", (event) => {
      const data = JSON.parse((event as MessageEvent).data || "{}");
      if (data.status) {
        execution.setStatus(data.status);
      }
      if (Array.isArray(data.agents)) {
        const mappedAgents = data.agents.map((agent: any) => ({
          id: agent.name,
          name: agent.name,
          status: agent.status,
          progress: agent.progress ?? 0,
        }));
        execution.setAgents(mappedAgents);
      }
      if (Array.isArray(data.artifacts)) {
        execution.setArtifacts(data.artifacts);
      }
    });

    source.addEventListener("checkpoint", (event) => {
      const data = JSON.parse((event as MessageEvent).data || "{}");
      if (data.agent && data.content) {
        execution.addCheckpoint({
          agent: data.agent,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
        });
      }
    });

    source.addEventListener("log", (event) => {
      const data = JSON.parse((event as MessageEvent).data || "{}");
      if (data.message) {
        execution.addLog({
          level: data.level || "info",
          agent: data.agent || "system",
          message: data.message,
          timestamp: data.timestamp,
        });
      }
    });

    source.addEventListener("done", (event) => {
      const data = JSON.parse((event as MessageEvent).data || "{}");
      if (data.status) {
        execution.setStatus(data.status);
      }
      source.close();
      eventSourceRef.current = null;
    });

    source.onerror = (err) => {
      console.error("Stream error", err);
      source.close();
      eventSourceRef.current = null;
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const isExecuting = execution.sessionId !== null;
  const canExecute = inputs.requirements.trim().length > 0 && !isExecuting;

  const handleConfigSelect = (mode: ApiMode, id: string) => {
    if (mode === "ollama") {
      config.selectOllamaConfig(id);
    }
    if (mode === "openai") {
      config.selectOpenAIConfig(id);
    }
    if (mode === "azure") {
      config.selectAzureConfig(id);
    }
    config.setApiMode(mode);
  };

  const providerConfigs = useMemo(
    () => ({
      ollama: { list: config.ollamaConfigs, selected: config.selectedOllamaId },
      openai: { list: config.openaiConfigs, selected: config.selectedOpenAIId },
      azure: { list: config.azureConfigs, selected: config.selectedAzureId },
    }),
    [config.ollamaConfigs, config.openaiConfigs, config.azureConfigs, config.selectedOllamaId, config.selectedOpenAIId, config.selectedAzureId]
  );

  const activeProfile =
    config.apiMode === "ollama"
      ? config.ollamaConfigs.find((c: any) => c.llmProfileId === config.selectedOllamaId) || config.ollamaConfigs[0]
      : config.apiMode === "openai"
      ? config.openaiConfigs.find((c: any) => c.llmProfileId === config.selectedOpenAIId) || config.openaiConfigs[0]
      : config.apiMode === "azure"
      ? config.azureConfigs.find((c: any) => c.llmProfileId === config.selectedAzureId) || config.azureConfigs[0]
      : null;

  const selectedConfigId =
    config.apiMode === "ollama"
      ? config.selectedOllamaId || config.ollamaConfigs[0]?.llmProfileId || ""
      : config.apiMode === "openai"
      ? config.selectedOpenAIId || config.openaiConfigs[0]?.llmProfileId || ""
      : config.apiMode === "azure"
      ? config.selectedAzureId || config.azureConfigs[0]?.llmProfileId || ""
      : "";

  useEffect(() => {
    if (config.apiMode) {
      const current =
        config.apiMode === "ollama"
          ? config.selectedOllamaId
          : config.apiMode === "openai"
          ? config.selectedOpenAIId
          : config.selectedAzureId;
      const first =
        config.apiMode === "ollama"
          ? config.ollamaConfigs[0]?.llmProfileId
          : config.apiMode === "openai"
          ? config.openaiConfigs[0]?.llmProfileId
          : config.azureConfigs[0]?.llmProfileId;
      if (!current && first) {
        handleConfigSelect(config.apiMode, first);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiMode, config.selectedOllamaId, config.selectedOpenAIId, config.selectedAzureId, config.ollamaConfigs, config.openaiConfigs, config.azureConfigs]);

  useEffect(() => {
    // Hydrate profiles from backend so we don't rely on stale defaults
    const loadProfiles = async () => {
      if (profilesLoaded) return;
      try {
        const result = await apiClient.config.profiles.list();
        replaceProfiles({
          ollama: result.ollama || [],
          openai: result.openai || [],
          azure: result.azure || [],
        });
        setProfilesLoaded(true);
      } catch (err) {
        console.error("Failed to load profiles", err);
      }
    };
    loadProfiles();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [profilesLoaded, replaceProfiles]);

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Top Row: Inputs and Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Project Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Project Inputs</CardTitle>
            <CardDescription>Requirements, context, and constraints to guide the agents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements *</Label>
              <Textarea
                id="requirements"
                value={inputs.requirements}
                onChange={(e) => setInputs({ ...inputs, requirements: e.target.value })}
                placeholder="E.g., Build a user authentication system with email and password login..."
                rows={6}
                disabled={isExecuting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Business Context</Label>
              <Textarea
                id="context"
                value={inputs.context}
                onChange={(e) => setInputs({ ...inputs, context: e.target.value })}
                placeholder="E.g., This is for a SaaS application targeting small businesses..."
                rows={4}
                disabled={isExecuting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraints">Technical Constraints</Label>
              <Textarea
                id="constraints"
                value={inputs.constraints}
                onChange={(e) => setInputs({ ...inputs, constraints: e.target.value })}
                placeholder="E.g., Must use React, PostgreSQL, deploy on AWS..."
                rows={4}
                disabled={isExecuting}
              />
            </div>

            <Button
              onClick={handleExecute}
              disabled={!canExecute || isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Execution...
                </>
              ) : (
                "Start Scrum Workflow"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Active Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Active Configuration</CardTitle>
            <CardDescription>Provider profile used for this run.</CardDescription>
          </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Provider</Label>
                  <Select
                    value={config.apiMode || ""}
                    onValueChange={(value) => config.setApiMode(value as ApiMode)}
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Configuration</Label>
                {config.apiMode ? (
                  <Select
                    value={selectedConfigId || undefined}
                    onValueChange={(value) => handleConfigSelect(config.apiMode as ApiMode, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerConfigs[config.apiMode].list.map((cfg: any, idx: number) => (
                        <SelectItem key={cfg.llmProfileId || `${config.apiMode}-cfg-${idx}`} value={cfg.llmProfileId}>
                          {cfg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      No AI provider configured
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {config.apiMode && activeProfile && (
                <div className="text-sm space-y-1 text-muted-foreground border rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="capitalize">
                      {config.apiMode === "azure" ? "Azure OpenAI" : config.apiMode}
                    </Badge>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  {config.apiMode === "ollama" && activeProfile.data && "url" in activeProfile.data && (
                    <>
                      <div>URL: {activeProfile.data.url}</div>
                      <div>Model: {activeProfile.data.model}</div>
                    </>
                  )}
                  {config.apiMode === "openai" && activeProfile.data && "apiKey" in activeProfile.data && (
                    <>
                      <div>Model: {activeProfile.data.model}</div>
                      <div>API Key: ••••{activeProfile.data.apiKey?.slice(-4)}</div>
                    </>
                  )}
                  {config.apiMode === "azure" && activeProfile.data && "deployment" in activeProfile.data && (
                    <>
                      <div>Deployment: {activeProfile.data.deployment}</div>
                      <div>Endpoint: {activeProfile.data.endpoint}</div>
                      <div>API Version: {activeProfile.data.apiVersion}</div>
                    </>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full"
              >
                <Link href="/configure">
                  <Settings className="mr-2 h-3 w-3" />
                  Manage Configurations
                </Link>
              </Button>
            </CardContent>
          </Card>
      </div>

      {/* Bottom Section: Execution Status and Outputs (Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Status */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Status</CardTitle>
            <CardDescription>
              {isExecuting
                ? "Agents are working on your project"
                : "No active execution"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isExecuting ? (
              <div className="text-center py-12 text-muted-foreground">
                <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill in the requirements and start the workflow</p>
              </div>
            ) : (
              <>
                {execution.agents.map((agent, index) => (
                  <div key={agent.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(agent.status)}
                        <div>
                          <p className="font-medium capitalize">
                            {agent.name.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {agent.status}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {agent.progress}%
                      </span>
                    </div>
                    <Progress value={agent.progress} className="h-2" />
                    {index < execution.agents.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        {isExecuting && execution.logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Real-time updates from agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {execution.logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 rounded-md bg-muted/50 border"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          log.level === "error"
                            ? "destructive"
                            : log.level === "success"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {log.level}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="mt-1">{log.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Intermediate Outputs (Full Width) */}
      {execution.checkpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Intermediate Outputs</CardTitle>
            <CardDescription>Agent results as they complete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {execution.checkpoints.map((checkpoint, index) => (
              <div key={`${checkpoint.agent}-${index}`} className="space-y-2 border rounded-md p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium capitalize">{checkpoint.agent.replace("_", " ")}</div>
                  <span className="text-muted-foreground">{new Date(checkpoint.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-md border">
                  {checkpoint.content}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Artifacts Section (Full Width) */}
      {execution.artifacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Artifacts</CardTitle>
            <CardDescription>
              Documents created by the agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {execution.artifacts.map((artifact, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="truncate">{artifact}</span>
                  <Download className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {execution.sessionId && (
        <Alert>
          <AlertDescription>
            Session ID: <code className="font-mono">{execution.sessionId}</code>
            <Button
              variant="link"
              className="ml-4"
              onClick={() => router.push('/history')}
            >
              View in History
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
