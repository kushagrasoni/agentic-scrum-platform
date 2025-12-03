"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useConfigStore } from "@/stores/config-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useExecuteAgents } from "@/hooks/use-agents";
import { Users, BookOpen, FileText, TestTube, CheckCircle, ArrowLeft, ArrowRight, Clock, Sparkles, AlertCircle, Layers } from "lucide-react";

export default function FeatureWorkflowStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = useConfigStore();
  const execution = useExecutionStore();
  const { mutateAsync: executeAgentsAsync, isPending } = useExecuteAgents();

  // Get inputs from query params (passed from feature-workflow page)
  const [inputs, setInputs] = useState({
    requirements: searchParams.get('requirements') || '',
    context: searchParams.get('context') || '',
    constraints: searchParams.get('constraints') || ''
  });

  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    // If no inputs, redirect back to feature-workflow page
    if (!inputs.requirements) {
      router.push('/feature-workflow');
      return;
    }

    // Get selected profile ID
    const selectedId = config.apiMode === 'ollama' ? config.selectedOllamaId :
                       config.apiMode === 'openai' ? config.selectedOpenAIId :
                       config.apiMode === 'azure' ? config.selectedAzureId : null;
    
    setProfileId(selectedId);
  }, [config, inputs.requirements, router]);

  const handleStartWorkflow = async () => {
    if (!profileId) {
      alert("Please select and save a configuration profile");
      return;
    }

    try {
      // Start execution
      const response = await executeAgentsAsync({
        llmProfileId: profileId,
        inputs
      });
      
      // Initialize execution state
      execution.startExecution(response.sessionId);
      
      // Immediately redirect to session page for live monitoring
      router.push(`/session/${response.sessionId}`);
    } catch (error: any) {
      console.error("Workflow failed:", error);
      alert(`Workflow failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleBack = () => {
    router.push('/feature-workflow');
  };

  const getProviderDisplay = () => {
    if (config.apiMode === 'ollama') {
      const profile = config.ollamaConfigs.find(c => c.llmProfileId === profileId);
      return {
        provider: 'Ollama',
        model: profile?.data?.model || 'Unknown',
        endpoint: profile?.data?.url || 'Unknown'
      };
    } else if (config.apiMode === 'openai') {
      const profile = config.openaiConfigs.find(c => c.llmProfileId === profileId);
      return {
        provider: 'OpenAI',
        model: profile?.data?.model || 'Unknown',
        endpoint: 'OpenAI API'
      };
    } else if (config.apiMode === 'azure') {
      const profile = config.azureConfigs.find(c => c.llmProfileId === profileId);
      return {
        provider: 'Azure OpenAI',
        model: profile?.data?.deployment || 'Unknown',
        endpoint: profile?.data?.endpoint || 'Unknown'
      };
    }
    return { provider: 'Unknown', model: 'Unknown', endpoint: 'Unknown' };
  };

  const providerInfo = getProviderDisplay();

  const agentTeam = [
    {
      name: "Product Owner",
      icon: Users,
      role: "Vision & Requirements",
      deliverable: "Product vision, user stories with acceptance criteria",
      color: "blue"
    },
    {
      name: "Scrum Master",
      icon: BookOpen,
      role: "Planning & Coordination",
      deliverable: "Sprint plan, task breakdown, risk analysis",
      color: "purple"
    },
    {
      name: "Developer",
      icon: FileText,
      role: "Technical Implementation",
      deliverable: "Technical design, architecture, code implementation",
      color: "green"
    },
    {
      name: "QA Engineer",
      icon: TestTube,
      role: "Quality Assurance",
      deliverable: "Test cases, test data, automation scripts",
      color: "orange"
    },
    {
      name: "Release Manager",
      icon: CheckCircle,
      role: "Summary & Documentation",
      deliverable: "Executive summary, delivery plan, documentation",
      color: "pink"
    }
  ];

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Define Feature</span>
        <ArrowRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Review & Start</span>
        <ArrowRight className="h-4 w-4" />
        <span>Monitor</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Layers className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Review & Start Workflow</h1>
          <p className="text-muted-foreground mt-2">
            Review your feature request before the AI Scrum team begins generating artifacts
          </p>
        </div>
      </div>

      {/* Configuration Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LLM Configuration</CardTitle>
              <CardDescription>AI provider and model settings</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/configure')}>
              Change Configuration
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Provider</div>
              <div className="text-lg font-semibold">{providerInfo.provider}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Model</div>
              <div className="text-lg font-semibold">{providerInfo.model}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge variant="default">Ready</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Request Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Request Preview</CardTitle>
              <CardDescription>Your feature specifications</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleBack}>
              Edit Feature Request
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">Feature Description</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-md max-h-[150px] overflow-y-auto">
              {inputs.requirements || "No description specified"}
            </div>
          </div>
          
          {inputs.context && (
            <div>
              <div className="text-sm font-semibold mb-2">Business Context</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-md max-h-[100px] overflow-y-auto">
                {inputs.context}
              </div>
            </div>
          )}
          
          {inputs.constraints && (
            <div>
              <div className="text-sm font-semibold mb-2">Technical Constraints</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-md max-h-[100px] overflow-y-auto">
                {inputs.constraints}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Scrum Team */}
      <Card>
        <CardHeader>
          <CardTitle>AI Scrum Team</CardTitle>
          <CardDescription>Your virtual team members and their responsibilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentTeam.map((agent, index) => {
              const Icon = agent.icon;
              return (
                <div key={agent.name}>
                  <div className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                    <div className={`p-3 rounded-lg bg-${agent.color}-100 dark:bg-${agent.color}-950`}>
                      <Icon className={`h-6 w-6 text-${agent.color}-600 dark:text-${agent.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{agent.name}</h4>
                        <Badge variant="outline" className="text-xs">{agent.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Delivers:</span> {agent.deliverable}
                      </p>
                    </div>
                  </div>
                  {index < agentTeam.length - 1 && (
                    <div className="flex justify-center my-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Duration & Deliverables */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">2-3 mins</div>
                <div className="text-sm text-muted-foreground">Estimated Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">8-12</div>
                <div className="text-sm text-muted-foreground">Artifacts Generated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What You'll Receive */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <div className="font-semibold mb-2">By starting this workflow, you will receive:</div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Comprehensive product vision and user stories</li>
            <li>Detailed sprint plan with task breakdown</li>
            <li>Technical architecture and code implementation</li>
            <li>Complete test cases and automation scripts</li>
            <li>Executive summary and delivery documentation</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack} disabled={isPending}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feature Request
        </Button>
        
        <Button 
          size="lg" 
          onClick={handleStartWorkflow}
          disabled={isPending || !profileId}
        >
          {isPending ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Starting Workflow...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Start Feature Workflow
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
