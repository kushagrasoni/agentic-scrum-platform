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
import { CheckCircle2, XCircle, Clock, Download, Trash2, Search, Eye, FileText, Github } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export default function HistoryPage() {
  const router = useRouter();
  const { data: sessions, isLoading, error, refetch } = useSessions();
  const { mutate: downloadArtifacts } = useDownloadArtifacts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const filteredSessions = sessions?.filter((session) =>
    session.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async (sessionId: string, format: 'jira' | 'github' | 'markdown') => {
    try {
      setIsExporting(true);
      const blob = await apiClient.artifacts.export(sessionId, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${format}_export_${sessionId.slice(0, 8)}.${format === 'jira' ? 'csv' : format === 'github' ? 'json' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export artifacts');
    } finally {
      setIsExporting(false);
    }
  };

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

  const handleDelete = async (sessionId: string) => {
    try {
      setIsDeleting(true);
      await apiClient.sessions.delete(sessionId);
      setSessionToDelete(null);
      // Refetch sessions list
      refetch();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (!sessions || sessions.length === 0) return;
    
    const confirmed = confirm(`Are you sure you want to delete all ${sessions.length} sessions? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      // Delete all sessions
      await Promise.all(sessions.map(session => apiClient.sessions.delete(session.id)));
      // Refetch sessions list
      refetch();
    } catch (error) {
      console.error('Clear all failed:', error);
      alert('Failed to delete all sessions');
    } finally {
      setIsDeleting(false);
    }
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
        {sessions && sessions.length > 0 && (
          <Button 
            variant="outline" 
            onClick={handleClearAll}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/session/${session.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Session
                    </Button>

                    {session.artifacts.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(session.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          ZIP
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isExporting}>
                              <FileText className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Export Artifacts</DialogTitle>
                              <DialogDescription>
                                Choose format to export artifacts for external tools
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleExport(session.id, 'jira')}
                                disabled={isExporting}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                <div className="text-left">
                                  <div className="font-medium">Jira CSV</div>
                                  <div className="text-xs text-muted-foreground">
                                    Import user stories into Jira
                                  </div>
                                </div>
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleExport(session.id, 'github')}
                                disabled={isExporting}
                              >
                                <Github className="h-4 w-4 mr-2" />
                                <div className="text-left">
                                  <div className="font-medium">GitHub Issues JSON</div>
                                  <div className="text-xs text-muted-foreground">
                                    Create issues in GitHub repository
                                  </div>
                                </div>
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleExport(session.id, 'markdown')}
                                disabled={isExporting}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                <div className="text-left">
                                  <div className="font-medium">Markdown Document</div>
                                  <div className="text-xs text-muted-foreground">
                                    For Confluence, Notion, or documentation
                                  </div>
                                </div>
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    
                    <Dialog open={sessionToDelete === session.id} onOpenChange={(open) => !open && setSessionToDelete(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSessionToDelete(session.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />                          
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Session</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this session? This will remove all artifacts and cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setSessionToDelete(null)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleDelete(session.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
