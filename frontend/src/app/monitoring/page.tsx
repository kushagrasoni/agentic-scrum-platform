"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api-client";
import type { Session, TelemetrySummary, SessionTelemetry } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, CheckCircle2, Clock, AlertTriangle, RefreshCw, Play, Zap, DollarSign, Timer, Cpu, BarChart3, TrendingUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: sessions, isLoading, refetch } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => apiClient.sessions.list(),
    staleTime: 15_000,
  });

  const { data: telemetrySummary, isLoading: telemetryLoading } = useQuery<{ success: boolean; data: TelemetrySummary }>({
    queryKey: ["telemetry-summary"],
    queryFn: () => apiClient.telemetry.getSummary(),
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    const list = sessions || [];
    const running = list.filter((s) => s.status === "running").length;
    const completed = list.filter((s) => s.status === "completed").length;
    const errored = list.filter((s) => s.status === "error").length;
    return { total: list.length, running, completed, errored };
  }, [sessions]);

  const telemetry = telemetrySummary?.data;

  // Format numbers for display
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatCost = (cost: number | undefined) => {
    if (cost === undefined || cost === null) return "$0.00";
    return `$${cost.toFixed(4)}`;
  };

  const formatLatency = (ms: number | undefined) => {
    if (ms === undefined || ms === null) return "0s";
    if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms.toFixed(0)}ms`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">Live view of session status, LLM telemetry, and usage analytics.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            LLM Telemetry
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Layers className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Runs</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Running</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
                  </div>
                  <Play className="h-5 w-5 text-blue-500" />
                </div>
                <Progress value={(stats.running / Math.max(stats.total, 1)) * 100} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <Progress value={(stats.completed / Math.max(stats.total, 1)) * 100} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{stats.errored}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <Progress value={(stats.errored / Math.max(stats.total, 1)) * 100} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Quick LLM Stats */}
          {telemetry && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Tokens Used</p>
                      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatNumber(telemetry.totalTokens)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        In: {formatNumber(telemetry.totalInputTokens)} | Out: {formatNumber(telemetry.totalOutputTokens)}
                      </p>
                    </div>
                    <Zap className="h-6 w-6 text-violet-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Cost</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCost(telemetry.totalEstimatedCost)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg: {formatCost(telemetry.totalEstimatedCost / Math.max(telemetry.totalSessions, 1))}/session
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Latency</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatLatency(telemetry.avgLatencyPerSession)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatNumber(telemetry.avgTokensPerSession)} tokens/session
                      </p>
                    </div>
                    <Timer className="h-6 w-6 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Telemetry Tab */}
        <TabsContent value="telemetry" className="space-y-6">
          {telemetryLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading telemetry data...</p>
              </CardContent>
            </Card>
          ) : !telemetry ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No telemetry data available yet. Run some feature workflows to generate data.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Token Usage Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-violet-500" />
                      Total Tokens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatNumber(telemetry.totalTokens)}</p>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>Input: {formatNumber(telemetry.totalInputTokens)}</span>
                      <span>Output: {formatNumber(telemetry.totalOutputTokens)}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      Total Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-emerald-600">{formatCost(telemetry.totalEstimatedCost)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Avg per session: {formatCost(telemetry.totalEstimatedCost / Math.max(telemetry.totalSessions, 1))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Timer className="h-4 w-4 text-amber-500" />
                      Avg Latency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-amber-600">{formatLatency(telemetry.avgLatencyPerSession)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Per session (all agents)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Sessions Analyzed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{telemetry.totalSessions}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatNumber(telemetry.avgTokensPerSession)} avg tokens/session
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Model & Provider Usage */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Model Usage
                    </CardTitle>
                    <CardDescription>Token distribution by model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {telemetry.modelUsage && Object.keys(telemetry.modelUsage).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(telemetry.modelUsage).map(([model, tokens]) => {
                          const percentage = (tokens / telemetry.totalTokens) * 100;
                          return (
                            <div key={model} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{model}</span>
                                <span className="text-muted-foreground">{formatNumber(tokens)} tokens</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No model data available</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Provider Usage
                    </CardTitle>
                    <CardDescription>Token distribution by provider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {telemetry.providerUsage && Object.keys(telemetry.providerUsage).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(telemetry.providerUsage).map(([provider, tokens]) => {
                          const percentage = (tokens / telemetry.totalTokens) * 100;
                          const providerColors: Record<string, string> = {
                            azure: "bg-blue-500",
                            openai: "bg-emerald-500",
                            ollama: "bg-purple-500",
                          };
                          return (
                            <div key={provider} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium capitalize">{provider}</span>
                                <span className="text-muted-foreground">{formatNumber(tokens)} tokens</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${providerColors[provider] || "bg-gray-500"}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No provider data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cost Breakdown Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Cost Estimation Details</CardTitle>
                  <CardDescription>How costs are calculated</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">GPT-4o</p>
                      <p className="text-muted-foreground">$0.005/1K input, $0.015/1K output</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">GPT-4o-mini</p>
                      <p className="text-muted-foreground">$0.00015/1K input, $0.0006/1K output</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">GPT-4</p>
                      <p className="text-muted-foreground">$0.03/1K input, $0.06/1K output</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    * Costs are estimates based on tiktoken token counting. Actual costs may vary.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Sorted by start time (newest first)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading sessions...</p>
              ) : !sessions || sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Artifacts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions
                      .slice()
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                session.status === "completed"
                                  ? "secondary"
                                  : session.status === "running"
                                  ? "outline"
                                  : session.status === "error"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {session.completedAt
                              ? formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {Array.isArray(session.artifacts) ? session.artifacts.length : 0}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
