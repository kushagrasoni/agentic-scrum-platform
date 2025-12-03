"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Users, FileText, BookOpen, TestTube, CheckCircle, Circle, Clock, Download } from "lucide-react";
import { useExecutionStore } from "@/stores/execution-store";
import { apiClient } from "@/lib/api-client";

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

  // Batch process checkpoints to reduce re-renders
  const flushCheckpoints = () => {
    if (checkpointBatchRef.current.length > 0) {
      checkpointBatchRef.current.forEach(checkpoint => {
        execution.addCheckpoint(checkpoint);
      });
      checkpointBatchRef.current = [];
    }
  };

  // Setup SSE streaming - start immediately on mount if sessionId exists
  useEffect(() => {
    if (!sessionId) {
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
        console.error('[SSE] EventSource error event:', event);
      }
    });

    eventSourceRef.current.onerror = (error) => {
      // Only log unexpected errors (not from intentional closure)
      if (!isClosingIntentionally.current) {
        console.error('[SSE] EventSource onerror:', error);
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
        <Card>
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
            <CardTitle className="text-lg">Live Activity</CardTitle>
            <CardDescription>Real-time updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {execution.logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {execution.logs.slice().reverse().map((log, index) => (
                    <div key={index} className="text-sm border-l-2 border-primary/20 pl-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-2 w-2 rounded-full ${
                          log.level === "error" ? "bg-red-500" :
                          log.level === "success" ? "bg-green-500" :
                          "bg-blue-500"
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs font-medium capitalize text-primary mb-1">
                        {log.agent}
                      </div>
                      <p className="text-xs text-muted-foreground">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Agent Deliverables - Full Width */}
      {execution.checkpoints.length > 0 && (
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agent Deliverables</CardTitle>
                  <CardDescription>Click on any deliverable to view full output</CardDescription>
                </div>
                <Badge variant="outline">
                  {execution.checkpoints.length} {execution.checkpoints.length === 1 ? "deliverable" : "deliverables"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {execution.checkpoints.map((checkpoint, index) => {
                  const agentInfo = agentLabels[checkpoint.agent as keyof typeof agentLabels] || { 
                    label: checkpoint.agent, 
                    description: "Output", 
                    color: "gray" 
                  };
                  const Icon = agentIcons[checkpoint.agent as keyof typeof agentIcons] || Circle;
                  
                  // Map agent colors to actual Tailwind classes
                  const colorClasses = {
                    blue: "bg-blue-100 dark:bg-blue-950",
                    purple: "bg-purple-100 dark:bg-purple-950",
                    green: "bg-green-100 dark:bg-green-950",
                    orange: "bg-orange-100 dark:bg-orange-950",
                    pink: "bg-pink-100 dark:bg-pink-950",
                    gray: "bg-gray-100 dark:bg-gray-950"
                  };
                  
                  const iconColorClasses = {
                    blue: "text-blue-600 dark:text-blue-400",
                    purple: "text-purple-600 dark:text-purple-400",
                    green: "text-green-600 dark:text-green-400",
                    orange: "text-orange-600 dark:text-orange-400",
                    pink: "text-pink-600 dark:text-pink-400",
                    gray: "text-gray-600 dark:text-gray-400"
                  };
                  
                  return (
                    <Dialog key={`item-${index}`}>
                      <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-lg ${colorClasses[agentInfo.color as keyof typeof colorClasses] || colorClasses.gray}`}>
                                  <Icon className={`h-6 w-6 ${iconColorClasses[agentInfo.color as keyof typeof iconColorClasses] || iconColorClasses.gray}`} />
                                </div>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1">{agentInfo.label}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {agentInfo.description}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                <span>{new Date(checkpoint.timestamp).toLocaleTimeString()}</span>
                                <span className="text-primary">View -&gt;</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="!max-w-[90vw] w-[90vw]">
                        <DialogHeader>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colorClasses[agentInfo.color as keyof typeof colorClasses] || colorClasses.gray}`}>
                              <Icon className={`h-5 w-5 ${iconColorClasses[agentInfo.color as keyof typeof iconColorClasses] || iconColorClasses.gray}`} />
                            </div>
                            <div className="flex-1">
                              <DialogTitle>{agentInfo.label}</DialogTitle>
                              <DialogDescription>
                                {agentInfo.description}
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>
                        <ScrollArea className="h-[400px] rounded-md border bg-muted/30">
                          <div className="text-sm whitespace-pre-wrap p-6 leading-relaxed">
                            {checkpoint.content}
                          </div>
                        </ScrollArea>
                        <div className="flex justify-between items-center pt-4 border-t">
                          <Badge variant="outline" className="text-xs">
                            {new Date(checkpoint.timestamp).toLocaleTimeString()}
                          </Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button variant="outline" size="sm">
                              Copy to Clipboard
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
