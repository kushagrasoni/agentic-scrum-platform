"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Play,
  TrendingUp,
  Users,
  Zap,
  Clock,
  CheckCircle2,
  Target,
  Briefcase,
  Building2,
  Rocket,
  BarChart3,
  FileText,
  Code,
  TestTube,
  Ship,
  ArrowRight,
  CircleDot,
  Layers,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "challenge", label: "The Challenge", icon: Target },
  { id: "solution", label: "Solution", icon: Rocket },
  { id: "metrics", label: "By The Numbers", icon: BarChart3 },
  { id: "applications", label: "Use Cases", icon: Briefcase },
  { id: "benefits", label: "Who Benefits", icon: Users },
  { id: "hero", label: "Platform Overview", icon: Sparkles },
  { id: "cta", label: "Get Started", icon: Play },
];

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
      
      // Update active section based on scroll position
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;
      
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const element = sectionElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(i);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const section = document.getElementById(sections[index].id);
    if (section) {
      const offset = 120; // Account for stepper height
      const top = section.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveSection(index);
    }
  };

  const goToPrevious = () => {
    if (activeSection > 0) {
      scrollToSection(activeSection - 1);
    }
  };

  const goToNext = () => {
    if (activeSection < sections.length - 1) {
      scrollToSection(activeSection + 1);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Floating Stepper */}
      <div className={cn(
        "fixed top-16 left-64 right-0 z-40 transition-all duration-300",
        isSticky ? "bg-background/95 backdrop-blur-lg border-b shadow-md" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Previous Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              disabled={activeSection === 0}
              className="flex-shrink-0 h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Stepper */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isActive = index === activeSection;
                const isPast = index < activeSection;
                
                return (
                  <div key={section.id} className="flex items-center gap-1 min-w-0">
                    <button
                      onClick={() => scrollToSection(index)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap min-w-0",
                        isActive && "bg-primary text-primary-foreground shadow-lg scale-105",
                        isPast && !isActive && "bg-primary/10 text-primary",
                        !isPast && !isActive && "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      title={section.label}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium hidden lg:inline truncate">{section.label}</span>
                      <span className="text-xs font-medium lg:hidden">{index + 1}</span>
                    </button>
                    {index < sections.length - 1 && (
                      <div className={cn(
                        "w-4 h-0.5 hidden xl:block transition-colors flex-shrink-0",
                        isPast ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={activeSection === sections.length - 1}
              className="flex-shrink-0 h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Spacer for fixed stepper */}
      <div className="h-20" />

      {/* The Challenge Section */}
      <section id="challenge" className="py-20 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              The Challenge
            </Badge>
            <h2 className="text-4xl font-bold mb-4">The Reality of Modern Software Teams</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Scrum teams spend more time documenting than building. Context switching, 
              inconsistent deliverables, and knowledge silos slow down every sprint.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-red-200 dark:border-red-900/30">
              <CardHeader>
                <Clock className="h-10 w-10 text-red-500 mb-2" />
                <CardTitle>Time Drain</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Teams spend <span className="font-bold text-red-500">30-40%</span> of sprint time 
                  on documentation, planning, and ceremonial tasks rather than actual development.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900/30">
              <CardHeader>
                <CircleDot className="h-10 w-10 text-orange-500 mb-2" />
                <CardTitle>Inconsistent Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Deliverables vary wildly in format and completeness. User stories from one sprint 
                  don't match the next. Test coverage is hit or miss.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 dark:border-yellow-900/30">
              <CardHeader>
                <Users className="h-10 w-10 text-yellow-600 mb-2" />
                <CardTitle>Knowledge Silos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Critical decisions live in someone's head. Onboarding takes weeks. 
                  Context is lost when team members rotate or leave.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/10 dark:to-purple-950/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Rocket className="h-3 w-3 mr-1" />
              The Solution
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Meet Your AI Scrum Team</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Six specialized AI agents that work together like a real Scrum team - 
              from product vision to shippable code, in minutes not days.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-blue-200 dark:border-blue-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Product Owner
                  <Badge variant="secondary" className="text-xs">Agent 1</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Transforms vague ideas into structured epics with complete user stories and acceptance criteria.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">User Stories</Badge>
                  <Badge variant="outline" className="text-xs">Vision</Badge>
                  <Badge variant="outline" className="text-xs">AC</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-purple-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Scrum Master
                  <Badge variant="secondary" className="text-xs">Agent 2</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Breaks down work into sprint-ready tasks with dependencies, effort estimates, and risk analysis.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Sprint Plan</Badge>
                  <Badge variant="outline" className="text-xs">Tasks</Badge>
                  <Badge variant="outline" className="text-xs">Risks</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Layers className="h-10 w-10 text-emerald-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Tech Lead
                  <Badge variant="secondary" className="text-xs">Agent 3</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Designs system architecture, API contracts, and technical specifications with security controls.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Architecture</Badge>
                  <Badge variant="outline" className="text-xs">APIs</Badge>
                  <Badge variant="outline" className="text-xs">Security</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Code className="h-10 w-10 text-amber-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Developer
                  <Badge variant="secondary" className="text-xs">Agent 4</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Generates production-ready code with folder structure, dependencies, and environment setup.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Code</Badge>
                  <Badge variant="outline" className="text-xs">Setup</Badge>
                  <Badge variant="outline" className="text-xs">Deps</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TestTube className="h-10 w-10 text-orange-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  QA Engineer
                  <Badge variant="secondary" className="text-xs">Agent 5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Creates comprehensive test plans with automation scripts, edge cases, and test data requirements.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Test Cases</Badge>
                  <Badge variant="outline" className="text-xs">Automation</Badge>
                  <Badge variant="outline" className="text-xs">Coverage</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Ship className="h-10 w-10 text-slate-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Release Manager
                  <Badge variant="secondary" className="text-xs">Agent 6</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Produces executive summaries, deployment plans, and release documentation for stakeholders.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Summary</Badge>
                  <Badge variant="outline" className="text-xs">Deploy</Badge>
                  <Badge variant="outline" className="text-xs">Docs</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact & Value - By The Numbers */}
      <section id="metrics" className="py-20 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <BarChart3 className="h-3 w-3 mr-1" />
              Impact & Value
            </Badge>
            <h2 className="text-4xl font-bold mb-4">By The Numbers</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Measurable impact on your team's velocity and output quality
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-2 border-violet-200 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20">
              <CardHeader>
                <Zap className="h-12 w-12 text-violet-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-violet-600 dark:text-violet-400">10x</CardTitle>
                <CardDescription className="text-base font-medium">Faster Planning</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  What takes days now takes minutes. Complete sprint planning in a single coffee break.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-blue-600 dark:text-blue-400">70%</CardTitle>
                <CardDescription className="text-base font-medium">Time Savings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Reduction in documentation and planning overhead. More time for actual building.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
              <CardHeader>
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">100%</CardTitle>
                <CardDescription className="text-base font-medium">Consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every deliverable follows the same high-quality standard. No more variance.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-purple-200 dark:border-purple-900/30 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
              <CardHeader>
                <Clock className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-purple-600 dark:text-purple-400">&lt;5m</CardTitle>
                <CardDescription className="text-base font-medium">Idea to Epic</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From rough concept to complete, sprint-ready epic with all artifacts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Real-World Applications */}
      <section id="applications" className="py-20 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Briefcase className="h-3 w-3 mr-1" />
              Real-World Applications
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Proven Across Industries</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From fintech to healthcare, teams use ChatGPTeam to accelerate delivery
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">💳 Fintech</CardTitle>
                    <CardDescription className="text-base">Payment Gateway Integration</CardDescription>
                  </div>
                  <Badge variant="secondary">Case Study</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Integrate Stripe with PCI-DSS compliance, 
                  3D Secure, idempotency, and comprehensive error handling.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> Complete technical design, 
                  API specs, security checklist, test cases, and deployment plan generated in 4 minutes.
                </p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="outline">Stripe</Badge>
                  <Badge variant="outline">PCI-DSS</Badge>
                  <Badge variant="outline">Security</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">🏥 Healthcare</CardTitle>
                    <CardDescription className="text-base">HIPAA Patient Portal</CardDescription>
                  </div>
                  <Badge variant="secondary">Case Study</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Build patient data access portal 
                  with HIPAA compliance, audit logging, and secure authentication.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> Full epic with compliance requirements, 
                  security architecture, RBAC design, and audit trail specifications.
                </p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="outline">HIPAA</Badge>
                  <Badge variant="outline">Security</Badge>
                  <Badge variant="outline">Audit</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">🛒 E-Commerce</CardTitle>
                    <CardDescription className="text-base">Checkout Flow Optimization</CardDescription>
                  </div>
                  <Badge variant="secondary">Case Study</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Redesign 3-step checkout with 
                  promo codes, tax calculation, and payment provider integration.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> User stories with conversion metrics, 
                  technical design, test scenarios for edge cases, and A/B test plan.
                </p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="outline">UX</Badge>
                  <Badge variant="outline">Payments</Badge>
                  <Badge variant="outline">Testing</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">📊 Data Engineering</CardTitle>
                    <CardDescription className="text-base">ETL Pipeline Migration</CardDescription>
                  </div>
                  <Badge variant="secondary">Case Study</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Migrate legacy Hive tables to 
                  Databricks with Unity Catalog, handling 500 tables and 10M records/day.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> Complete migration strategy, 
                  Airflow DAG design, data validation scripts, and rollback procedures.
                </p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="outline">Databricks</Badge>
                  <Badge variant="outline">ETL</Badge>
                  <Badge variant="outline">Migration</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section id="benefits" className="py-20 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              Who Benefits
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Built for Every Role</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're shipping MVPs or scaling enterprise products, ChatGPTeam accelerates your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
              <CardHeader>
                <Users className="h-12 w-12 text-violet-500 mb-3" />
                <CardTitle className="text-2xl">Product Managers</CardTitle>
                <CardDescription className="text-base">Turn rough ideas into actionable stories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Generate complete user stories from 2-sentence descriptions</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Instant acceptance criteria that match your domain</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Export directly to Jira or GitHub with one click</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
              <CardHeader>
                <Layers className="h-12 w-12 text-emerald-500 mb-3" />
                <CardTitle className="text-2xl">Engineering Leads</CardTitle>
                <CardDescription className="text-base">Scale architecture without bottlenecks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Comprehensive technical designs in minutes, not hours</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">API contracts, security checklists, and deployment plans included</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Review and refine AI outputs rather than starting from scratch</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <CardHeader>
                <Rocket className="h-12 w-12 text-blue-500 mb-3" />
                <CardTitle className="text-2xl">Startup Founders</CardTitle>
                <CardDescription className="text-base">Full Scrum capabilities without headcount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">6 specialized agents for the cost of zero employees</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Validate ideas rapidly with complete feature breakdowns</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Impress investors with professional documentation</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <CardHeader>
                <Building2 className="h-12 w-12 text-purple-500 mb-3" />
                <CardTitle className="text-2xl">Enterprise Teams</CardTitle>
                <CardDescription className="text-base">Standardize Agile across departments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Consistent deliverables across 100+ teams</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Accelerate onboarding with standardized templates</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Knowledge capture that survives team changes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Overview - Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-blue-950/20 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        
        <div className="container relative max-w-6xl mx-auto px-4">
          <div className="text-center space-y-8 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                Platform Overview
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight space-y-2">
              <div className="text-6xl md:text-8xl bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                ChatGPTeam
              </div>
              <div className="text-4xl md:text-6xl text-foreground/90">
                AI Agents
              </div>
              <div className="text-3xl md:text-5xl text-muted-foreground">
                that ship features
              </div>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform a single requirement into complete epics, stories, sprint plans, 
              code, tests, and release documentation - all orchestrated by specialized AI agents.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/feature-workflow">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
                  <Play className="h-5 w-5" />
                  Try Feature Workflow
                </Button>
              </Link>
              <Link href="/agent-hub">
                <Button size="lg" variant="outline" className="gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  <Sparkles className="h-5 w-5" />
                  Explore Agent Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* See It In Action */}
      <section id="cta" className="py-20 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 text-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              <Play className="h-3 w-3 mr-1" />
              See It In Action
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Sprint Planning?</h2>
            <p className="text-xl text-violet-100 max-w-3xl mx-auto">
              Try ChatGPTeam right now. No signup required. 
              Start with a single requirement and watch 6 AI agents deliver a complete epic.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/feature-workflow">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 h-14 shadow-xl hover:scale-105 transition-transform">
                  <Play className="h-6 w-6" />
                  Start Feature Workflow
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/agent-hub">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14 bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  <Sparkles className="h-6 w-6" />
                  Try Single Agent
                </Button>
              </Link>
            </div>

            <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-violet-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Results in &lt;5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Export to Jira/GitHub</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Footer */}
      <section className="py-12 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <Link href="/history">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                  <CardTitle className="text-lg">View Sample Sessions</CardTitle>
                  <CardDescription>Browse completed workflow examples</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/configure">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Target className="h-8 w-8 mx-auto text-primary mb-2" />
                  <CardTitle className="text-lg">Configure Your LLM</CardTitle>
                  <CardDescription>Connect OpenAI, Azure, or Ollama</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/docs">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
                  <CardTitle className="text-lg">Read Documentation</CardTitle>
                  <CardDescription>Deep dive into capabilities</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
