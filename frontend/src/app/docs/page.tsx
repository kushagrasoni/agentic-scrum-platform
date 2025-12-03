"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Workflow,
  Play,
  Rocket,
  GitBranch,
  Download,
  Activity,
  BookOpen,
  TerminalSquare,
  Shield,
  Cloud,
  Layers,
} from "lucide-react";
import Link from "next/link";

const flows = [
  {
    title: "Epic Generator (Workflow Run)",
    description: "Takes one requirement and produces epic, user stories, tasks, design, code, tests, and release summary.",
    steps: [
      "User submits requirement + context/constraints",
      "Agents run in order: PO → SM → Tech Lead → Dev → QA → Release",
      "Artifacts saved (JSON, text) and validated for Jira/GitHub",
    ],
    diagram: [
      "User -> Product Owner: requirement, context",
      "Product Owner -> Scrum Master: user stories",
      "Scrum Master -> Tech Lead: sprint plan",
      "Tech Lead -> Developer: design & APIs",
      "Developer -> QA: code notes",
      "QA -> Release Manager: test readiness",
      "Release Manager -> Storage: artifacts.json",
    ],
    cta: { label: "Run Epic Generator", href: "/feature-workflow" },
  },
  {
    title: "Ad-hoc Agent Hub",
    description: "Run any single agent (PO, SM, Tech Lead, Dev, QA, Release) without the full crew.",
    steps: [
      "Pick an agent + template",
      "Optionally load past context",
      "Save output as its own ad-hoc session",
    ],
    diagram: [
      "User -> Agent Hub: prompt + context",
      "Agent Hub -> Selected Agent: instructions + inputs",
      "Agent -> Storage: single artifact",
      "Storage -> History: session record",
    ],
    cta: { label: "Open Agent Hub", href: "/agent-hub" },
  },
  {
    title: "Mini Flows",
    description: "Chain 2–3 agents (e.g., PO→QA or PO→Tech Lead→Dev) for focused outputs.",
    steps: [
      "Choose preset flow",
      "Send requirement once; context is forwarded between steps",
      "View per-agent outputs and status",
    ],
    diagram: [
      "User -> Mini Flow Runner: requirement",
      "Runner -> Agent A: requirement",
      "Agent A -> Runner: output",
      "Runner -> Agent B: requirement + A output",
      "Runner -> Storage: artifacts for A,B",
    ],
    cta: { label: "Run Mini Flow", href: "/agent-hub" },
  },
  {
    title: "Artifacts & Monitoring",
    description: "Browse artifacts per session and monitor run health, errors, and counts.",
    steps: [
      "Artifacts: list sessions, view/download files, zip export",
      "Monitoring: running/completed/error counts, recent runs",
      "Session viewer: live status, logs, structured outputs",
    ],
    diagram: [
      "Storage -> Artifacts Page: list files",
      "Storage -> Monitoring: status + counts",
      "Sessions -> Session Viewer: SSE status/logs",
    ],
    cta: { label: "View Artifacts", href: "/artifacts" },
  },
];

const future = [
  { title: "Telemetry & Model Health", detail: "Latency, token usage, provider errors, slow-run alerts." },
  { title: "Integrations at Scale", detail: "Push to Jira/GitHub with mapping, environments, and dry runs." },
  { title: "Saved Prompts & Templates", detail: "Team-shared flows and reusable agent prompts." },
  { title: "Role Extensions", detail: "Security reviewer, Data engineer, UX writer agents." },
];

