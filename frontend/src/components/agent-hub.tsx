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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Sparkles, Target, Wand2, History, Lightbulb } from 'lucide-react';
import Link from 'next/link';

type QuickTemplate = {
  title: string;
  prompt: string;
  context?: string;
  constraints?: string;
};

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
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary" className="capitalize">
                    {agentMeta[lastRun.agent]?.label || lastRun.agent}
                  </Badge>
                  <span className="text-muted-foreground">Session {lastRun.sessionId}</span>
                </div>
                <div className="rounded-md border bg-muted/30 p-3 max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">{lastRun.output}</pre>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Run any agent to see the output here. Great for “single deliverable” asks without triggering the whole crew.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
