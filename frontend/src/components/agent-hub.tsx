'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useConfigStore } from '@/stores/config-store';
import type { AgentName, SingleAgentResponse } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Sparkles, Target, Wand2, History, Lightbulb, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

type QuickTemplate = {
  title: string;
  prompt: string;
  context?: string;
  constraints?: string;
};

// Helper component to format agent output based on agent type
function AgentOutputFormatter({ output, agentName }: { output: string; agentName: AgentName }) {
  try {
    const parsed = JSON.parse(output);
    
    // Product Owner output
    if (agentName === 'product_owner' && parsed.user_stories) {
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Vision & Scope */}
          {parsed.vision && (
            <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Vision
              </h4>
              <p className="text-sm text-muted-foreground">{parsed.vision}</p>
            </div>
          )}
          
          {/* User Stories */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">User Stories ({parsed.user_stories.length})</h4>
            {parsed.user_stories.map((story: any, idx: number) => (
              <div key={idx} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{story.id}</Badge>
                      {story.priority && (
                        <Badge variant={story.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                          {story.priority}
                        </Badge>
                      )}
                      {story.story_points && (
                        <Badge variant="outline" className="text-xs">{story.story_points} pts</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{story.title}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  As a <span className="font-medium">{story.as_a}</span>, I want {story.i_want} so that {story.so_that}
                </p>
                {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold">Acceptance Criteria:</p>
                    {story.acceptance_criteria.map((ac: any, acIdx: number) => (
                      <div key={acIdx} className="text-xs text-muted-foreground pl-3 border-l-2 border-muted">
                        <span className="font-medium">Given</span> {ac.given}, <span className="font-medium">when</span> {ac.when}, <span className="font-medium">then</span> {ac.then}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Scrum Master output
    if (agentName === 'scrum_master' && parsed.tasks) {
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Sprint Tasks ({parsed.tasks.length})</h4>
            {parsed.tasks.map((task: any, idx: number) => (
              <div key={idx} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{task.id}</Badge>
                      {task.priority && (
                        <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                          {task.priority}
                        </Badge>
                      )}
                      {task.estimated_hours && (
                        <Badge variant="outline" className="text-xs">{task.estimated_hours}h</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{task.title}</p>
                  </div>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                )}
                {task.dependencies && task.dependencies.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">Depends on:</span>
                    {task.dependencies.map((dep: string, depIdx: number) => (
                      <Badge key={depIdx} variant="outline" className="text-xs">{dep}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // QA Automation output
    if (agentName === 'qa_automation' && parsed.test_cases) {
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Test Cases ({parsed.test_cases.length})</h4>
            {parsed.test_cases.map((test: any, idx: number) => (
              <div key={idx} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{test.id}</Badge>
                      {test.priority && (
                        <Badge variant={test.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                          {test.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{test.title}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {test.preconditions && (
                    <p><span className="font-semibold">Preconditions:</span> {test.preconditions}</p>
                  )}
                  {test.steps && test.steps.length > 0 && (
                    <div>
                      <p className="font-semibold">Steps:</p>
                      <ol className="list-decimal list-inside pl-2 space-y-0.5 text-muted-foreground">
                        {test.steps.map((step: string, stepIdx: number) => (
                          <li key={stepIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {test.expected_result && (
                    <p><span className="font-semibold">Expected:</span> {test.expected_result}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Fallback for other agent types - show formatted JSON sections
    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Object.entries(parsed).map(([key, value]) => (
          <div key={key} className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-semibold capitalize mb-2">{key.replace(/_/g, ' ')}</h4>
            {Array.isArray(value) ? (
              <div className="space-y-2">
                {value.map((item: any, idx: number) => (
                  <div key={idx} className="text-xs text-muted-foreground border-l-2 border-muted pl-3">
                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                  </div>
                ))}
              </div>
            ) : typeof value === 'object' ? (
              <pre className="text-xs text-muted-foreground">{JSON.stringify(value, null, 2)}</pre>
            ) : (
              <p className="text-sm text-muted-foreground">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    );
  } catch (error) {
    // If JSON parsing fails, show raw output
    return (
      <div className="rounded-md border bg-muted/30 p-3 max-h-96 overflow-y-auto">
        <pre className="text-xs whitespace-pre-wrap">{output}</pre>
      </div>
    );
  }
}

const agentMeta: Record<AgentName, { label: string; accent: string; blurb: string; templates: QuickTemplate[] }> = {
  product_owner: {
    label: 'Product Owner',
    accent: 'bg-blue-50 text-blue-700 border-blue-200',
    blurb: 'Generate epic vision, user stories, and acceptance criteria.',
    templates: [
      { 
        title: '3 concise stories', 
        prompt: 'Create 3 user stories for the capability: real-time incident notifications with SLA timers for ops teams.',
        constraints: '2-week sprint, microservices architecture, must integrate with PagerDuty and Slack, <500ms notification latency'
      },
      { 
        title: 'Acceptance criteria only', 
        prompt: 'Expand acceptance criteria for US-101 around passwordless login with device binding.',
        constraints: 'FIDO2/WebAuthn compliant, support iOS and Android, fallback to email OTP, WCAG 2.1 Level AA accessibility'
      },
    ],
  },
  scrum_master: {
    label: 'Scrum Master',
    accent: 'bg-purple-50 text-purple-700 border-purple-200',
    blurb: 'Break work into sprint tasks with dependencies and risks.',
    templates: [
      { 
        title: 'Task breakdown', 
        prompt: 'Break these stories into tasks: US-101 build auth API, US-102 build login UI, US-103 set up telemetry.',
        constraints: '5-day sprint, team of 4 (2 backend, 2 frontend), all tasks <8 hours, daily standup at 9am EST'
      },
      { 
        title: 'Risk register', 
        prompt: 'List top 5 execution risks for sprint 3 on mobile auth and propose mitigations.',
        constraints: 'Include technical debt items, dependency on external OAuth provider, 2 junior devs new to the codebase'
      },
    ],
  },
  tech_lead: {
    label: 'Tech Lead / Architect',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blurb: 'Draft architecture, APIs, and security controls.',
    templates: [
      { 
        title: 'API spec', 
        prompt: 'Design REST endpoints for a notifications service supporting create/list/update channels with webhook and email transports.',
        constraints: 'OpenAPI 3.0 spec, RESTful conventions, rate limiting 100 req/min per tenant, idempotency keys required, JWT auth'
      },
      { 
        title: 'Security checklist', 
        prompt: 'Produce security considerations for multi-tenant SaaS: authn, authz, tenancy isolation, audit logging.',
        constraints: 'SOC 2 Type II compliance required, RBAC with custom roles, row-level security in PostgreSQL, 1-year audit retention'
      },
    ],
  },
  developer: {
    label: 'Developer',
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
    blurb: 'Propose code skeletons, dependencies, and env vars.',
    templates: [
      { 
        title: 'Code skeleton', 
        prompt: 'Propose code files for a FastAPI service with JWT auth, user CRUD, and async PostgreSQL access.',
        constraints: 'Python 3.11+, Pydantic v2 models, SQLAlchemy 2.0 async, pytest fixtures, Docker Compose for local dev'
      },
      { 
        title: 'Deps + env', 
        prompt: 'List dependencies and env vars for Next.js + FastAPI monorepo with GitHub Actions CI.',
        constraints: 'TypeScript 5, ESLint + Prettier, pytest + coverage >80%, secrets in Azure Key Vault, deploy to Azure Container Apps'
      },
    ],
  },
  qa_automation: {
    label: 'QA Automation',
    accent: 'bg-orange-50 text-orange-700 border-orange-200',
    blurb: 'Design test strategy, cases, and data needs.',
    templates: [
      { 
        title: 'Negative tests', 
        prompt: 'Add negative and edge test cases for password reset via email and SMS with rate limiting.',
        constraints: 'Test rate limits (3 attempts per 15min), expired tokens, invalid phone formats, SQL injection, concurrent requests'
      },
      { 
        title: 'Automation plan', 
        prompt: 'Propose Playwright-based E2E coverage for shopping cart checkout with coupons and saved cards.',
        constraints: 'Test against staging every commit, 10-minute timeout, mock Stripe payments, cover Chrome + Safari, record videos on failure'
      },
    ],
  },
  release_manager: {
    label: 'Release Manager',
    accent: 'bg-slate-50 text-slate-700 border-slate-200',
    blurb: 'Summarize readiness, risks, and next steps.',
    templates: [
      { 
        title: 'Release notes', 
        prompt: 'Draft executive release notes for v1.4 of the API gateway with zero-downtime rollout highlights.',
        constraints: 'Non-technical audience, highlight business value, list breaking changes, include rollback plan, max 300 words'
      },
      { 
        title: 'Go/No-Go', 
        prompt: 'Summarize go/no-go checklist for a feature freeze ending Friday with open risks and owners.',
        constraints: 'Include code freeze status, open P0/P1 bugs, performance test results, stakeholder sign-offs, rollback plan ready'
      },
    ],
  },
};

const fallbackAgents: AgentName[] = ['product_owner', 'scrum_master', 'tech_lead', 'developer', 'qa_automation', 'release_manager'];

export function AgentHub() {
  const { toast } = useToast();
  const config = useConfigStore();
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('product_owner');
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [constraints, setConstraints] = useState('');
  const [lastRun, setLastRun] = useState<SingleAgentResponse | null>(null);

  const { data: profiles } = useQuery({
    queryKey: ['config-profiles'],
    queryFn: () => apiClient.config.profiles.list(),
    staleTime: 5 * 60 * 1000,
  });

  const activeProfileId = useMemo(() => {
    const selected =
      config.apiMode === 'azure'
        ? config.selectedAzureId
        : config.apiMode === 'openai'
        ? config.selectedOpenAIId
        : config.apiMode === 'ollama'
        ? config.selectedOllamaId
        : null;

    const modeProfiles = config.apiMode ? (profiles?.[config.apiMode] as any[] | undefined) : undefined;
    const hasSelected = selected && modeProfiles?.some((p) => p.llmProfileId === selected);
    const fallbackAny = profiles ? Object.values(profiles).flat()?.[0]?.llmProfileId || null : null;
    if (hasSelected) return selected;
    return modeProfiles?.[0]?.llmProfileId || fallbackAny;
  }, [config.apiMode, config.selectedAzureId, config.selectedOpenAIId, config.selectedOllamaId, profiles]);

  const { data: agentList, isLoading: loadingAgents } = useQuery({
    queryKey: ['agents', 'available'],
    queryFn: () => apiClient.agents.listAvailable(),
    staleTime: 5 * 60 * 1000,
  });

  const agents = (agentList?.length ? agentList : fallbackAgents) as AgentName[];

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!activeProfileId) {
        throw new Error('Select an API profile before running an agent.');
      }
      if (!task.trim()) {
        throw new Error('Add a task or requirement to run the agent.');
      }

      return apiClient.agents.runSingle({
        llmProfileId: activeProfileId,
        agentName: selectedAgent,
        inputs: {
          requirement: task.trim(),
          constraints: constraints.trim(),
        },
        context: context.trim() ? { context: context.trim() } : {},
      });
    },
    onSuccess: (data) => {
      setLastRun(data);
      toast({
        title: 'Agent complete',
        description: `${agentMeta[selectedAgent]?.label || selectedAgent} finished. Session ${data.sessionId}.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Run failed',
        description: error?.message || 'Unable to run agent.',
      });
    },
  });

  const templates = agentMeta[selectedAgent]?.templates || [];
  const capabilityBlurb = agentMeta[selectedAgent]?.blurb || 'Targeted agent task.';

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ad-hoc Agent Hub
          </CardTitle>
          <CardDescription>Run any crew member independently for targeted asks, outside the full workflow.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Single-agent
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <History className="h-3 w-3" />
            Saves to history
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!activeProfileId && (
          <Alert variant="destructive">
            <AlertDescription>
              Choose or create an API profile in Settings before running ad-hoc agents.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{loadingAgents ? 'Loading agents…' : 'Choose an agent:'}</span>
          {agents.map((agent) => (
            <Button
              key={agent}
              size="sm"
              variant={selectedAgent === agent ? 'default' : 'outline'}
              onClick={() => setSelectedAgent(agent)}
              className="capitalize"
            >
              {agentMeta[agent]?.label || agent.replace('_', ' ')}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{capabilityBlurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {templates.map((tpl) => (
                  <Button
                    key={tpl.title}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setTask(tpl.prompt);
                      setContext(tpl.context || '');
                      setConstraints(tpl.constraints || '');
                    }}
                    className="gap-1"
                  >
                    <Wand2 className="h-4 w-4" />
                    {tpl.title}
                  </Button>
                ))}
                {templates.length === 0 && (
                  <Badge variant="outline" className="text-xs">
                    No presets yet
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="adhoc-task">Task / Requirement *</Label>
                <Textarea
                  id="adhoc-task"
                  placeholder="Describe the targeted task for this agent..."
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adhoc-context">Context (optional)</Label>
                <Textarea
                  id="adhoc-context"
                  placeholder="Paste prior artifacts, decisions, or constraints to guide the agent."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adhoc-constraints">Constraints (optional)</Label>
                <Input
                  id="adhoc-constraints"
                  placeholder="Deadlines, formats, scope limits..."
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => runMutation.mutate()}
                disabled={!activeProfileId || runMutation.isPending || !task.trim()}
                className="gap-2"
              >
                {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run {agentMeta[selectedAgent]?.label || selectedAgent}
              </Button>
              <Badge variant="outline" className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Saves as session for reuse
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3 bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Latest output</p>
              </div>
              {lastRun?.sessionId && (
                <Link href="/history" className="text-xs text-primary hover:underline">
                  Open history
                </Link>
              )}
            </div>
            <Separator />
            {lastRun ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                  <Badge variant="secondary" className="capitalize">
                    {agentMeta[lastRun.agent]?.label || lastRun.agent}
                  </Badge>
                  <span className="text-muted-foreground">Session {lastRun.sessionId}</span>
                </div>
                
                <Tabs defaultValue="formatted" className="w-full">
                  <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="formatted" className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" />
                      Formatted
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Raw JSON
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="formatted" className="mt-4">
                    <AgentOutputFormatter output={lastRun.output} agentName={lastRun.agent} />
                  </TabsContent>
                  
                  <TabsContent value="raw" className="mt-4">
                    <div className="rounded-md border bg-muted/30 p-3 max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">{lastRun.output}</pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Run any agent to see the output here. Great for "single deliverable" asks without triggering the whole crew.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
