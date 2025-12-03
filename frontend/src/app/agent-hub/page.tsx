"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import type { AgentName, SingleAgentResponse, MiniFlowResponse } from "@/types";
import {
  Sparkles,
  Workflow,
  Play,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from "lucide-react";

type FlowId = "po-sm" | "po-qa" | "po-tech-dev" | "tech-qa" | "full-dev" | "po-dev-qa" | "sm-tech" | "tech-dev-qa";

type FlowTemplate = {
  id: string;
  name: string;
  requirement: string;
  constraints: string;
};

type FlowDefinition = {
  id: FlowId;
  title: string;
  summary: string;
  steps: AgentName[];
  category?: 'general' | 'data-engineering' | 'full-stack';
  templates: FlowTemplate[];
};

const flowDefinitions: FlowDefinition[] = [
  // General Flows
  {
    id: "po-sm",
    title: "PO -> SM",
    summary: "Generate stories then break them into sprint tasks and risks.",
    steps: ["product_owner", "scrum_master"],
    category: "general",
    templates: [
      {
        id: "po-sm-login",
        name: "User Authentication Feature",
        requirement: "Build a secure login system with email/password authentication, password reset via email, and remember me functionality. Include input validation, rate limiting for failed attempts, and session management.",
        constraints: "2-week sprint, React frontend, Node.js backend, PostgreSQL database"
      },
      {
        id: "po-sm-dashboard",
        name: "Analytics Dashboard",
        requirement: "Create a real-time analytics dashboard showing key business metrics: daily active users, revenue trends, conversion rates. Include date range filtering, export to CSV, and auto-refresh every 5 minutes.",
        constraints: "Must integrate with existing data warehouse, use Chart.js for visualizations"
      },
      {
        id: "po-sm-notifications",
        name: "Notification Preferences",
        requirement: "Allow users to manage their notification preferences for email, SMS, and push notifications. Users should be able to opt-in/out per notification type (marketing, transactional, alerts) and set quiet hours.",
        constraints: "GDPR compliant, must respect existing opt-out lists"
      }
    ]
  },
  {
    id: "po-qa",
    title: "PO -> QA",
    summary: "Create stories and immediately derive test cases and automation.",
    steps: ["product_owner", "qa_automation"],
    category: "general",
    templates: [
      {
        id: "po-qa-checkout",
        name: "E-commerce Checkout Flow",
        requirement: "Implement a 3-step checkout process: cart review, shipping/billing info, payment. Support credit cards and PayPal. Show order summary, apply promo codes, calculate taxes and shipping based on location.",
        constraints: "PCI-DSS compliant, must handle payment failures gracefully"
      },
      {
        id: "po-qa-search",
        name: "Product Search & Filters",
        requirement: "Build product search with autocomplete suggestions, typo tolerance, and faceted filters (category, price range, brand, rating). Results should be paginated and sortable by relevance, price, and popularity.",
        constraints: "Search results in <200ms, support 500K products"
      },
      {
        id: "po-qa-profile",
        name: "User Profile Management",
        requirement: "Allow users to view and edit their profile: name, email, phone, avatar upload, password change, and account deletion. Include email verification for email changes and 2FA setup option.",
        constraints: "Avatar max 5MB, supported formats: JPG, PNG, WebP"
      }
    ]
  },
  {
    id: "po-tech-dev",
    title: "PO -> Tech -> Dev",
    summary: "Vision to architecture to code implementation in one pass.",
    steps: ["product_owner", "tech_lead", "developer"],
    category: "full-stack",
    templates: [
      {
        id: "po-tech-dev-api",
        name: "REST API for Mobile App",
        requirement: "Design and implement a REST API for a mobile banking app. Endpoints needed: account balance, transaction history, fund transfers, bill payments. Include authentication, rate limiting, and comprehensive error handling.",
        constraints: "FastAPI + Python, JWT authentication, OpenAPI 3.0 spec required"
      },
      {
        id: "po-tech-dev-etl",
        name: "Data Pipeline for Reporting",
        requirement: "Build an ETL pipeline to extract sales data from 3 source systems (CRM, ERP, e-commerce), transform and clean the data, and load into a data warehouse for BI reporting. Schedule daily runs with failure alerts.",
        constraints: "Apache Airflow for orchestration, Snowflake as target, handle 10M records/day"
      },
      {
        id: "po-tech-dev-realtime",
        name: "Real-time Chat System",
        requirement: "Implement a real-time chat feature with 1:1 messaging, group chats, typing indicators, read receipts, and message history. Support file attachments up to 25MB and emoji reactions.",
        constraints: "WebSocket with Socket.io, Redis for pub/sub, message retention 1 year"
      }
    ]
  },
  {
    id: "tech-qa",
    title: "Tech -> QA",
    summary: "Turn a technical design into focused test automation plan.",
    steps: ["tech_lead", "qa_automation"],
    category: "general",
    templates: [
      {
        id: "tech-qa-microservices",
        name: "Microservices Integration Testing",
        requirement: "Design test strategy for order processing microservices: Order Service, Inventory Service, Payment Service, Notification Service. Cover happy paths, failure scenarios, eventual consistency, and circuit breaker behavior.",
        constraints: "Use Testcontainers for integration tests, mock external payment gateway"
      },
      {
        id: "tech-qa-performance",
        name: "Performance Testing Suite",
        requirement: "Create performance test suite for e-commerce platform. Test scenarios: homepage load, product search, add to cart, checkout flow. Establish baselines for response times, throughput, and error rates under load.",
        constraints: "k6 for load testing, target 1000 concurrent users, 99th percentile <3s"
      },
      {
        id: "tech-qa-security",
        name: "Security Testing Plan",
        requirement: "Develop security test plan for user authentication module. Cover: SQL injection, XSS, CSRF, brute force protection, session management, password policies, and API authentication vulnerabilities.",
        constraints: "OWASP Top 10 coverage, use OWASP ZAP for automated scanning"
      }
    ]
  },
  // Full-stack Flows
  {
    id: "full-dev",
    title: "Tech -> Dev -> QA",
    summary: "Full development cycle: design, implement, and test.",
    steps: ["tech_lead", "developer", "qa_automation"],
    category: "full-stack",
    templates: [
      {
        id: "full-dev-crud",
        name: "CRUD Admin Panel",
        requirement: "Build an admin panel for managing products: list with search/filter/pagination, create/edit forms with validation, soft delete with restore, bulk actions (delete, export). Include audit logging for all changes.",
        constraints: "Next.js + Prisma + PostgreSQL, role-based access (admin, editor, viewer)"
      },
      {
        id: "full-dev-workflow",
        name: "Approval Workflow Engine",
        requirement: "Implement a configurable approval workflow for expense reports. Support multi-level approvals, auto-routing based on amount thresholds, delegation, escalation on timeout, and email notifications at each step.",
        constraints: "State machine pattern, workflow definitions in YAML, audit trail required"
      },
      {
        id: "full-dev-scheduler",
        name: "Job Scheduler Service",
        requirement: "Create a job scheduling service for running background tasks: email campaigns, report generation, data cleanup. Support cron expressions, one-time jobs, job dependencies, retry logic, and monitoring dashboard.",
        constraints: "BullMQ + Redis, handle 10K jobs/hour, job history retention 30 days"
      }
    ]
  },
  {
    id: "po-dev-qa",
    title: "PO -> Dev -> QA",
    summary: "Fast track: stories to code to tests without architecture.",
    steps: ["product_owner", "developer", "qa_automation"],
    category: "full-stack",
    templates: [
      {
        id: "po-dev-qa-form",
        name: "Dynamic Form Builder",
        requirement: "Build a form builder where users can create custom forms with drag-and-drop fields (text, number, date, dropdown, checkbox, file upload). Forms should be saveable, shareable via link, and collect responses with basic analytics.",
        constraints: "React DnD, form responses stored in PostgreSQL, export to CSV"
      },
      {
        id: "po-dev-qa-booking",
        name: "Appointment Booking System",
        requirement: "Create an appointment booking system: view available slots by provider and service type, book/reschedule/cancel appointments, send confirmation and reminder emails, integrate with Google Calendar.",
        constraints: "Timezone aware, prevent double-booking, 24-hour cancellation policy"
      },
      {
        id: "po-dev-qa-feed",
        name: "Activity Feed Feature",
        requirement: "Implement a social activity feed showing user actions: posts, comments, likes, follows. Support infinite scroll, real-time updates for new items, and filter by activity type. Show relative timestamps.",
        constraints: "Cursor-based pagination, Redis cache for hot feeds, WebSocket for real-time"
      }
    ]
  },
  {
    id: "sm-tech",
    title: "SM -> Tech Lead",
    summary: "Sprint planning with technical feasibility and estimates.",
    steps: ["scrum_master", "tech_lead"],
    category: "general",
    templates: [
      {
        id: "sm-tech-migration",
        name: "Database Migration Sprint",
        requirement: "Plan a sprint for migrating from MySQL to PostgreSQL. Includes schema conversion, data migration scripts, application code updates, testing, and rollback procedures. Current DB has 50 tables, 20GB data.",
        constraints: "Zero downtime, dual-write period needed, 2-week sprint"
      },
      {
        id: "sm-tech-refactor",
        name: "Legacy Code Refactoring",
        requirement: "Break down refactoring of monolithic order service into microservices. Identify bounded contexts, define service boundaries, plan API contracts, and sequence the extraction to minimize risk.",
        constraints: "Feature freeze during migration, maintain backward compatibility"
      },
      {
        id: "sm-tech-infra",
        name: "Infrastructure Modernization",
        requirement: "Plan migration from on-premise VMs to Kubernetes on AWS. Includes containerizing 8 services, setting up CI/CD pipelines, configuring monitoring/logging, and training the team.",
        constraints: "Budget $50K, complete in 3 sprints, no production downtime"
      }
    ]
  },
  {
    id: "tech-dev-qa",
    title: "Tech -> Dev -> QA -> RM",
    summary: "Complete delivery: design, build, test, and release plan.",
    steps: ["tech_lead", "developer", "qa_automation", "release_manager"],
    category: "full-stack",
    templates: [
      {
        id: "tech-dev-qa-payment",
        name: "Payment Gateway Integration",
        requirement: "Integrate Stripe payment gateway: credit card payments, subscription billing, refund processing, webhook handling for async events. Include idempotency, retry logic, and detailed transaction logging.",
        constraints: "PCI-DSS Level 2, support 3D Secure, sandbox testing before production"
      },
      {
        id: "tech-dev-qa-sso",
        name: "SSO Implementation",
        requirement: "Implement Single Sign-On using SAML 2.0 for enterprise customers. Support multiple identity providers (Okta, Azure AD, Google Workspace), just-in-time user provisioning, and role mapping from IdP attributes.",
        constraints: "SAML 2.0 compliant, support SP-initiated and IdP-initiated flows"
      },
      {
        id: "tech-dev-qa-analytics",
        name: "Event Analytics Platform",
        requirement: "Build an event tracking and analytics platform: SDK for web/mobile to capture events, ingestion API, real-time event processing, and analytics dashboard with funnels, retention, and cohort analysis.",
        constraints: "Handle 1M events/day, 90-day retention, GDPR compliant"
      }
    ]
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [requirement, setRequirement] = useState("");
  const [constraints, setConstraints] = useState("");
  const [stepStatus, setStepStatus] = useState<Record<AgentName, StepStatus>>({});
  const [lastRunOutputs, setLastRunOutputs] = useState<Record<AgentName, string>>({});
  const [filterCategory, setFilterCategory] = useState<'all' | 'general' | 'full-stack'>('all');
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const router = useRouter();

  const flow = flowDefinitions.find((f) => f.id === selectedFlow) ?? flowDefinitions[0];
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "custom") {
      return;
    }
    const template = flow.templates.find(t => t.id === templateId);
    if (template) {
      setRequirement(template.requirement);
      setConstraints(template.constraints);
    }
  };

  // Reset template when flow changes
  const handleFlowChange = (flowId: FlowId) => {
    setSelectedFlow(flowId);
    setSelectedTemplate("");
    setRequirement("");
    setConstraints("");
  };
  
  const filteredFlows = filterCategory === 'all' 
    ? flowDefinitions 
    : flowDefinitions.filter(f => f.category === filterCategory);

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
      
      // Mark all steps as running initially
      flow.steps.forEach((agent) => {
        setStepStatus((prev) => ({ ...prev, [agent]: { status: "running" } }));
      });

      // Use unified mini flow API
      const response: MiniFlowResponse = await apiClient.agents.runMiniFlow({
        llmProfileId: activeProfileId,
        flowId: flow.id,
        flowLabel: flow.title,
        agents: flow.steps,
        inputs: {
          requirement: requirement.trim(),
          constraints: constraints.trim(),
        },
      });

      // Process outputs from the response
      const outputs: Record<AgentName, string> = {};
      for (const result of response.outputs) {
        outputs[result.agent] = result.output;
        setStepStatus((prev) => ({
          ...prev,
          [result.agent]: { 
            status: result.status === "completed" ? "done" : "error", 
            output: result.output, 
            sessionId: response.sessionId 
          },
        }));
      }

      setLastRunOutputs(outputs);
      return { outputs, sessionId: response.sessionId };
    },
    onSuccess: (data) => {
      setLastSessionId(data.sessionId);
      toast({
        title: "Mini flow completed",
        description: `${flow.title} finished. Session saved to history.`,
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
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <div className="flex gap-1">
            {(['all', 'general', 'full-stack'] as const).map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={filterCategory === cat ? "default" : "outline"}
                onClick={() => setFilterCategory(cat)}
                className="h-7 text-xs capitalize"
              >
                {cat === 'all' ? 'All Flows' : cat === 'full-stack' ? 'Full Stack' : 'General'}
              </Button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filteredFlows.length} flows</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {filteredFlows.map((item) => (
            <Button
              key={item.id}
              variant={item.id === flow.id ? "default" : "outline"}
              className="h-full w-full justify-start items-start text-left whitespace-normal flex-col gap-2 border"
              onClick={() => handleFlowChange(item.id)}
            >
              <div className="flex items-center gap-2 flex-wrap w-full">
                <span className="font-medium">{item.title}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {item.steps.length} steps
                </Badge>
                {item.category === 'full-stack' && (
                  <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600 ml-auto">
                    Full Stack
                  </Badge>
                )}
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
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Start Template
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedTemplate === "custom" || selectedTemplate === "" ? "default" : "outline"}
                  onClick={() => handleTemplateSelect("custom")}
                  className="h-8 text-xs"
                >
                  Custom
                </Button>
                {flow.templates.map((template) => (
                  <Button
                    key={template.id}
                    size="sm"
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="h-8 text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Requirement / Task *</label>
              <Textarea
                placeholder="Describe what you need across these agents..."
                value={requirement}
                onChange={(e) => {
                  setRequirement(e.target.value);
                  if (selectedTemplate !== "custom") setSelectedTemplate("custom");
                }}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Constraints (optional)</label>
              <Input
                placeholder="Deadlines, scope, formats..."
                value={constraints}
                onChange={(e) => {
                  setConstraints(e.target.value);
                  if (selectedTemplate !== "custom") setSelectedTemplate("custom");
                }}
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
            
            {/* View Session Button */}
            {lastSessionId && progressValue === 100 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={() => router.push(`/session/${lastSessionId}`)}
              >
                <Eye className="h-4 w-4" />
                View Session Details
              </Button>
            )}
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

