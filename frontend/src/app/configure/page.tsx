"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useConfigStore, ApiMode, ConfigProfile } from "@/stores/config-store";
import { useTestConnection } from "@/hooks/use-config";
import { CheckCircle2, XCircle, Loader2, Plus, Pencil, Dot } from "lucide-react";
import type { ApiConfig } from "@/types";
import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";

type FormState = {
  name: string;
  url?: string;
  model?: string;
  apiKey?: string;
  endpoint?: string;
  deployment?: string;
  apiVersion?: string;
};

export default function ConfigurePage() {
  const {
    apiMode,
    setApiMode,
    ollamaConfigs,
    openaiConfigs,
    azureConfigs,
    selectedOllamaId,
    selectedOpenAIId,
    selectedAzureId,
    addOllamaConfig,
    addOpenAIConfig,
    addAzureConfig,
    addOllamaProfile,
    addOpenAIProfile,
    addAzureProfile,
    selectOllamaConfig,
    selectOpenAIConfig,
    selectAzureConfig,
    updateOllamaConfig,
    updateOpenAIConfig,
    updateAzureConfig,
    ollamaConfig,
    openaiConfig,
    azureConfig,
    replaceProfiles,
  } = useConfigStore();
  const { mutate: testConnection, isPending, data, error } = useTestConnection();
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ApiMode>("ollama");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "New Config",
    url: "http://localhost:11434",
    model: "llama2",
  });

  const activeConfig: ApiConfig | null = useMemo(() => {
    if (apiMode === "ollama" && ollamaConfig) return { mode: "ollama", ...ollamaConfig };
    if (apiMode === "openai" && openaiConfig) return { mode: "openai", ...openaiConfig };
    if (apiMode === "azure" && azureConfig) return { mode: "azure", ...azureConfig };
    return null;
  }, [apiMode, ollamaConfig, openaiConfig, azureConfig]);

  const handleTest = () => {
    if (!apiMode || !activeConfig) {
      console.error("No API mode or config selected");
      return;
    }
    // Prefer server-side profiles by ID to avoid leaking secrets client-side.
    const payload = apiMode === "ollama"
      ? { llmProfileId: selectedOllamaId }
      : apiMode === "openai"
      ? { llmProfileId: selectedOpenAIId }
      : apiMode === "azure"
      ? { llmProfileId: selectedAzureId }
      : activeConfig;

    testConnection(payload);
  };

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoadingProfiles(true);
        const result = await apiClient.config.profiles.list();
        replaceProfiles({
          ollama: result.ollama || [],
          openai: result.openai || [],
          azure: result.azure || [],
        });
      } catch (err) {
        console.error("Failed to load profiles", err);
      } finally {
        setLoadingProfiles(false);
      }
    };
    loadProfiles();
  }, [replaceProfiles]);

  // Ensure a selection exists so Active badge and selects render correctly
  useEffect(() => {
    if (!apiMode) {
      const fallbackMode =
        (ollamaConfigs.length && "ollama") ||
        (openaiConfigs.length && "openai") ||
        (azureConfigs.length && "azure") ||
        null;
      if (fallbackMode) {
        setApiMode(fallbackMode);
      }
    }

    if (apiMode === "ollama" && !selectedOllamaId && ollamaConfigs[0]?.llmProfileId) {
      selectOllamaConfig(ollamaConfigs[0].llmProfileId);
    }
    if (apiMode === "openai" && !selectedOpenAIId && openaiConfigs[0]?.llmProfileId) {
      selectOpenAIConfig(openaiConfigs[0].llmProfileId);
    }
    if (apiMode === "azure" && !selectedAzureId && azureConfigs[0]?.llmProfileId) {
      selectAzureConfig(azureConfigs[0].llmProfileId);
    }
  }, [
    apiMode,
    ollamaConfigs,
    openaiConfigs,
    azureConfigs,
    selectedOllamaId,
    selectedOpenAIId,
    selectedAzureId,
    setApiMode,
    selectOllamaConfig,
    selectOpenAIConfig,
    selectAzureConfig,
  ]);

  const openDialog = (mode: ApiMode, profile?: ConfigProfile<any>) => {
    setDialogMode(mode);
    setEditingId(profile?.llmProfileId ?? null);
    if (mode === "ollama") {
      setForm({
        name: profile?.name || "New Ollama Config",
        url: profile?.data.url || "http://localhost:11434",
        model: profile?.data.model || "llama2",
      });
    } else if (mode === "openai") {
      setForm({
        name: profile?.name || "New OpenAI Config",
        apiKey: profile?.data.apiKey || "",
        model: profile?.data.model || "gpt-4o",
      });
    } else {
      setForm({
        name: profile?.name || "New Azure Config",
        apiKey: profile?.data.apiKey || "",
        endpoint: profile?.data.endpoint || "https://your-resource.openai.azure.com/",
        deployment: profile?.data.deployment || "gpt-4o",
        apiVersion: profile?.data.apiVersion || "2024-02-01",
      });
    }
    setDialogOpen(true);
  };

  const saveDialog = () => {
    if (dialogMode === "ollama") {
      if (editingId) {
        apiClient.config.profiles.update(editingId, { mode: "ollama", name: form.name, data: { url: form.url || "", model: form.model || "" } })
          .then((profile) => {
            updateOllamaConfig(editingId, { name: profile.name, data: profile.data, updatedAt: profile.updatedAt });
            selectOllamaConfig(editingId);
          });
      } else {
        apiClient.config.profiles.create({ mode: "ollama", name: form.name, data: { url: form.url || "", model: form.model || "" } })
          .then((profile) => {
            addOllamaProfile(profile);
            selectOllamaConfig(profile.llmProfileId);
          });
      }
      setApiMode("ollama");
    }
    if (dialogMode === "openai") {
      if (editingId) {
        apiClient.config.profiles.update(editingId, { mode: "openai", name: form.name, data: { apiKey: form.apiKey || "", model: form.model || "" } })
          .then((profile) => {
            updateOpenAIConfig(editingId, { name: profile.name, data: profile.data, updatedAt: profile.updatedAt });
            selectOpenAIConfig(editingId);
          });
      } else {
        apiClient.config.profiles.create({ mode: "openai", name: form.name, data: { apiKey: form.apiKey || "", model: form.model || "" } })
          .then((profile) => {
            addOpenAIProfile(profile);
            selectOpenAIConfig(profile.llmProfileId);
          });
      }
      setApiMode("openai");
    }
    if (dialogMode === "azure") {
      if (editingId) {
        apiClient.config.profiles.update(editingId, { 
          mode: "azure",
          name: form.name, 
          data: { 
            apiKey: form.apiKey || "", 
            endpoint: form.endpoint || "", 
            deployment: form.deployment || "", 
            apiVersion: form.apiVersion || "" 
          } 
        }).then((profile) => {
          updateAzureConfig(editingId, { name: profile.name, data: profile.data, updatedAt: profile.updatedAt });
          selectAzureConfig(editingId);
        });
      } else {
        apiClient.config.profiles.create({ 
          mode: "azure",
          name: form.name, 
          data: { 
            apiKey: form.apiKey || "", 
            endpoint: form.endpoint || "", 
            deployment: form.deployment || "", 
            apiVersion: form.apiVersion || "" 
          } 
        }).then((profile) => {
          addAzureProfile(profile);
          selectAzureConfig(profile.llmProfileId);
        });
      }
      setApiMode("azure");
    }
    setDialogOpen(false);
  };

  const configGroups = [
    {
      mode: "ollama" as ApiMode,
      title: "Ollama",
      description: "Local/private models via Ollama",
      configs: ollamaConfigs,
      selectedId: selectedOllamaId,
      onSelect: selectOllamaConfig,
      fields: (
        <>
          <div className="space-y-2">
            <Label>Server URL</Label>
            <Input
              value={form.url || ""}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="http://localhost:11434"
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input
              value={form.model || ""}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="llama2"
            />
          </div>
        </>
      ),
    },
    {
      mode: "openai" as ApiMode,
      title: "OpenAI",
      description: "Hosted OpenAI models",
      configs: openaiConfigs,
      selectedId: selectedOpenAIId,
      onSelect: selectOpenAIConfig,
      fields: (
        <>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={form.apiKey || ""}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="sk-..."
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input
              value={form.model || ""}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="gpt-4o"
            />
          </div>
        </>
      ),
    },
    {
      mode: "azure" as ApiMode,
      title: "Azure OpenAI",
      description: "Enterprise deployments via APIM/VNet",
      configs: azureConfigs,
      selectedId: selectedAzureId,
      onSelect: selectAzureConfig,
      fields: (
        <>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={form.apiKey || ""}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="Azure API key"
            />
          </div>
          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Input
              value={form.endpoint || ""}
              onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
              placeholder="https://your-resource.openai.azure.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Deployment</Label>
            <Input
              value={form.deployment || ""}
              onChange={(e) => setForm((f) => ({ ...f, deployment: e.target.value }))}
              placeholder="gpt-4o"
            />
          </div>
          <div className="space-y-2">
            <Label>API Version</Label>
            <Input
              value={form.apiVersion || ""}
              onChange={(e) => setForm((f) => ({ ...f, apiVersion: e.target.value }))}
              placeholder="2024-02-01"
            />
          </div>
        </>
      ),
    },
  ];

  const renderConfigCards = (group: typeof configGroups[number]) => (
    <div className="space-y-3">
      {group.configs.map((cfg, idx) => {
        const isActive = cfg.llmProfileId === group.selectedId;
        return (
          <Card
            key={cfg.llmProfileId || `${group.mode}-cfg-${idx}`}
            className={`border ${isActive ? "border-primary" : ""} cursor-pointer`}
            onClick={() => {
              group.onSelect(cfg.llmProfileId);
              setApiMode(group.mode);
            }}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{cfg.name}</CardTitle>
                  {isActive && <Badge variant="default">Active</Badge>}
                </div>
                <CardDescription className="text-xs mt-1">
                  Updated {new Date(cfg.updatedAt).toISOString().replace("T", " ").replace("Z", " UTC")}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  openDialog(group.mode, cfg);
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {group.mode === "ollama" && (
                <>
                  <div>URL: {cfg.data.url}</div>
                  <div>Model: {cfg.data.model}</div>
                </>
              )}
              {group.mode === "openai" && (
                <>
                  <div>Model: {cfg.data.model}</div>
                  <div className="flex items-center gap-1">
                    <Dot className="h-4 w-4 text-muted-foreground" />
                    API key masked
                  </div>
                </>
              )}
              {group.mode === "azure" && (
                <>
                  <div>Endpoint: {cfg.data.endpoint}</div>
                  <div>Deployment: {cfg.data.deployment}</div>
                  <div>Version: {cfg.data.apiVersion}</div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => openDialog(group.mode)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {group.title} Configuration
      </Button>
    </div>
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Configure AI Provider</h1>
        <p className="text-muted-foreground mt-2">
          Save multiple provider profiles and pick the one you need per run.
        </p>
      </div>

      <Tabs value={apiMode || "ollama"} onValueChange={(value: any) => setApiMode(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ollama">Ollama</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="azure">Azure OpenAI</TabsTrigger>
        </TabsList>

        {configGroups.map((group) => (
          <TabsContent key={group.mode} value={group.mode} className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{group.title} Configurations</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </div>
              <Button onClick={() => openDialog(group.mode)}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <Separator />
            {renderConfigCards(group)}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-4">
        <Button onClick={handleTest} disabled={isPending} className="flex-1">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
        <Button variant="outline" asChild>
          <Link href="/execute">Continue to Execution</Link>
        </Button>
      </div>

      {data && (
        <Alert className={data.success ? "border-green-500" : "border-red-500"}>
          {data.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            {data.message}
            {data.models && data.models.length > 0 && (
              <div className="flex gap-2 mt-2">
                {data.models.map((model) => (
                  <Badge key={model} variant="secondary">
                    {model}
                  </Badge>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Connection test failed: {error.message}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Configuration" : "Add Configuration"}</DialogTitle>
            <DialogDescription>
              Save and select a configuration to reuse it across Execute.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Azure APIM Prod"
              />
            </div>
            {configGroups.find((g) => g.mode === dialogMode)?.fields}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDialog}>
              Save & Set Active
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
