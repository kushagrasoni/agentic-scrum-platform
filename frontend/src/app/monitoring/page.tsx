"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api-client";
import type { Session } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, CheckCircle2, Clock, AlertTriangle, RefreshCw, Play, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonitoringPage() {
  const { data: sessions, isLoading, refetch } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => apiClient.sessions.list(),
    staleTime: 15_000,
  });

  const stats = useMemo(() => {
    const list = sessions || [];
    const running = list.filter((s) => s.status === "running").length;
    const completed = list.filter((s) => s.status === "completed").length;
    const errored = list.filter((s) => s.status === "error").length;
    return { total: list.length, running, completed, errored };
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">Live view of session status and recent runs.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

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
                          : "—"}
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
    </div>
  );
}
