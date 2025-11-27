"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfigStore } from "@/stores/config-store";
import { useTestConnection } from "@/hooks/use-config";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ApiConfig } from "@/types";

export default function ConfigurePage() {
  const { 
    apiMode, 
    setApiMode, 
    ollamaConfig, 
    openaiConfig, 
    azureConfig,
    setOllamaConfig, 
    setOpenAIConfig, 
    setAzureConfig 
  } = useConfigStore();
  const { mutate: testConnection, isPending, data, error } = useTestConnection();

  // Form states - Initialize from stored config
  const [ollamaForm, setOllamaForm] = useState({ 
    url: ollamaConfig.url || "http://localhost:11434", 
    model: ollamaConfig.model || "llama2" 
  });
  const [openaiForm, setOpenaiForm] = useState({ 
    apiKey: openaiConfig.apiKey || "", 
    model: openaiConfig.model || "gpt-4" 
  });
  const [azureForm, setAzureForm] = useState({
    apiKey: azureConfig.apiKey || "787ea8781af74e4dbe4ebc6673aa8ccd",
    endpoint: azureConfig.endpoint || "https://genaipoc-apimgmtservices.azure-api.net/",
    deployment: azureConfig.deployment || "gpt-5-chat",
    apiVersion: azureConfig.apiVersion || "2025-01-01-preview"
  });

  // Load saved config from store only once on mount
  useEffect(() => {
    // Only update if form is empty and store has data
    if (ollamaConfig.url && !ollamaForm.url) {
      setOllamaForm({ 
        url: ollamaConfig.url, 
        model: ollamaConfig.model 
      });
    }
    if (openaiConfig.apiKey && !openaiForm.apiKey) {
      setOpenaiForm({ 
        apiKey: openaiConfig.apiKey, 
        model: openaiConfig.model 
      });
    }
    if (azureConfig.apiKey && !azureForm.apiKey) {
      setAzureForm({
        apiKey: azureConfig.apiKey,
        endpoint: azureConfig.endpoint,
        deployment: azureConfig.deployment,
        apiVersion: azureConfig.apiVersion
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleTest = () => {
    // Guard against null apiMode
    if (!apiMode) {
      console.error("No API mode selected");
      return;
    }

    // Build properly typed config based on mode
    let config: ApiConfig;
    
    if (apiMode === "ollama") {
      config = { mode: 'ollama' as const, ...ollamaForm };
    } else if (apiMode === "openai") {
      config = { mode: 'openai' as const, ...openaiForm };
    } else {
      config = { mode: 'azure' as const, ...azureForm };
    }

    testConnection(config, {
      onSuccess: (data) => {
        // Save configuration on successful test
        if (apiMode === "ollama") {
          setOllamaConfig(ollamaForm);
        } else if (apiMode === "openai") {
          setOpenAIConfig(openaiForm);
        } else if (apiMode === "azure") {
          setAzureConfig(azureForm);
        }
        
        // Mark as configured
        setApiMode(apiMode);
      }
    });
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Configure AI Provider</h1>
        <p className="text-muted-foreground mt-2">
          Set up your preferred LLM provider to power the Scrum agents
        </p>
      </div>

      <Tabs value={apiMode || "ollama"} onValueChange={(value: any) => setApiMode(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ollama">Ollama</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="azure">Azure OpenAI</TabsTrigger>
        </TabsList>

        <TabsContent value="ollama" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ollama Configuration</CardTitle>
              <CardDescription>
                Connect to your local Ollama instance for private, on-premise AI processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ollama-url">Server URL</Label>
                <Input
                  id="ollama-url"
                  value={ollamaForm.url}
                  onChange={(e) => setOllamaForm({ ...ollamaForm, url: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ollama-model">Model Name</Label>
                <Input
                  id="ollama-model"
                  value={ollamaForm.model}
                  onChange={(e) => setOllamaForm({ ...ollamaForm, model: e.target.value })}
                  placeholder="llama2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openai" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI Configuration</CardTitle>
              <CardDescription>
                Use OpenAI's powerful models like GPT-4 for best quality results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={openaiForm.apiKey}
                  onChange={(e) => setOpenaiForm({ ...openaiForm, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai-model">Model</Label>
                <Input
                  id="openai-model"
                  value={openaiForm.model}
                  onChange={(e) => setOpenaiForm({ ...openaiForm, model: e.target.value })}
                  placeholder="gpt-4"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="azure" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Azure OpenAI Configuration</CardTitle>
              <CardDescription>
                Connect to your enterprise Azure OpenAI deployment with APIM support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="azure-key">API Key</Label>
                <Input
                  id="azure-key"
                  type="password"
                  value={azureForm.apiKey}
                  onChange={(e) => setAzureForm({ ...azureForm, apiKey: e.target.value })}
                  placeholder="Your Azure API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azure-endpoint">Endpoint</Label>
                <Input
                  id="azure-endpoint"
                  value={azureForm.endpoint}
                  onChange={(e) => setAzureForm({ ...azureForm, endpoint: e.target.value })}
                  placeholder="https://your-resource.openai.azure.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azure-deployment">Deployment Name</Label>
                <Input
                  id="azure-deployment"
                  value={azureForm.deployment}
                  onChange={(e) => setAzureForm({ ...azureForm, deployment: e.target.value })}
                  placeholder="gpt-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azure-version">API Version</Label>
                <Input
                  id="azure-version"
                  value={azureForm.apiVersion}
                  onChange={(e) => setAzureForm({ ...azureForm, apiVersion: e.target.value })}
                  placeholder="2024-02-01"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
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
    </div>
  );
}
