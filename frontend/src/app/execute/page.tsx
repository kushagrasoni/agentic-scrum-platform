"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useConfigStore } from "@/stores/config-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useExecuteAgents } from "@/hooks/use-agents";
import { CheckCircle2, Circle, Loader2, AlertCircle, Download, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExecutePage() {
  const router = useRouter();
  const config = useConfigStore();
  const execution = useExecutionStore();
  const { mutate: executeAgents, isPending } = useExecuteAgents();

  const [inputs, setInputs] = useState({
    requirements: `Deliver a loan admin UI this sprint that allows searching for commercial loans, viewing associated invoices and processing payments with automated allocation (interest -> fees -> principal -> late charges), integrated with ACBS APIs for invoice retrieval and payment posting, while persisting transaction in Oracle DB.`,
    context: `The Commercial Lending Operations team currently manages loan payments manually through spreadsheets and legacy mainframe systems. This creates delays, errors in payment allocation, and poor audit trails. The new system needs to integrate with the existing ACBS (Advanced Credit Banking System) APIs and Oracle database infrastructure. Target users are 50+ loan administrators who process an average of 200 payments daily across multiple commercial loan portfolios.`,
    constraints: `- Must complete development within current 2-week sprint
- Backend must use Java Spring Boot with existing microservices architecture
- Frontend: React TypeScript with Material-UI components (existing design system)
- All ACBS API calls must go through API Gateway with OAuth 2.0
- Payment allocation logic must match existing business rules (no changes)
- Oracle DB schema cannot be modified (read-only invoice tables, write to new payment_transactions table)
- Must maintain audit trail for SOX compliance
- Performance: Search results < 2 seconds, payment processing < 5 seconds
- Security: Role-based access control (Admin, Processor, Viewer roles)
- No external dependencies - must work on internal network only`
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

    // Build properly typed config
    let configData;
    if (config.apiMode === "ollama") {
      configData = { mode: 'ollama' as const, ...config.ollamaConfig };
    } else if (config.apiMode === "openai") {
      configData = { mode: 'openai' as const, ...config.openaiConfig };
    } else {
      configData = { mode: 'azure' as const, ...config.azureConfig };
    }

    console.log("Executing with config:", configData);

    executeAgents(
      {
        config: configData,
        inputs
      },
      {
        onSuccess: (response) => {
          execution.startExecution(response.sessionId);
          // Start polling for status
          startStatusPolling(response.sessionId);
        },
        onError: (error) => {
          console.error("Execution failed:", error);
          alert(`Execution failed: ${error.message}`);
        }
      }
    );
  };

  const startStatusPolling = (sessionId: string) => {
    // TODO: Implement SSE connection for real-time updates
    // For now, we'll show the execution started
    console.log("Execution started:", sessionId);
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

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Configuration Status Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Execute Scrum Workflow</h1>
          <p className="text-muted-foreground mt-2">
            Provide your requirements and let AI agents handle the Scrum process
          </p>
        </div>
        
        {/* Active Configuration Card */}
        <Card className="w-80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Configuration</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <Link href="/configure">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {config.apiMode ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="default" 
                    className="capitalize"
                  >
                    {config.apiMode === "azure" ? "Azure OpenAI" : config.apiMode}
                  </Badge>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                
                {/* Show provider-specific details */}
                <div className="text-sm space-y-1 text-muted-foreground">
                  {config.apiMode === "ollama" && (
                    <>
                      <div>URL: {config.ollamaConfig.url}</div>
                      <div>Model: {config.ollamaConfig.model}</div>
                    </>
                  )}
                  {config.apiMode === "openai" && (
                    <>
                      <div>Model: {config.openaiConfig.model}</div>
                      <div>API Key: ••••{config.openaiConfig.apiKey.slice(-4)}</div>
                    </>
                  )}
                  {config.apiMode === "azure" && (
                    <>
                      <div>Deployment: {config.azureConfig.deployment}</div>
                      <div>Endpoint: {config.azureConfig.endpoint.split('/')[2]}</div>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full mt-2"
                >
                  <Link href="/configure">
                    <Settings className="mr-2 h-3 w-3" />
                    Change Provider
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    No AI provider configured
                  </AlertDescription>
                </Alert>
                <Button
                  asChild
                  className="w-full mt-2"
                >
                  <Link href="/configure">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Now
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Requirements</CardTitle>
              <CardDescription>
                Describe what you want to build and any relevant context
              </CardDescription>
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
        </div>

        {/* Execution Status Section */}
        <div className="space-y-6">
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

          {/* Logs Section */}
          {isExecuting && execution.logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Real-time updates from agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
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

          {/* Artifacts Section */}
          {execution.artifacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Artifacts</CardTitle>
                <CardDescription>
                  Documents created by the agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {execution.artifacts.map((artifact, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>{artifact}</span>
                      <Download className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {execution.sessionId && (
        <Alert>
          <AlertDescription>
            Session ID: <code className="font-mono">{execution.sessionId}</code>
            <Button
              variant="link"
              className="ml-4"
              onClick={() => router.push(`/history/${execution.sessionId}`)}
            >
              View in History
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
