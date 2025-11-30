'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PlayCircle, 
  Settings, 
  Clock, 
  FileText, 
  Activity,
  TrendingUp,
  CheckCircle2,
  ArrowRight 
} from "lucide-react";
import { useConfigStore } from "@/stores/config-store";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalSessions: number;
  avgExecutionTime: string;
  totalArtifacts: number;
  configStatus: 'configured' | 'not-configured';
}

export default function Home() {
  const { apiMode, azureConfig, openaiConfig } = useConfigStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    avgExecutionTime: '0s',
    totalArtifacts: 0,
    configStatus: 'not-configured'
  });

  useEffect(() => {
    // Fetch stats from API
    const fetchStats = async () => {
      try {
        // Update below to match your API endpoints
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`);
        const data = await response.json();
        
        const sessions = data.data || [];
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter((s: any) => s.status === 'completed');
        
        // Calculate average execution time
        let avgTime = 0;
        if (completedSessions.length > 0) {
          const totalTime = completedSessions.reduce((sum: number, s: any) => {
            if (s.startedAt && s.completedAt) {
              const start = new Date(s.startedAt).getTime();
              const end = new Date(s.completedAt).getTime();
              return sum + (end - start);
            }
            return sum;
          }, 0);
          avgTime = Math.floor(totalTime / completedSessions.length / 1000); // in seconds
        }

        // Estimate artifacts (5 per completed session)
        const totalArtifacts = completedSessions.length * 5;

        setStats({
          totalSessions,
          avgExecutionTime: avgTime > 60 ? `${Math.floor(avgTime / 60)}m ${avgTime % 60}s` : `${avgTime}s`,
          totalArtifacts,
          configStatus: apiMode ? 'configured' : 'not-configured'
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [apiMode]);

  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: Activity,
      description: 'All execution runs',
      trend: '+12% from last week'
    },
    {
      title: 'Avg Execution Time',
      value: stats.avgExecutionTime,
      icon: Clock,
      description: 'Per session',
      trend: '-5% faster'
    },
    {
      title: 'Artifacts Generated',
      value: stats.totalArtifacts,
      icon: FileText,
      description: 'Total documents',
      trend: '+23 this week'
    },
    {
      title: 'Configuration',
      value: stats.configStatus === 'configured' ? 'Active' : 'Pending',
      icon: Settings,
      description: apiMode === 'azure'
        ? `Azure ${azureConfig?.deployment || ""}`
        : apiMode === 'openai'
        ? `OpenAI ${openaiConfig?.model || ""}`
        : 'Not configured',
      trend: stats.configStatus === 'configured' ? 'Ready' : 'Setup required'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your AI Scrum platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="flex items-center pt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
            <Link href="/execute">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <PlayCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Start New Session</CardTitle>
                      <CardDescription>
                        Run AI agents to generate project artifacts
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
            <Link href="/configure">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Settings className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle>Configure Settings</CardTitle>
                      <CardDescription>
                        Update AI provider and model settings
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>

      {/* AI Scrum Team Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">AI Scrum Team</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              name: "Product Owner", 
              role: "Defines product vision and creates user stories",
              color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
            },
            { 
              name: "Scrum Master", 
              role: "Plans sprints and manages the backlog",
              color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
            },
            { 
              name: "Developer", 
              role: "Creates technical specifications and architecture",
              color: "bg-green-500/10 text-green-500 border-green-500/20"
            },
            { 
              name: "QA Engineer", 
              role: "Designs test plans and quality assurance strategy",
              color: "bg-orange-500/10 text-orange-500 border-orange-500/20"
            },
          ].map((agent) => (
            <Card key={agent.name} className="border-2">
              <CardHeader>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${agent.color} mb-2`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <CardDescription className="text-xs">
                  {agent.role}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Capabilities</CardTitle>
          <CardDescription>
            Everything you need for AI-powered Scrum planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Multiple AI Providers
              </h4>
              <p className="text-sm text-muted-foreground">
                Support for Local Ollama, OpenAI, and Azure OpenAI with API Management
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Comprehensive Artifacts
              </h4>
              <p className="text-sm text-muted-foreground">
                Generate user stories, epics, technical specs, and QA test plans
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Session Management
              </h4>
              <p className="text-sm text-muted-foreground">
                Track all executions with complete history and artifact access
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