export default function DocsPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="rounded-3xl border bg-gradient-to-br from-purple-600/15 via-blue-500/10 to-emerald-500/15 p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Agentic AI Scrum
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
              End-to-end Agile artifacts from one requirement.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              A crew of specialized AI agents turns a single requirement into epics, stories, sprint plans, designs, code,
              tests, and release summaries—plus ad-hoc runs and mini flows for targeted outputs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/feature-workflow">
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Run Epic Generator
                </Button>
              </Link>
              <Link href="/agent-hub">
                <Button variant="outline" className="gap-2">
                  <Workflow className="h-4 w-4" />
                  Try Ad-hoc Agents
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl bg-white/80 p-4 shadow-lg backdrop-blur-lg dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold">Crew</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {["Product Owner", "Scrum Master", "Tech Lead", "Developer", "QA", "Release"].map((role) => (
                <div key={role} className="rounded-md border bg-gradient-to-r from-white to-purple-50/60 px-2 py-2 dark:from-slate-900 dark:to-slate-800">
                  {role}
                </div>
              ))}
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              Outputs: epics, user stories, tasks, risks, design, APIs, code files, env vars, test cases, release summary.
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            How it works
          </CardTitle>
          <CardDescription>Execution flows and data paths for the current features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {flows.map((flow) => (
              <Card key={flow.title} className="border border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{flow.title}</CardTitle>
                      <CardDescription>{flow.description}</CardDescription>
                    </div>
                    <Badge variant="outline">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {flow.steps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <Rocket className="mt-0.5 h-3.5 w-3.5 text-primary" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Sequence</p>
                    <div className="space-y-2">
                      {flow.diagram.map((line, idx) => {
                        const [left, ...rest] = line.split(":");
                        const detail = rest.join(":").trim();
                        return (
                          <div key={line} className="flex items-start gap-2">
                            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                              {idx + 1}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="text-sm font-medium text-foreground">
                                {left.replace(/->/g, "→").trim()}
                              </div>
                              {detail && (
                                <div className="text-xs text-muted-foreground">
                                  {detail}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Link href={flow.cta.href}>
                    <Button variant="secondary" className="w-full gap-2">
                      <Play className="h-4 w-4" />
                      {flow.cta.label}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Usage guide
          </CardTitle>
          <CardDescription>Fast paths for common goals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Generate a full plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>1) Configure provider & model</div>
              <div>2) Open Epic Generator</div>
              <div>3) Paste requirement, context, constraints</div>
              <div>4) Track in Session Viewer</div>
              <div>5) Export to Jira/GitHub</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Ad-hoc deliverable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>1) Open Agent Hub</div>
              <div>2) Pick agent + template</div>
              <div>3) Add requirement/context</div>
              <div>4) Run once, download artifact</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Mini flow handoff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>1) Choose PO→QA or PO→Tech→Dev</div>
              <div>2) Submit once</div>
              <div>3) Review per-step outputs</div>
              <div>4) Pull artifacts from Artifacts page</div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Architecture quick view */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            High-level architecture
          </CardTitle>
          <CardDescription>Backend + frontend data path.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border bg-muted/40 p-4">
            <pre className="whitespace-pre-wrap text-[11px] leading-5 text-foreground">
{`[Frontend]
  - Epic Generator (/feature-workflow)
  - Agent Hub + Mini Flows (/agent-hub)
  - Session Viewer (SSE status/logs)
  - Artifacts (/artifacts), Monitoring (/monitoring)

[Backend]
  - FastAPI agents router (start workflow, regenerate, stream status/logs)
  - AgentService orchestrates PO→SM→Tech→Dev→QA→Release
  - StorageService saves artifacts + session metadata

[Integrations]
  - Jira/GitHub export endpoints
  - Config profiles for Ollama/OpenAI/Azure`}</pre>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              Provider profiles: Ollama, OpenAI, Azure
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TerminalSquare className="h-4 w-4 text-primary" />
              SSE streams for live status/logs in Session Viewer
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4 text-primary" />
              Structured outputs: epic_vision, sprint_plan, technical_design, code_implementation, test_suite, executive_summary
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-primary" />
              Exports: zip, markdown, Jira/GitHub formats
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future roadmap */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Upcoming / Telemetry
          </CardTitle>
          <CardDescription>Ideas to deepen monitoring and control.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {future.map((item) => (
            <Card key={item.title} className="border-0 bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


