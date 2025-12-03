"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfigStore, ApiMode } from "@/stores/config-store";
import { CheckCircle2, AlertCircle, Settings, Sparkles, ArrowRight, Layers } from "lucide-react";
import { DEMO_TEMPLATES, getTemplateById } from "@/lib/demo-templates";
import { apiClient } from "@/lib/api-client";

export default function FeatureWorkflowPage() {
  const router = useRouter();
  const config = useConfigStore();
  const { replaceProfiles } = useConfigStore.getState();
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("payment-admin-ui");

  // Load default template
  const defaultTemplate = getTemplateById("payment-admin-ui");
  
  const [inputs, setInputs] = useState({
    requirements: defaultTemplate?.requirements || "",
    context: defaultTemplate?.context || "",
    constraints: defaultTemplate?.constraints || ""
  });

  // Load profiles from backend
  useEffect(() => {
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
  }, [profilesLoaded, replaceProfiles]);

  // Check if API is configured
  useEffect(() => {
    if (!config.apiMode) {
      router.push("/configure");
    }
  }, [config.apiMode, router]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "custom") {
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

  const selectedConfigId =
    config.apiMode === "ollama"
      ? config.selectedOllamaId || config.ollamaConfigs[0]?.llmProfileId || ""
      : config.apiMode === "openai"
      ? config.selectedOpenAIId || config.openaiConfigs[0]?.llmProfileId || ""
      : config.apiMode === "azure"
      ? config.selectedAzureId || config.azureConfigs[0]?.llmProfileId || ""
      : "";

  const providerConfigs = {
    ollama: { list: config.ollamaConfigs, selected: config.selectedOllamaId },
    openai: { list: config.openaiConfigs, selected: config.selectedOpenAIId },
    azure: { list: config.azureConfigs, selected: config.selectedAzureId },
  };

  const activeProfile =
    config.apiMode === "ollama"
      ? config.ollamaConfigs.find((c: any) => c.llmProfileId === config.selectedOllamaId) || config.ollamaConfigs[0]
      : config.apiMode === "openai"
      ? config.openaiConfigs.find((c: any) => c.llmProfileId === config.selectedOpenAIId) || config.openaiConfigs[0]
      : config.apiMode === "azure"
      ? config.azureConfigs.find((c: any) => c.llmProfileId === config.selectedAzureId) || config.azureConfigs[0]
      : null;

  // Auto-select first config if none selected
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

  const canContinue = inputs.requirements.trim().length > 0 && selectedConfigId;

  const handleContinue = () => {
    if (!canContinue) return;

    // Navigate to review/start page with inputs as query params
    const params = new URLSearchParams({
      requirements: inputs.requirements,
      context: inputs.context,
      constraints: inputs.constraints
    });
    
    router.push(`/feature-workflow/start?${params.toString()}`);
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-foreground font-medium">Define Feature</span>
        <ArrowRight className="h-4 w-4" />
        <span>Review & Start</span>
        <ArrowRight className="h-4 w-4" />
        <span>Monitor</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Layers className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">New Feature Workflow</h1>
          <p className="text-muted-foreground mt-2">
            Define your feature request and let the AI Scrum team generate all artifacts
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Feature Request Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Request</CardTitle>
            <CardDescription>Describe the feature you want to build - the AI team will handle the rest</CardDescription>
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
              <Label htmlFor="requirements">
                Feature Description *
                <span className="text-xs text-muted-foreground ml-2">(Required)</span>
              </Label>
              <Textarea
                id="requirements"
                value={inputs.requirements}
                onChange={(e) => {
                  setInputs({ ...inputs, requirements: e.target.value });
                  setSelectedTemplate("custom");
                }}
                placeholder="E.g., Build a user authentication system with email and password login, multi-factor authentication, and password reset functionality..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {inputs.requirements.length} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">
                Business Context
                <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
              </Label>
              <Textarea
                id="context"
                value={inputs.context}
                onChange={(e) => {
                  setInputs({ ...inputs, context: e.target.value });
                  setSelectedTemplate("custom");
                }}
                placeholder="E.g., This is for a SaaS application targeting small businesses. Security and ease of use are top priorities..."
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraints">
                Technical Constraints
                <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
              </Label>
              <Textarea
                id="constraints"
                value={inputs.constraints}
                onChange={(e) => {
                  setInputs({ ...inputs, constraints: e.target.value });
                  setSelectedTemplate("custom");
                }}
                placeholder="E.g., Must use React 18+, Node.js backend, PostgreSQL database, deploy on AWS..."
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuration Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Provider</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/configure')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Select your LLM configuration</CardDescription>
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
                <Label className="text-xs">Configuration Profile</Label>
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
                <div className="text-sm space-y-2 text-muted-foreground border rounded-md p-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-foreground">Ready to Generate</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">Provider:</span>{" "}
                      <Badge variant="outline" className="capitalize ml-1">
                        {config.apiMode === "azure" ? "Azure OpenAI" : config.apiMode}
                      </Badge>
                    </div>
                    {config.apiMode === "ollama" && activeProfile.data && "model" in activeProfile.data && (
                      <div>
                        <span className="font-medium">Model:</span> {activeProfile.data.model}
                      </div>
                    )}
                    {config.apiMode === "openai" && activeProfile.data && "model" in activeProfile.data && (
                      <div>
                        <span className="font-medium">Model:</span> {activeProfile.data.model}
                      </div>
                    )}
                    {config.apiMode === "azure" && activeProfile.data && "deployment" in activeProfile.data && (
                      <div>
                        <span className="font-medium">Deployment:</span> {activeProfile.data.deployment}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!config.apiMode && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Please configure an AI provider to continue
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">What gets generated?</div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Your AI Scrum team will create user stories, sprint plans, technical designs, tests, and documentation
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-medium">Duration</div>
                    <div className="text-muted-foreground">2-3 minutes</div>
                  </div>
                  <div>
                    <div className="font-medium">Agents</div>
                    <div className="text-muted-foreground">5 specialists</div>
                  </div>
                  <div>
                    <div className="font-medium">Deliverables</div>
                    <div className="text-muted-foreground">8-12 artifacts</div>
                  </div>
                  <div>
                    <div className="font-medium">Format</div>
                    <div className="text-muted-foreground">Text + Code</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!canContinue}
          className="min-w-[200px]"
        >
          Continue to Review
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
