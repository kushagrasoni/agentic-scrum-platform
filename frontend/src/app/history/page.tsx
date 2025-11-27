"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSessions } from "@/hooks/use-sessions";
import { useDownloadArtifacts } from "@/hooks/use-artifacts";
import { CheckCircle2, XCircle, Clock, Download, Trash2, Search, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const { data: sessions, isLoading, error } = useSessions();
  const { mutate: downloadArtifacts } = useDownloadArtifacts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const filteredSessions = sessions?.filter((session) =>
    session.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "running":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: "default",
      running: "secondary",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const handleDownload = (sessionId: string) => {
    downloadArtifacts(sessionId);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Execution History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage past Scrum workflow executions
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by session ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => router.push("/execute")}>
          New Execution
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load sessions: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSessions?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No sessions match your search" : "No execution history yet"}
            </p>
            <Button onClick={() => router.push("/execute")}>
              Start Your First Execution
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {filteredSessions && filteredSessions.length > 0 && (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(session.status)}
                      <CardTitle className="text-lg">
                        Session {session.id.slice(0, 8)}
                      </CardTitle>
                      {getStatusBadge(session.status)}
                    </div>
                    <CardDescription>
                      Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSession(session.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Session Details</DialogTitle>
                          <DialogDescription>
                            Session ID: {session.id}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Configuration</h4>
                            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                              {JSON.stringify(session.config, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Artifacts</h4>
                            <div className="space-y-2">
                              {session.artifacts.map((artifact) => (
                                <div
                                  key={artifact.name}
                                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                                >
                                  <div>
                                    <p className="font-medium">{artifact.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {(artifact.size / 1024).toFixed(2)} KB
                                    </p>
                                  </div>
                                  <Badge variant="secondary">{artifact.type}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {session.artifacts.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(session.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {session.artifacts.length > 0 && (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {session.artifacts.map((artifact) => (
                      <Badge key={artifact.name} variant="secondary">
                        {artifact.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
