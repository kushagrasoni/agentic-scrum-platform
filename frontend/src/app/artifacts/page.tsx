"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api-client";
import type { Session, Artifact } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Folder, Clock, FileText, RefreshCw, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ArtifactsPage() {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: sessions, isLoading: loadingSessions, refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => apiClient.sessions.list(),
    staleTime: 30_000,
  });

  const { data: artifacts, isLoading: loadingArtifacts, refetch: refetchArtifacts } = useQuery<Artifact[]>({
    queryKey: ["artifacts", selectedSession],
    queryFn: () => apiClient.artifacts.list(selectedSession!),
    enabled: !!selectedSession,
    staleTime: 30_000,
  });

  const sortedSessions = useMemo(
    () =>
      (sessions || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sessions]
  );

  const handleDownloadAll = async () => {
    if (!selectedSession) return;
    try {
      const blob = await apiClient.artifacts.downloadZip(selectedSession);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSession}-artifacts.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: err?.message || "Unable to download artifacts.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artifacts</h1>
          <p className="text-muted-foreground">Browse and download outputs from completed runs.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { refetchSessions(); if (selectedSession) refetchArtifacts(); }}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Sessions
            </CardTitle>
            <CardDescription>Select a session to view its artifacts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px] pr-4">
              {loadingSessions ? (
                <p className="text-sm text-muted-foreground">Loading sessions...</p>
              ) : sortedSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions yet.</p>
              ) : (
                <div className="space-y-2">
                  {sortedSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session.id)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedSession === session.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {session.status}
                          </Badge>
                          <span className="text-sm font-medium">{session.id.slice(0, 8)}...</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {Object.keys(session.inputs || {}).length ? "Custom input run" : "Workflow run"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Session Artifacts
              </CardTitle>
              <CardDescription>
                {selectedSession ? `Artifacts for session ${selectedSession}` : "Select a session to view artifacts."}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!selectedSession || !artifacts?.length}
              onClick={handleDownloadAll}
            >
              <Download className="h-4 w-4" />
              Download Zip
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedSession ? (
              <p className="text-sm text-muted-foreground">Choose a session to see its artifacts.</p>
            ) : loadingArtifacts ? (
              <p className="text-sm text-muted-foreground">Loading artifacts...</p>
            ) : !artifacts || artifacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No artifacts for this session.</p>
            ) : (
              <div className="space-y-2">
                {artifacts.map((artifact) => (
                  <div key={artifact.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{artifact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {artifact.type || "file"} · {Math.round(artifact.size / 1024)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={async () => {
                        try {
                          const content = await apiClient.artifacts.get(selectedSession, artifact.name);
                          const blob = new Blob([content], { type: "text/plain" });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = artifact.name;
                          a.click();
                          window.URL.revokeObjectURL(url);
                        } catch (err: any) {
                          toast({
                            variant: "destructive",
                            title: "Download failed",
                            description: err?.message || "Unable to fetch artifact.",
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
