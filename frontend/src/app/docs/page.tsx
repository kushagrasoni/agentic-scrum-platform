"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  Workflow,
  Play,
  Users,
  FileText,
  Code2,
  TestTube2,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  Clock,
  BarChart3,
  GitBranch,
  Layers,
  Bot,
  BrainCircuit,
  Cpu,
  MessageSquare,
  Settings,
  History,
  ArrowDown,
  User,
  Database,
  Pause,
  RotateCcw,
} from "lucide-react";

// Animated counter hook
function useCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  return { count, ref };
}

// Agent data
const agents = [
  {
    id: "product_owner",
    name: "Product Owner",
    icon: Users,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    description: "Transforms requirements into epic vision, user stories, and acceptance criteria",
    outputs: ["Epic Vision", "User Stories", "Acceptance Criteria"],
  },
  {
    id: "scrum_master",
    name: "Scrum Master",
    icon: Target,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    description: "Creates sprint plans, task breakdowns, and risk assessments",
    outputs: ["Sprint Plan", "Task Breakdown", "Risk Analysis"],
  },
  {
    id: "tech_lead",
    name: "Tech Lead",
    icon: BrainCircuit,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    description: "Designs system architecture, APIs, and technical specifications",
    outputs: ["Architecture", "API Design", "Tech Specs"],
  },
  {
    id: "developer",
    name: "Developer",
    icon: Code2,
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    description: "Implements code, components, and integration patterns",
    outputs: ["Source Code", "Components", "Integration"],
  },
  {
    id: "qa_engineer",
    name: "QA Engineer",
    icon: TestTube2,
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    description: "Creates test suites, automation scripts, and quality reports",
    outputs: ["Test Cases", "Automation", "Coverage Report"],
  },
  {
    id: "release_manager",
    name: "Release Manager",
    icon: Rocket,
    color: "from-indigo-500 to-blue-600",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    description: "Produces executive summaries and deployment documentation",
    outputs: ["Release Notes", "Summary", "Deployment Plan"],
  },
];

// Features for bento grid
const features = [
  {
    title: "Feature Workflow",
    description: "Full 6-agent pipeline from requirement to release",
    icon: Workflow,
    href: "/feature-workflow",
    span: "col-span-2",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
  },
  {
    title: "Agent Hub",
    description: "Run any agent individually for targeted outputs",
    icon: Bot,
    href: "/agent-hub",
    span: "col-span-1",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
  },
  {
    title: "Mini Flows",
    description: "Chain 2-4 agents for focused deliverables",
    icon: GitBranch,
    href: "/agent-hub",
    span: "col-span-1",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    title: "Session History",
    description: "Track all executions with full artifact access",
    icon: History,
    href: "/history",
    span: "col-span-1",
    gradient: "from-orange-500/20 via-amber-500/10 to-transparent",
  },
  {
    title: "LLM Telemetry",
    description: "Monitor tokens, costs, and performance metrics",
    icon: BarChart3,
    href: "/monitoring",
    span: "col-span-1",
    gradient: "from-pink-500/20 via-rose-500/10 to-transparent",
  },
  {
    title: "Export Integrations",
    description: "Push to Jira, GitHub, or download as Markdown",
    icon: FileText,
    href: "/history",
    span: "col-span-2",
    gradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
  },
];

// Sequence diagram definitions
type SequenceStep = {
  from: string;
  to: string;
  message: string;
  type: "request" | "response" | "async" | "self";
  delay?: number;
};

type SequenceDiagram = {
  id: string;
  title: string;
  description: string;
  participants: { id: string; label: string; color: string; icon: any }[];
  steps: SequenceStep[];
};

