"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Users, FileText, BookOpen, TestTube, CheckCircle, Circle, Clock, Download, Layers } from "lucide-react";
import { useExecutionStore } from "@/stores/execution-store";
import { apiClient } from "@/lib/api-client";
import { StructuredOutputViewer } from "@/components/structured-output-viewer";

interface SessionViewerProps {
  sessionId: string;
  isLive?: boolean;
  onDownload?: () => void;
  onExport?: (format: 'jira' | 'github' | 'markdown') => void;
}

export function SessionViewer({ sessionId, isLive = false, onDownload, onExport }: SessionViewerProps) {
  const execution = useExecutionStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsSourceRef = useRef<EventSource | null>(null);
  const hasStartedSSE = useRef(false);
  const isClosingIntentionally = useRef(false);
  const checkpointBatchRef = useRef<any[]>([]);
  const checkpointTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timelineCardRef = useRef<HTMLDivElement | null>(null);
  const [timelineHeight, setTimelineHeight] = useState<number | null>(null);

  // Batch process checkpoints to reduce re-renders
  const flushCheckpoints = () => {
    if (checkpointBatchRef.current.length > 0) {
      checkpointBatchRef.current.forEach(checkpoint => {
        execution.addCheckpoint(checkpoint);
      });
      checkpointBatchRef.current = [];
    }
  };

  // Setup SSE streaming - only for running sessions
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    // Only connect SSE for live/running sessions
    if (!isLive && execution.status !== "running") {
      console.log('[SSE] Skipping SSE connection - session not running');
      return;
    }

    // Start SSE immediately on first mount, don't wait for status
    if (!hasStartedSSE.current) {
      hasStartedSSE.current = true;
    } else {
      // On subsequent renders, only continue if explicitly running or live
      const isStillRunning = execution.status === "running" || isLive;
      if (!isStillRunning) {
        return;
      }
    }

    console.log('[SSE] Connecting to stream for session:', sessionId);
    // Combined status, log, and checkpoint stream
    eventSourceRef.current = new EventSource(`${apiClient.baseURL}/api/agents/stream/${sessionId}`);
    
    eventSourceRef.current.addEventListener('status', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.status) {
        execution.setStatus(data.status);
      }
      if (data.agents) {
        execution.setAgents(data.agents);
      }
    });
    
    eventSourceRef.current.addEventListener('checkpoint', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      // Batch checkpoints to reduce re-renders
      checkpointBatchRef.current.push(data);
      
      // Clear existing timer
      if (checkpointTimerRef.current) {
        clearTimeout(checkpointTimerRef.current);
      }
      
      // Flush batch after 100ms of inactivity or when batch reaches 5 items
      if (checkpointBatchRef.current.length >= 5) {
        flushCheckpoints();
      } else {
        checkpointTimerRef.current = setTimeout(flushCheckpoints, 100);
      }
    });
    
    eventSourceRef.current.addEventListener('log', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      execution.addLog(data);
    });
    
    eventSourceRef.current.addEventListener('done', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      // Mark that we're closing intentionally
      isClosingIntentionally.current = true;
      
      // Persist session to disk (fire and forget, don't await to prevent connection close issues)
      apiClient.agents.persistSession(sessionId)
        .catch((error) => {
          console.error('[SSE] Failed to persist session:', error);
        })
        .finally(() => {
          eventSourceRef.current?.close();
        });
    });

    eventSourceRef.current.addEventListener('error', (event) => {
      // Only log unexpected errors (not from intentional closure)
      if (!isClosingIntentionally.current) {
        console.warn('[SSE] EventSource error - connection lost or session not found');
      }
    });

    eventSourceRef.current.onerror = (error) => {
      // Only log unexpected errors (not from intentional closure)
      if (!isClosingIntentionally.current) {
        console.warn('[SSE] Connection error - closing SSE stream');
      }
      eventSourceRef.current?.close();
    };

    return () => {
      // Flush any remaining checkpoints
      if (checkpointTimerRef.current) {
        clearTimeout(checkpointTimerRef.current);
      }
      flushCheckpoints();
      
      isClosingIntentionally.current = true;
      eventSourceRef.current?.close();
      hasStartedSSE.current = false;
    };
  }, [sessionId]); // Only re-run when sessionId changes, not on status changes

  // Track timeline card height to cap activity timeline height
  useEffect(() => {
    const updateHeight = () => {
      if (timelineCardRef.current) {
        setTimelineHeight(timelineCardRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [execution.agents.length, execution.status]);

  const agentIcons = {
    product_owner: Users,
    scrum_master: BookOpen,
    developer: FileText,
    qa_automation: TestTube,
    scrum_summary: CheckCircle
  };

  const agentLabels = {
    product_owner: { label: "Product Owner", description: "Vision, user stories & acceptance criteria", color: "blue" },
    scrum_master: { label: "Scrum Master", description: "Sprint plan, tasks & risk analysis", color: "purple" },
    developer: { label: "Developer", description: "Technical design & code implementation", color: "green" },
    qa_automation: { label: "QA Engineer", description: "Test cases & automation scripts", color: "orange" },
    scrum_summary: { label: "Release Manager", description: "Executive summary & delivery plan", color: "pink" }
  };

  const progressPercentage = Math.round(
    (execution.agents.filter(a => a.status === "completed").length / Math.max(execution.agents.length, 1)) * 100
  );

  const isExecuting = execution.status === "running";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Timeline Section - 2/3 width */}
      <div className="lg:col-span-2 space-y-6">
        {/* Metrics Panel */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {progressPercentage}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {execution.agents.filter(a => a.status === "completed").length}/{execution.agents.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Agents Complete</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${isExecuting ? "text-muted-foreground" : "text-green-500"}`}>
                  {isExecuting ? (
                    <Clock className="h-8 w-8 mx-auto" />
                  ) : (
                    <CheckCircle className="h-8 w-8 mx-auto" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isExecuting ? "In Progress" : "Completed"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Visualization */}
        <Card ref={timelineCardRef}>
          <CardHeader>
            <CardTitle>Execution Timeline</CardTitle>
            <CardDescription>
              {isExecuting ? "Watch your AI Scrum team in action" : "Workflow completed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {execution.agents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading session data...</p>
              </div>
            ) : (
              <>
                {/* Timeline Progress Bar */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Start</span>
                    <span className="text-xs text-muted-foreground">
                      {isExecuting ? "Est. 2-3 mins" : "Complete"}
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-primary transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    {execution.agents.map((agent) => {
                      const AgentIcon = agentIcons[agent.name as keyof typeof agentIcons] || Circle;
                      const isCompleted = agent.status === "completed";
                      const isRunning = agent.status === "running";
                      const isError = agent.status === "error";
                      
                      return (
                        <div key={agent.name} className="flex flex-col items-center">
                          <div className={`p-2 rounded-full border-2 ${
                            isCompleted ? "bg-green-500 border-green-500" :
                            isRunning ? "bg-blue-500 border-blue-500 animate-pulse" :
                            isError ? "bg-red-500 border-red-500" :
                            "bg-muted border-muted"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <AgentIcon className={`h-4 w-4 ${
                                agent.status === "waiting" ? "text-muted-foreground" : "text-white"
                              }`} />
                            )}
                          </div>
                          <span className="text-xs mt-1 text-muted-foreground text-center max-w-[60px] truncate">
                            {agent.name.split("_")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Agent Detail */}
                {execution.agents.find(a => a.status === "running") && (
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    {(() => {
                      const runningAgent = execution.agents.find(a => a.status === "running")!;
                      const AgentIcon = agentIcons[runningAgent.name as keyof typeof agentIcons] || Circle;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-full">
                              <AgentIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold capitalize">
                                {runningAgent.name.replace(/_/g, " ")}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Currently analyzing and generating deliverables...
                              </p>
                            </div>
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{runningAgent.progress}%</span>
                            </div>
                            <Progress value={runningAgent.progress} className="h-2" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Completed Agents Summary */}
                <div className="space-y-2">
                  {execution.agents.filter(a => a.status === "completed").map((agent) => {
                    const AgentIcon = agentIcons[agent.name as keyof typeof agentIcons] || Circle;
                    
                    return (
                      <div key={agent.name} className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="p-2 bg-green-500 rounded-full">
                          <AgentIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium capitalize">
                            {agent.name.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed - 1/3 width */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Timeline</CardTitle>
            <CardDescription>Key execution milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea
              className="pr-4 overflow-y-auto"
              style={{ maxHeight: timelineHeight ? `${timelineHeight}px` : undefined }}
            >
              {execution.logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    // Filter to show only key milestone events
                    const filteredLogs = execution.logs.filter(log => 
                      log.message.toLowerCase().includes('starting') ||
                      log.message.toLowerCase().includes('completed') ||
                      log.level === 'error' ||
                      log.level === 'success'
                    );
                    
                    // Remove duplicates based on agent + message combination
                    const uniqueLogs = filteredLogs.filter((log, index, self) => 
                      index === self.findIndex(l => 
                        l.agent === log.agent && 
                        l.message === log.message &&
                        Math.abs(new Date(l.timestamp).getTime() - new Date(log.timestamp).getTime()) < 1000
                      )
                    );
                    
                    // Show in chronological order (oldest first = top to bottom)
                    return uniqueLogs.map((log, index) => {
                      const isStarting = log.message.toLowerCase().includes('starting');
                      const isCompleted = log.message.toLowerCase().includes('completed') || log.level === 'success';
                      const isError = log.level === 'error';
                      
                      return (
                        <div 
                          key={index} 
                          className={`text-sm border-l-2 pl-3 py-2 rounded-r ${
                            isError ? 'border-red-500 bg-red-50/50' :
                            isCompleted ? 'border-green-500 bg-green-50/50' :
                            'border-blue-500 bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`h-2 w-2 rounded-full ${
                              isError ? "bg-red-500" :
                              isCompleted ? "bg-green-500" :
                              "bg-blue-500"
                            }`} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {log.agent}
                            </Badge>
                            <span className="text-xs font-medium">
                              {isStarting && "🚀"}
                              {isCompleted && "✓"}
                              {isError && "⚠"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {log.message}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Structured Output View - Full Width (Only show when completed) */}
      {!isExecuting && execution.status === "completed" && (
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Structured Outputs</CardTitle>
                  <CardDescription>
                    Parsed and validated deliverables ready for Jira/GitHub integration
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StructuredOutputViewer sessionId={sessionId} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
