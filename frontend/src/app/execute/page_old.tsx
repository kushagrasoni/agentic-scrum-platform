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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfigStore, ApiMode } from "@/stores/config-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useExecuteAgents } from "@/hooks/use-agents";
import { apiClient } from "@/lib/api-client";
import { DEMO_TEMPLATES, getTemplateById } from "@/lib/demo-templates";
import { CheckCircle2, Circle, Loader2, AlertCircle, Download, Settings, Sparkles, Clock, Users, FileText, TestTube, BookOpen, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ExecutePage() {
  const router = useRouter();
  const config = useConfigStore();
  const execution = useExecutionStore();
  const { mutate: executeAgents, isPending } = useExecuteAgents();
  const eventSourceRef = useRef<EventSource | null>(null);
  const { replaceProfiles } = useConfigStore.getState();
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("payment-admin-ui");

  // Load default template
  const defaultTemplate = getTemplateById("payment-admin-ui");
  
  // Update below values to a more relevant default corresponding to a Full Stack Payment Admin UI project
  const [inputs, setInputs] = useState({
    requirements: defaultTemplate?.requirements || "",
    context: defaultTemplate?.context || "",
    constraints: defaultTemplate?.constraints || ""
  });

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "custom") {
      // Keep current inputs for custom
      return;
    }
    const template = getTemplateById(templateId);
    if (template) {
      setInputs({
        requirements: template.requirements,
        context: template.context,
        constraints: template.constraints
      });
    }
  };

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
            {/* Demo Template Selector */}
            <div className="space-y-2">
              <Label htmlFor="template" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Demo Scenario Template
              </Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a demo scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom (Free Text)</SelectItem>
                  <Separator className="my-2" />
                  {DEMO_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.category.replace('-', ' ')}
                        </Badge>
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate !== "custom" && (
                <p className="text-sm text-muted-foreground">
                  {DEMO_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements *</Label>
              <Textarea
                id="requirements"
                value={inputs.requirements}
                onChange={(e) => {
                  setInputs({ ...inputs, requirements: e.target.value });
                  setSelectedTemplate("custom");
                }}
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
                onChange={(e) => {
                  setInputs({ ...inputs, context: e.target.value });
                  setSelectedTemplate("custom");
                }}
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
                onChange={(e) => {
                  setInputs({ ...inputs, constraints: e.target.value });
                  setSelectedTemplate("custom");
                }}
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

      {/* Bottom Section: Execution Timeline + Dashboard (Full Width) */}
      {isExecuting || execution.sessionId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timeline Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics Panel */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {Math.round((execution.agents.filter(a => a.status === "completed").length / Math.max(execution.agents.length, 1)) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Progress</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {execution.agents.filter(a => a.status === "completed").length}/{execution.agents.length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Agents Complete</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isExecuting ? "In Progress" : "Completed"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Execution Timeline</CardTitle>
                <CardDescription>
                  {isExecuting ? "Watch your AI Scrum team in action" : "Workflow completed"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isExecuting && execution.agents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Fill in the requirements and start the workflow</p>
                  </div>
                ) : (
                  <>
                    {/* Timeline Progress Bar */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Start</span>
                        <span className="text-xs text-muted-foreground">
                          {isExecuting ? "Est. 2-3 mins" : "Complete"}
                        </span>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.round((execution.agents.filter(a => a.status === "completed").length / Math.max(execution.agents.length, 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        {execution.agents.map((agent, idx) => {
                          const agentIcons = {
                            product_owner: Users,
                            scrum_master: BookOpen,
                            developer: FileText,
                            qa_automation: TestTube,
                            scrum_summary: CheckCircle
                          };
                          const AgentIcon = agentIcons[agent.name as keyof typeof agentIcons] || Circle;
                          
                          return (
                            <div key={agent.name} className="flex flex-col items-center">
                              <div className={`p-2 rounded-full border-2 ${
                                agent.status === "completed" ? "bg-green-500 border-green-500" :
                                agent.status === "running" ? "bg-blue-500 border-blue-500 animate-pulse" :
                                agent.status === "error" ? "bg-red-500 border-red-500" :
                                "bg-muted border-muted"
                              }`}>
                                <AgentIcon className={`h-4 w-4 ${
                                  agent.status === "waiting" ? "text-muted-foreground" : "text-white"
                                }`} />
                              </div>
                              <span className="text-xs mt-1 text-muted-foreground text-center max-w-[60px] truncate">
                                {agent.name.split("_")[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current Agent Detail */}
                    {execution.agents.find(a => a.status === "running") && (
                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        {(() => {
                          const runningAgent = execution.agents.find(a => a.status === "running")!;
                          const agentIcons = {
                            product_owner: Users,
                            scrum_master: BookOpen,
                            developer: FileText,
                            qa_automation: TestTube,
                            scrum_summary: CheckCircle
                          };
                          const AgentIcon = agentIcons[runningAgent.name as keyof typeof agentIcons] || Circle;
                          
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-full">
                                  <AgentIcon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold capitalize">
                                    {runningAgent.name.replace(/_/g, " ")}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Currently analyzing and generating deliverables...
                                  </p>
                                </div>
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{runningAgent.progress}%</span>
                                </div>
                                <Progress value={runningAgent.progress} className="h-2" />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Completed Agents Summary */}
                    <div className="space-y-2">
                      {execution.agents.filter(a => a.status === "completed").map((agent) => {
                        const agentIcons = {
                          product_owner: Users,
                          scrum_master: BookOpen,
                          developer: FileText,
                          qa_automation: TestTube,
                          scrum_summary: CheckCircle
                        };
                        const AgentIcon = agentIcons[agent.name as keyof typeof agentIcons] || Circle;
                        
                        return (
                          <div key={agent.name} className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                            <div className="p-2 bg-green-500 rounded-full">
                              <AgentIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium capitalize">
                                {agent.name.replace(/_/g, " ")}
                              </div>
                              <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Activity Feed - 1/3 width */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Activity</CardTitle>
                <CardDescription>Real-time updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {execution.logs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {execution.logs.slice().reverse().map((log, index) => (
                        <div key={index} className="text-sm border-l-2 border-primary/20 pl-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`h-2 w-2 rounded-full ${
                              log.level === "error" ? "bg-red-500" :
                              log.level === "success" ? "bg-green-500" :
                              "bg-blue-500"
                            }`} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-xs font-medium capitalize text-primary mb-1">
                            {log.agent}
                          </div>
                          <p className="text-xs text-muted-foreground">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Agent Deliverables with Dialog (Full Width) */}
      {execution.checkpoints.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agent Deliverables</CardTitle>
                <CardDescription>Click on any deliverable to view full output</CardDescription>
              </div>
              <Badge variant="outline">
                {execution.checkpoints.length} {execution.checkpoints.length === 1 ? "deliverable" : "deliverables"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {execution.checkpoints.map((checkpoint, index) => {
                const agentLabels = {
                  product_owner: { label: "Product Owner", icon: Users, description: "Vision, user stories & acceptance criteria", color: "blue" },
                  scrum_master: { label: "Scrum Master", icon: BookOpen, description: "Sprint plan, tasks & risk analysis", color: "purple" },
                  developer: { label: "Developer", icon: FileText, description: "Technical design & code implementation", color: "green" },
                  qa_automation: { label: "QA Engineer", icon: TestTube, description: "Test cases & automation scripts", color: "orange" },
                  scrum_summary: { label: "Release Manager", icon: CheckCircle, description: "Executive summary & delivery plan", color: "pink" }
                };
                const agentInfo = agentLabels[checkpoint.agent as keyof typeof agentLabels] || { label: checkpoint.agent, icon: Circle, description: "Output", color: "gray" };
                const Icon = agentInfo.icon;
                
                return (
                  <Dialog key={`item-${index}`}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className={`p-3 rounded-lg bg-${agentInfo.color}-100 dark:bg-${agentInfo.color}-950`}>
                                <Icon className={`h-6 w-6 text-${agentInfo.color}-600 dark:text-${agentInfo.color}-400`} />
                              </div>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">{agentInfo.label}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {agentInfo.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                              <span>{new Date(checkpoint.timestamp).toLocaleTimeString()}</span>
                              <span className="text-primary">View →</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${agentInfo.color}-100 dark:bg-${agentInfo.color}-950`}>
                            <Icon className={`h-5 w-5 text-${agentInfo.color}-600 dark:text-${agentInfo.color}-400`} />
                          </div>
                          <div className="flex-1">
                            <DialogTitle>{agentInfo.label}</DialogTitle>
                            <DialogDescription>
                              {agentInfo.description}
                            </DialogDescription>
                          </div>
                          <Badge variant="outline">
                            {new Date(checkpoint.timestamp).toLocaleTimeString()}
                          </Badge>
                        </div>
                      </DialogHeader>
                      <ScrollArea className="h-[500px] rounded-md border">
                        <pre className="text-sm whitespace-pre-wrap p-6 font-mono">
                          {checkpoint.content}
                        </pre>
                      </ScrollArea>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          Copy to Clipboard
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
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