const sequenceDiagrams: SequenceDiagram[] = [
  {
    id: "feature-workflow",
    title: "Feature Workflow",
    description: "Complete 6-agent pipeline from requirement to release artifacts",
    participants: [
      { id: "user", label: "User", color: "bg-slate-500", icon: User },
      { id: "po", label: "Product Owner", color: "bg-violet-500", icon: Users },
      { id: "sm", label: "Scrum Master", color: "bg-blue-500", icon: Target },
      { id: "tech", label: "Tech Lead", color: "bg-emerald-500", icon: BrainCircuit },
      { id: "dev", label: "Developer", color: "bg-orange-500", icon: Code2 },
      { id: "qa", label: "QA Engineer", color: "bg-pink-500", icon: TestTube2 },
      { id: "rm", label: "Release Mgr", color: "bg-indigo-500", icon: Rocket },
      { id: "storage", label: "Storage", color: "bg-gray-500", icon: Database },
    ],
    steps: [
      { from: "user", to: "po", message: "Submit requirement + context", type: "request" },
      { from: "po", to: "po", message: "Generate epic vision & user stories", type: "self" },
      { from: "po", to: "sm", message: "Pass stories + acceptance criteria", type: "request" },
      { from: "sm", to: "sm", message: "Create sprint plan & task breakdown", type: "self" },
      { from: "sm", to: "tech", message: "Pass sprint plan + risks", type: "request" },
      { from: "tech", to: "tech", message: "Design architecture & APIs", type: "self" },
      { from: "tech", to: "dev", message: "Pass technical design", type: "request" },
      { from: "dev", to: "dev", message: "Implement code & components", type: "self" },
      { from: "dev", to: "qa", message: "Pass code implementation", type: "request" },
      { from: "qa", to: "qa", message: "Generate test suite", type: "self" },
      { from: "qa", to: "rm", message: "Pass test coverage report", type: "request" },
      { from: "rm", to: "rm", message: "Create executive summary", type: "self" },
      { from: "rm", to: "storage", message: "Save all artifacts", type: "async" },
      { from: "storage", to: "user", message: "Return session with artifacts", type: "response" },
    ],
  },
  {
    id: "single-agent",
    title: "Single Agent Run",
    description: "Run any agent independently for targeted outputs",
    participants: [
      { id: "user", label: "User", color: "bg-slate-500", icon: User },
      { id: "hub", label: "Agent Hub", color: "bg-violet-500", icon: Bot },
      { id: "agent", label: "Selected Agent", color: "bg-blue-500", icon: Cpu },
      { id: "storage", label: "Storage", color: "bg-gray-500", icon: Database },
    ],
    steps: [
      { from: "user", to: "hub", message: "Select agent + enter prompt", type: "request" },
      { from: "hub", to: "agent", message: "Initialize with context", type: "request" },
      { from: "agent", to: "agent", message: "Process requirement", type: "self" },
      { from: "agent", to: "agent", message: "Generate output", type: "self" },
      { from: "agent", to: "storage", message: "Save artifact", type: "async" },
      { from: "storage", to: "user", message: "Return output + session ID", type: "response" },
    ],
  },
  {
    id: "mini-flow",
    title: "Mini Flow",
    description: "Chain 2-4 agents with context forwarding",
    participants: [
      { id: "user", label: "User", color: "bg-slate-500", icon: User },
      { id: "runner", label: "Flow Runner", color: "bg-violet-500", icon: Workflow },
      { id: "agent1", label: "Agent A", color: "bg-blue-500", icon: Bot },
      { id: "agent2", label: "Agent B", color: "bg-emerald-500", icon: Bot },
      { id: "agent3", label: "Agent C", color: "bg-orange-500", icon: Bot },
      { id: "storage", label: "Storage", color: "bg-gray-500", icon: Database },
    ],
    steps: [
      { from: "user", to: "runner", message: "Submit requirement + select flow", type: "request" },
      { from: "runner", to: "agent1", message: "Execute with requirement", type: "request" },
      { from: "agent1", to: "agent1", message: "Generate output A", type: "self" },
      { from: "agent1", to: "runner", message: "Return output A", type: "response" },
      { from: "runner", to: "agent2", message: "Execute with req + output A", type: "request" },
      { from: "agent2", to: "agent2", message: "Generate output B", type: "self" },
      { from: "agent2", to: "runner", message: "Return output B", type: "response" },
      { from: "runner", to: "agent3", message: "Execute with req + A + B", type: "request" },
      { from: "agent3", to: "agent3", message: "Generate output C", type: "self" },
      { from: "agent3", to: "storage", message: "Save all artifacts", type: "async" },
      { from: "storage", to: "user", message: "Return unified session", type: "response" },
    ],
  },
];

