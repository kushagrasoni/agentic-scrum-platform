"use client";

import { useState, useEffect, useRef } from "react";
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
  Maximize,
  Minimize,
  Database,
  Wrench,
  Bug,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "intro", label: "Intro", icon: Sparkles },
  { id: "challenge", label: "The Challenge", icon: Target },
  { id: "solution", label: "Solution", icon: Rocket },
  { id: "metrics", label: "By The Numbers", icon: BarChart3 },
  { id: "applications", label: "Use Cases", icon: Briefcase },
  { id: "benefits", label: "Who Benefits", icon: Users },
  { id: "hero", label: "Platform Overview", icon: Sparkles },
  { id: "templates", label: "Try It Yourself", icon: Code },
  { id: "cta", label: "Get Started", icon: Play },
];

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isScrollingRef = useRef(false);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
      
      // Don't update active section during manual navigation
      if (isScrollingRef.current) {
        return;
      }
      
      // Update active section based on scroll position
      const sectionElements = sections.map(s => document.getElementById(s.id));
      // Use a smaller offset to detect section earlier
      const scrollPosition = window.scrollY + 150;
      
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
      // Prevent scroll handler from updating active section during navigation
      isScrollingRef.current = true;
      setActiveSection(index);
      
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Re-enable scroll detection after animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
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
    <div className="min-h-screen overflow-y-auto" style={{ scrollSnapType: 'y mandatory' }}>
      {/* Floating Stepper */}
      <div className={cn(
        "fixed z-40 transition-all duration-300",
        isFullscreen ? "top-0 left-0 right-0" : "top-16 left-64 right-0",
        isSticky || isFullscreen ? "bg-background/95 backdrop-blur-lg border-b shadow-md" : "bg-transparent"
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
            <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isActive = index === activeSection;
                const isPast = index < activeSection;
                
                return (
                  <div key={section.id} className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => scrollToSection(index)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap",
                        isActive && "bg-primary text-primary-foreground shadow-lg scale-105",
                        isPast && !isActive && "bg-primary/10 text-primary",
                        !isPast && !isActive && "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      title={section.label}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium hidden md:inline">{section.label}</span>
                      <span className="text-xs font-medium md:hidden">{index + 1}</span>
                    </button>
                    {index < sections.length - 1 && (
                      <div className={cn(
                        "w-4 h-0.5 hidden lg:block transition-colors flex-shrink-0",
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

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="flex-shrink-0 h-9 w-9 p-0 ml-2"
              title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
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

      {/* Fun Intro Section */}
      <section id="intro" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 relative overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-purple-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-pink-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-orange-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container max-w-5xl mx-auto px-4 relative z-10 py-8">
          <div className="text-center space-y-3">
            {/* Main humorous headline */}
            <div>
              <Badge variant="outline" className="text-sm px-3 py-1.5 bg-background/80 backdrop-blur-sm border-2 border-purple-300 dark:border-purple-700">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-500 animate-pulse" />
                Certified AI-Friendly Workplace™
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              No AI Was Harmed
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl">(But Several Humans Were Replaced)</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto font-medium">
              Just kidding! Our AI agents are here to <span className="italic font-semibold">augment</span>, not replace. 
              They went through Scrum school, learned proper sprint etiquette, 
              and now ship features faster than you can say "story points."
            </p>

            {/* Fun stats/badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Card className="border-purple-200 dark:border-purple-900/30 bg-background/80 backdrop-blur-sm">
                <CardContent className="pt-3 px-5 pb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">100%</div>
                    <div className="text-xs text-muted-foreground">AI Job Satisfaction</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-pink-200 dark:border-pink-900/30 bg-background/80 backdrop-blur-sm">
                <CardContent className="pt-3 px-5 pb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">0</div>
                    <div className="text-xs text-muted-foreground">Coffee Breaks Needed</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-900/30 bg-background/80 backdrop-blur-sm">
                <CardContent className="pt-3 px-5 pb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">∞</div>
                    <div className="text-xs text-muted-foreground">Patience with Humans</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Banking context banner */}
            <div className="pt-4">
              <Card className="max-w-3xl mx-auto border-blue-200 dark:border-blue-900/30 bg-background/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-lg">Built for Banking Agile Teams</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Designed to support financial services organizations navigating complex regulatory landscapes 
                    (PCI-DSS, SOX, GLBA, BSA/AML, FFIEC) while maintaining agile velocity. This platform helps 
                    cross-functional teams—spanning retail banking, wealth management, compliance, and IT—collaborate 
                    effectively and deliver secure, compliant solutions faster.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">PCI-DSS</Badge>
                    <Badge variant="outline" className="text-xs">SOX</Badge>
                    <Badge variant="outline" className="text-xs">GLBA</Badge>
                    <Badge variant="outline" className="text-xs">BSA/AML</Badge>
                    <Badge variant="outline" className="text-xs">FFIEC</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* The Challenge Section */}
      <section id="challenge" className="min-h-screen flex items-center justify-center bg-background overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              The Challenge
            </Badge>
            <h2 className="text-4xl font-bold mb-4">The Reality of Modern Software Teams</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Over half of developers report AI improved team output by only 10% or less. Why? Most 
              organizations limit AI to coding—missing 60-70% automation potential across the full SDLC.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-red-200 dark:border-red-900/30">
              <CardHeader>
                <Clock className="h-10 w-10 text-red-500 mb-2" />
                <CardTitle>Limited AI Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <span className="font-bold text-red-500">Over 50%</span> of developers say AI improved 
                  team output by 10% or less—some see no impact at all (Gartner, 2025). Initial 55% 
                  coding speed gains dropped to just 26% in real-world studies.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900/30">
              <CardHeader>
                <CircleDot className="h-10 w-10 text-orange-500 mb-2" />
                <CardTitle>Narrow Focus Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <span className="font-bold text-orange-500">60-70%</span> of SDLC work activities have 
                  automation potential (McKinsey 2023), but most teams apply AI only to coding—missing 
                  requirements, testing, and documentation opportunities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 dark:border-yellow-900/30">
              <CardHeader>
                <Users className="h-10 w-10 text-yellow-600 mb-2" />
                <CardTitle>Upstream Bottleneck</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <span className="font-bold text-yellow-600">25%</span> of work time requires natural 
                  language understanding—gathering requirements, creating user stories, and ideation. 
                  AI here unlocks greater value than coding alone (Gartner, 2025).
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Sources: Gartner Research (Dec 2025), McKinsey Global Institute (2023), GitHub Research (2022)
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/10 dark:to-purple-950/10 overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Rocket className="h-3 w-3 mr-1" />
              The Solution
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Meet Your AI Scrum Team</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Five specialized AI agents that apply AI across the entire SDLC—from requirements to testing. 
              Gartner predicts teams using this ensemble approach will achieve <span className="font-bold text-violet-600">25-30% 
              productivity gains by 2028</span>, up from just 10% with code-focused tools today.
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
      <section id="metrics" className="min-h-screen flex items-center justify-center bg-background overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <BarChart3 className="h-3 w-3 mr-1" />
              Impact & Value
            </Badge>
            <h2 className="text-4xl font-bold mb-4">By The Numbers</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real productivity gains backed by research from GitHub and McKinsey studies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-2 border-violet-200 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20">
              <CardHeader>
                <Zap className="h-12 w-12 text-violet-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-violet-600 dark:text-violet-400">55%</CardTitle>
                <CardDescription className="text-base font-medium">Faster Development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  GitHub study: Developers complete tasks 55% faster with AI assistance (95 dev study, 2022)
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-blue-600 dark:text-blue-400">20-45%</CardTitle>
                <CardDescription className="text-base font-medium">Productivity Boost</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  McKinsey: Generative AI impact on software engineering productivity (2023 report)
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
              <CardHeader>
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">78%</CardTitle>
                <CardDescription className="text-base font-medium">Task Completion</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Success rate with AI vs 70% without—higher quality, fewer blockers, better outcomes
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-purple-200 dark:border-purple-900/30 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
              <CardHeader>
                <Clock className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-5xl font-bold text-purple-600 dark:text-purple-400">73%</CardTitle>
                <CardDescription className="text-base font-medium">Stay In Flow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Developers report staying in flow state longer, reducing context switching and friction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gartner Insight Callout */}
          <div className="mt-12">
            <Card className="max-w-4xl mx-auto border-violet-200 dark:border-violet-900/30 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-violet-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Gartner Prediction: 25-30% Productivity Gains by 2028</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      "Organizations with more than 50% AI adoption report higher time savings in early-stage 
                      development activities: gathering requirements, creating user stories, and ideation. Teams 
                      that consistently apply an ensemble of AI-powered tools across the SDLC will achieve 
                      <span className="font-bold text-violet-600"> 25-30% productivity gains by 2028</span>—up from the 10% delivered by code-generation-focused 
                      approaches in 2024." — <span className="font-semibold">Gartner Research, December 2025</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Sources:</span> Gartner Research (Dec 2025), GitHub Research (2022), McKinsey Global Institute (2023)
            </p>
          </div>
        </div>
      </section>

      {/* Real-World Applications */}
      <section id="applications" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10 overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Briefcase className="h-3 w-3 mr-1" />
              Real-World Applications
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Proven Across Industries</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Banking, retail, and healthcare see highest potential—$200B-$660B annual value from 
              generative AI across customer ops, marketing, and software engineering (McKinsey 2023)
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-xl transition-shadow border-2 border-blue-200 dark:border-blue-900/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">🏦 Digital Banking</CardTitle>
                    <CardDescription className="text-base">PCI-DSS Payment Processing</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900">Banking</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Build secure credit card transaction 
                  processing system meeting PCI-DSS Level 1 requirements (6M+ transactions/year), SOX compliance, and 
                  real-time fraud detection with multi-factor authentication.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> Complete PCI-DSS compliance checklist, 
                  tokenization architecture, fraud detection algorithms, security test cases, and FFIEC audit documentation.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">PCI-DSS v4.0</Badge>
                  <Badge variant="outline">SOX</Badge>
                  <Badge variant="outline">Fraud Detection</Badge>
                  <Badge variant="outline">Tokenization</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-2 border-green-200 dark:border-green-900/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">💰 Retail Banking</CardTitle>
                    <CardDescription className="text-base">Anti-Money Laundering (AML) System</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">Compliance</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Implement transaction monitoring 
                  for suspicious activity detection per Bank Secrecy Act (BSA) and FinCEN regulations. Cross-functional 
                  agile team spanning retail, wealth management, financial crimes unit, and IT.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> Full regulatory requirements matrix, 
                  risk-scoring algorithms, case management workflows, SARS filing procedures, and audit trail design 
                  with role-based access controls (RBAC).
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">BSA/AML</Badge>
                  <Badge variant="outline">FinCEN</Badge>
                  <Badge variant="outline">SAR Filing</Badge>
                  <Badge variant="outline">Risk Scoring</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-2 border-purple-200 dark:border-purple-900/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">� Mobile Banking</CardTitle>
                    <CardDescription className="text-base">Secure Mobile App Modernization</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900">Banking</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Modernize mobile banking app with 
                  biometric authentication, P2P payments, mobile check deposit, and bill pay—meeting FFIEC guidelines, 
                  GLBA privacy requirements, and accessibility standards (WCAG 2.1 AA).
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> Complete feature set with UX flows, 
                  security architecture (OAuth 2.0, PKCE), API contracts, penetration test scenarios, accessibility 
                  checklist, and DevSecOps pipeline configuration.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">FFIEC</Badge>
                  <Badge variant="outline">GLBA</Badge>
                  <Badge variant="outline">Biometrics</Badge>
                  <Badge variant="outline">DevSecOps</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-2 border-orange-200 dark:border-orange-900/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">� Core Banking</CardTitle>
                    <CardDescription className="text-base">Legacy System API Integration</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900">Modernization</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Challenge:</span> Build RESTful API layer over 
                  mainframe core banking system (COBOL/DB2) to enable cloud-native digital services. Must maintain 
                  ACID transactions, support 10K TPS, ensure zero downtime, and meet SEC/FINRA data retention rules.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Result:</span> API gateway design, microservices 
                  architecture with circuit breakers, data synchronization strategy, comprehensive test suites 
                  (unit/integration/performance), disaster recovery procedures, and regulatory compliance validation.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">Mainframe</Badge>
                  <Badge variant="outline">API Gateway</Badge>
                  <Badge variant="outline">Microservices</Badge>
                  <Badge variant="outline">SEC/FINRA</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-semibold text-foreground">Industry Context:</span> Financial institutions process 
              6M+ payment transactions annually (PCI-DSS Level 1) while navigating SEC, FINRA, FFIEC, CFTC, BSA/AML, 
              SOX, GLBA, and Dodd-Frank regulations. Agile teams must balance innovation velocity with stringent 
              compliance controls, audit trails, and ethical walls—challenges this platform directly addresses.
            </p>
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section id="benefits" className="min-h-screen flex items-center justify-center bg-background overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              Who Benefits
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Built for Every Role</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From startups to Fortune 500s—teams report 60-75% improvement in job satisfaction 
              and fulfillment when using AI-augmented workflows (GitHub Research, 2022)
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

            <Card className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-gradient-to-br from-blue-50/30 to-transparent dark:from-blue-950/20">
              <CardHeader>
                <Building2 className="h-12 w-12 text-blue-600 mb-3" />
                <CardTitle className="text-2xl">Banking Agile Teams</CardTitle>
                <CardDescription className="text-base">Navigate compliance while maintaining velocity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Auto-generate PCI-DSS, SOX, GLBA, and FFIEC compliance documentation</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Build audit trails, security controls, and regulatory test cases automatically</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Accelerate cross-functional collaboration across retail, wealth, IT, and compliance</p>
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
      <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-y-auto bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-blue-950/20" style={{ scrollSnapAlign: 'start' }}>
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 pointer-events-none" />
        
        <div className="container relative max-w-6xl mx-auto px-4 py-16">
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

      {/* Try It Yourself - Templates Section */}
      <section id="templates" className="min-h-screen flex items-center justify-center bg-background overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Code className="h-3 w-3 mr-1" />
              Ready-to-Use Templates
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Try It Yourself</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Jump straight into action with 15+ pre-built sprint scenarios that match real-world development challenges. 
              Each template includes complete requirements, context, and constraints—just like actual tickets from your backlog.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Templates */}
            <Card className="border-emerald-200 dark:border-emerald-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-10 w-10 text-emerald-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Feature Development
                  <Badge variant="secondary" className="text-xs">5 Templates</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Build production-ready features with complete specs, from authentication systems to notification services.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Login with MFA (PCI-DSS compliant)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Payment Admin Dashboard</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Multi-channel Notifications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Elasticsearch Product Search</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Design Templates */}
            <Card className="border-blue-200 dark:border-blue-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Layers className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  API Design
                  <Badge variant="secondary" className="text-xs">2 Templates</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Design RESTful APIs with proper error handling, idempotency, and OpenAPI specs.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Payment Processing API (Stripe integration)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">API Gateway with rate limiting</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Engineering Templates */}
            <Card className="border-purple-200 dark:border-purple-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Database className="h-10 w-10 text-purple-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Data Engineering
                  <Badge variant="secondary" className="text-xs">5 Templates</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Build scalable data pipelines, ETL workflows, and data quality frameworks.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Real-time ETL with Flink/Kafka</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Delta Lake Migration (Databricks)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">CDC Replication with Debezium</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">ML Feature Store (Feast)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Debt Templates */}
            <Card className="border-amber-200 dark:border-amber-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Wrench className="h-10 w-10 text-amber-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Technical Debt
                  <Badge variant="secondary" className="text-xs">1 Template</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Tackle legacy system migrations and technical refactoring projects.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">SQL to NoSQL Migration (2M records)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bug Fix Templates */}
            <Card className="border-red-200 dark:border-red-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Bug className="h-10 w-10 text-red-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Bug Fixes
                  <Badge variant="secondary" className="text-xs">1 Template</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Debug critical production issues with root cause analysis and monitoring.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Memory Leak Investigation (Node.js)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure Templates */}
            <Card className="border-slate-200 dark:border-slate-900/30 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Server className="h-10 w-10 text-slate-500 mb-2" />
                <CardTitle className="flex items-center justify-between">
                  Infrastructure
                  <Badge variant="secondary" className="text-xs">2 Templates</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Migrate to Kubernetes, set up API gateways, and modernize infrastructure.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">VM to Kubernetes Migration (15 apps)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Kong API Gateway Setup</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA to Execute Page */}
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto border-violet-200 dark:border-violet-900/30 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
              <CardContent className="py-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold">Ready to See AI Agents in Action?</h3>
                  <Link href="/execute">
                    <Button size="lg" className="bg-violet-600 hover:bg-violet-700 whitespace-nowrap">
                      Try Templates Now
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* See It In Action */}
      <section id="cta" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 text-white overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
        <div className="container max-w-6xl mx-auto px-4 py-16">
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