// Animated Sequence Diagram Component
function AnimatedSequenceDiagram({ diagram }: { diagram: SequenceDiagram }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const play = useCallback(() => {
    setIsPlaying(true);
    setCurrentStep(0);
    setCompletedSteps([]);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(-1);
    setCompletedSteps([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (isPlaying && currentStep >= 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= diagram.steps.length - 1) {
            // Loop back to start instead of stopping
            setCompletedSteps([]);
            return 0;
          }
          setCompletedSteps((completed) => [...completed, prev]);
          return prev + 1;
        });
      }, 1200);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentStep, diagram.steps.length]);

  const getParticipantIndex = (id: string) => 
    diagram.participants.findIndex((p) => p.id === id);

  const getArrowStyle = (step: SequenceStep, index: number) => {
    const fromIdx = getParticipantIndex(step.from);
    const toIdx = getParticipantIndex(step.to);
    const isActive = currentStep === index;
    const isCompleted = completedSteps.includes(index);
    const isSelf = step.type === "self";

    if (isSelf) {
      return {
        left: `${(fromIdx / (diagram.participants.length - 1)) * 100}%`,
        width: "40px",
        opacity: isActive || isCompleted ? 1 : 0.2,
      };
    }

    const leftIdx = Math.min(fromIdx, toIdx);
    const rightIdx = Math.max(fromIdx, toIdx);
    const width = ((rightIdx - leftIdx) / (diagram.participants.length - 1)) * 100;
    const left = (leftIdx / (diagram.participants.length - 1)) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`,
      opacity: isActive || isCompleted ? 1 : 0.2,
      transform: fromIdx > toIdx ? "scaleX(-1)" : "scaleX(1)",
    };
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {!isPlaying ? (
          <Button size="sm" onClick={play} className="gap-2">
            <Play className="h-4 w-4" />
            {currentStep >= 0 ? "Resume" : "Play Animation"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={pause} className="gap-2">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Badge variant="secondary" className="ml-2">
          Step {Math.max(0, currentStep + 1)} / {diagram.steps.length}
        </Badge>
      </div>

      {/* Diagram Container */}
      <div className="relative bg-gradient-to-br from-background via-muted/30 to-background rounded-2xl border border-border p-6 overflow-hidden dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950">
        {/* Participants Header */}
        <div className="flex justify-between mb-8 relative z-10 px-0">
          {diagram.participants.map((participant) => {
            const Icon = participant.icon;
            return (
              <div
                key={participant.id}
                className="flex flex-col items-center gap-2"
                style={{ width: `${100 / diagram.participants.length}%` }}
              >
                <div className={`w-12 h-12 rounded-xl ${participant.color} flex items-center justify-center shadow-lg ring-2 ring-background`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium text-center text-foreground leading-tight">
                  {participant.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Lifelines */}
        <div className="absolute top-28 left-6 right-6 bottom-6 flex justify-between pointer-events-none">
          {diagram.participants.map((participant) => (
            <div
              key={`lifeline-${participant.id}`}
              className="flex justify-center"
              style={{ width: `${100 / diagram.participants.length}%` }}
            >
              <div className={`w-0.5 h-full ${participant.color} opacity-40`} />
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-3 relative z-10">
          {diagram.steps.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = completedSteps.includes(index);
            const fromIdx = getParticipantIndex(step.from);
            const toIdx = getParticipantIndex(step.to);
            const isSelf = step.type === "self";
            const isReverse = fromIdx > toIdx;
            
            const participantCount = diagram.participants.length;
            // Calculate center position of each participant (as percentage)
            const getCenter = (idx: number) => ((idx + 0.5) / participantCount) * 100;
            const fromCenter = getCenter(fromIdx);
            const toCenter = getCenter(toIdx);

            return (
              <div
                key={index}
                className={`relative h-10 transition-all duration-500 ${
                  isActive ? "scale-[1.01]" : ""
                }`}
              >
                {/* Arrow line */}
                {!isSelf && (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ${isActive ? 'h-[3px]' : 'h-[2px]'}`}
                    style={{
                      left: `${Math.min(fromCenter, toCenter)}%`,
                      width: `${Math.abs(toCenter - fromCenter)}%`,
                      background: isActive 
                        ? "linear-gradient(90deg, #a855f7, #3b82f6)" 
                        : isCompleted 
                          ? "linear-gradient(90deg, #22c55e, #10b981)" 
                          : "hsl(var(--muted-foreground) / 0.3)",
                      boxShadow: isActive ? "0 0 15px rgba(168, 85, 247, 0.6), 0 0 30px rgba(59, 130, 246, 0.4)" : "none",
                    }}
                  />
                )}

                {/* Arrow head */}
                {!isSelf && (
                  <div
                    className={`absolute top-1/2 transition-all duration-500 ${
                      isReverse ? "rotate-180" : ""
                    }`}
                    style={{
                      left: `${toCenter}%`,
                      transform: `translate(-50%, -50%)`,
                    }}
                  >
                    <ArrowRight 
                      className={`h-5 w-5 transition-colors ${
                        isActive 
                          ? "text-violet-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" 
                          : isCompleted 
                            ? "text-green-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]" 
                            : "text-muted-foreground"
                      }`} 
                    />
                  </div>
                )}

                {/* Self-call loop */}
                {isSelf && (
                  <div
                    className={`absolute top-0 h-10 w-6 border-2 border-l-0 rounded-r-lg transition-all duration-500 ${
                      isActive 
                        ? "border-violet-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                        : isCompleted 
                          ? "border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
                          : "border-muted-foreground/30"
                    }`}
                    style={{
                      left: `${fromCenter}%`,
                    }}
                  />
                )}

                {/* Message label */}
                <div
                  className={`absolute text-[10px] font-medium px-2 py-0.5 rounded transition-all duration-500 whitespace-nowrap z-20 ${
                    isActive 
                      ? "bg-violet-600 text-white border border-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]" 
                      : isCompleted 
                        ? "bg-green-600/80 text-white border border-green-400" 
                        : "text-muted-foreground bg-muted/80 border border-border"
                  }`}
                  style={{
                    top: isSelf ? "50%" : "-2px",
                    left: isSelf
                      ? `calc(${fromCenter}% + 30px)`
                      : `${(Math.min(fromCenter, toCenter) + Math.abs(toCenter - fromCenter) / 2)}%`,
                    transform: isSelf ? "translateY(-50%)" : "translateX(-50%)",
                  }}
                >
                  {step.message}
                  {step.type === "async" && (
                    <span className="ml-1 text-yellow-300 font-semibold">(async)</span>
                  )}
                  {step.type === "response" && (
                    <span className="ml-1 text-cyan-300 font-semibold">(return)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated glow effect */}
        {isPlaying && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-violet-500/10 via-transparent to-blue-500/10 animate-pulse" />
          </div>
        )}

        {/* Corner accents for visual polish */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-tl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-br-2xl pointer-events-none" />
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeAgent, setActiveAgent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedDiagram, setSelectedDiagram] = useState("feature-workflow");

  // Auto-cycle through agents
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % agents.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  // Stats with animated counters
  const sessionsCounter = useCounter(500, 2000);
  const agentsCounter = useCounter(6, 1500);
  const artifactsCounter = useCounter(30, 1800);
  const providersCounter = useCounter(3, 1000);

  return (
    <div className="relative min-h-screen">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-emerald-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-violet-500/5 via-transparent to-emerald-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative space-y-24 pb-24">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 overflow-hidden">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
                <span className="text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Agentic AI Scrum Platform
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  AI Agents
                </span>
                <br />
                <span className="text-foreground">that ship features</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform a single requirement into complete epics, stories, sprint plans, 
                code, tests, and release documentation - all orchestrated by specialized AI agents.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link href="/feature-workflow">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
                    <Play className="h-5 w-5" />
                    Start Feature Workflow
                  </Button>
                </Link>
                <Link href="/agent-hub">
                  <Button size="lg" variant="outline" className="gap-2 border-violet-500/30 hover:bg-violet-500/10">
                    <Bot className="h-5 w-5" />
                    Explore Agent Hub
                  </Button>
                </Link>
              </div>
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div ref={sessionsCounter.ref} className="text-center p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 backdrop-blur-sm">
                <div className="text-4xl font-bold text-violet-500">{sessionsCounter.count}+</div>
                <div className="text-sm text-muted-foreground mt-1">Sessions Run</div>
              </div>
              <div ref={agentsCounter.ref} className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 backdrop-blur-sm">
                <div className="text-4xl font-bold text-blue-500">{agentsCounter.count}</div>
                <div className="text-sm text-muted-foreground mt-1">AI Agents</div>
              </div>
              <div ref={artifactsCounter.ref} className="text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 backdrop-blur-sm">
                <div className="text-4xl font-bold text-emerald-500">{artifactsCounter.count}+</div>
                <div className="text-sm text-muted-foreground mt-1">Artifact Types</div>
              </div>
              <div ref={providersCounter.ref} className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 backdrop-blur-sm">
                <div className="text-4xl font-bold text-orange-500">{providersCounter.count}</div>
                <div className="text-sm text-muted-foreground mt-1">LLM Providers</div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Pipeline Visualization */}
        <section className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-violet-500/30">
              <Cpu className="h-3 w-3 mr-2" />
              The AI Scrum Team
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Six specialized agents, one seamless workflow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each agent is trained for a specific Scrum role, passing context and artifacts 
              to the next in a coordinated pipeline.
            </p>
          </div>

          {/* Animated Pipeline */}
          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-emerald-500/20 -translate-y-1/2 hidden lg:block" />
            
            {/* Animated beam */}
            <div 
              className="absolute top-1/2 h-1 bg-gradient-to-r from-violet-500 to-purple-500 -translate-y-1/2 hidden lg:block transition-all duration-500 rounded-full shadow-lg shadow-violet-500/50"
              style={{ 
                left: `${(activeAgent / (agents.length - 1)) * 85}%`,
                width: '15%',
              }}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {agents.map((agent, index) => {
                const Icon = agent.icon;
                const isActive = index === activeAgent;
                const isPast = index < activeAgent;
                
                return (
                  <div
                    key={agent.id}
                    className={`relative group cursor-pointer transition-all duration-500 ${
                      isActive ? 'scale-105 z-10' : 'scale-100'
                    }`}
                    onClick={() => {
                      setActiveAgent(index);
                      setIsAnimating(false);
                    }}
                    onMouseEnter={() => setIsAnimating(false)}
                    onMouseLeave={() => setIsAnimating(true)}
                  >
                    {/* Agent Card */}
                    <div className={`relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-500 ${
                      isActive 
                        ? `${agent.bgColor} ${agent.borderColor} shadow-xl` 
                        : isPast 
                          ? 'bg-muted/50 border-muted-foreground/20' 
                          : 'bg-background/50 border-border hover:border-violet-500/30'
                    }`}>
                      {/* Step number */}
                      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        isActive 
                          ? `bg-gradient-to-r ${agent.color} text-white shadow-lg` 
                          : isPast 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isPast ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>

                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 ${
                        isActive 
                          ? `bg-gradient-to-r ${agent.color} shadow-lg` 
                          : 'bg-muted'
                      }`}>
                        <Icon className={`h-7 w-7 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>

                      {/* Name */}
                      <h3 className={`font-semibold mb-2 transition-colors ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {agent.name}
                      </h3>

                      {/* Description (shown on active) */}
                      <div className={`overflow-hidden transition-all duration-500 ${
                        isActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <p className="text-sm text-muted-foreground mb-3">
                          {agent.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {agent.outputs.map((output) => (
                            <Badge key={output} variant="secondary" className="text-xs">
                              {output}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Arrow to next */}
                    {index < agents.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                        <ArrowRight className={`h-6 w-6 transition-colors ${
                          index < activeAgent ? 'text-green-500' : 'text-muted-foreground/30'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current agent detail panel */}
          <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5 border border-violet-500/20 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-r ${agents[activeAgent].color} shadow-xl flex-shrink-0`}>
                {(() => {
                  const Icon = agents[activeAgent].icon;
                  return <Icon className="h-10 w-10 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">{agents[activeAgent].name}</h3>
                  <Badge className={`bg-gradient-to-r ${agents[activeAgent].color} text-white border-0`}>
                    Agent {activeAgent + 1} of {agents.length}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  {agents[activeAgent].description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-muted-foreground mr-2">Produces:</span>
                  {agents[activeAgent].outputs.map((output) => (
                    <Badge key={output} variant="outline" className="bg-background/50">
                      <FileText className="h-3 w-3 mr-1" />
                      {output}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveAgent((prev) => (prev - 1 + agents.length) % agents.length)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveAgent((prev) => (prev + 1) % agents.length)}
                  className={`bg-gradient-to-r ${agents[activeAgent].color} text-white border-0`}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Sequence Diagrams Section */}
        <section className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-cyan-500/30">
              <GitBranch className="h-3 w-3 mr-2" />
              Flow Visualizations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See how agents collaborate in real-time
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Interactive sequence diagrams showing message flow between you and AI agents.
              Watch how context propagates through the pipeline.
            </p>
          </div>

          {/* Diagram Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {sequenceDiagrams.map((diagram) => (
              <Button
                key={diagram.id}
                variant={selectedDiagram === diagram.id ? "default" : "outline"}
                onClick={() => setSelectedDiagram(diagram.id)}
                className={`gap-2 ${selectedDiagram === diagram.id ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white border-0' : ''}`}
              >
                {diagram.id === "feature-workflow" && <Workflow className="h-4 w-4" />}
                {diagram.id === "single-agent" && <Bot className="h-4 w-4" />}
                {diagram.id === "mini-flow" && <GitBranch className="h-4 w-4" />}
                {diagram.title}
              </Button>
            ))}
          </div>

          {/* Active Diagram */}
          {sequenceDiagrams.map((diagram) => (
            <div
              key={diagram.id}
              className={`transition-all duration-500 ${
                selectedDiagram === diagram.id
                  ? "opacity-100 visible"
                  : "opacity-0 invisible h-0 overflow-hidden"
              }`}
            >
              {selectedDiagram === diagram.id && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">{diagram.title}</h3>
                    <p className="text-muted-foreground">{diagram.description}</p>
                  </div>
                  <AnimatedSequenceDiagram diagram={diagram} />
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Feature Bento Grid */}
        <section className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-500/30">
              <Layers className="h-3 w-3 mr-2" />
              Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for AI-powered Scrum
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From full workflows to individual agent runs, with complete telemetry and export options.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className={`group relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-violet-500/30 ${feature.span}`}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-violet-500/10 transition-colors">
                      <Icon className="h-6 w-6 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-violet-500 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="mt-4 flex items-center text-sm text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Explore</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How It Works Timeline */}
        <section className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-emerald-500/30">
              <Clock className="h-3 w-3 mr-2" />
              Quick Start
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From requirement to release in minutes
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500 via-blue-500 to-emerald-500" />

            {[
              {
                step: 1,
                title: "Configure your LLM provider",
                description: "Set up Ollama, OpenAI, or Azure OpenAI with your credentials",
                icon: Settings,
                color: "violet",
              },
              {
                step: 2,
                title: "Enter your requirement",
                description: "Describe the feature, bug fix, or epic you want to build",
                icon: MessageSquare,
                color: "blue",
              },
              {
                step: 3,
                title: "Watch agents collaborate",
                description: "Real-time streaming shows each agent's progress and outputs",
                icon: Workflow,
                color: "cyan",
              },
              {
                step: 4,
                title: "Review and export",
                description: "Get structured artifacts ready for Jira, GitHub, or your workflow",
                icon: Rocket,
                color: "emerald",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative flex gap-6 pb-12 last:pb-0">
                  {/* Step indicator */}
                  <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                    item.color === 'violet' ? 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/25' :
                    item.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25' :
                    item.color === 'cyan' ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/25' :
                    'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                  }`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary" className="text-xs">Step {item.step}</Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container max-w-4xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 p-12 text-center">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Ready to transform your workflow?</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start building with AI agents today
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Experience the future of Scrum with autonomous AI teammates that deliver 
                production-ready artifacts.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/feature-workflow">
                  <Button size="lg" variant="secondary" className="gap-2 bg-white text-violet-600 hover:bg-white/90 shadow-xl">
                    <Play className="h-5 w-5" />
                    Launch Feature Workflow
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
                    <Settings className="h-5 w-5" />
                    Configure LLM
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
