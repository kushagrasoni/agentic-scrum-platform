"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SessionViewer } from "@/components/session-viewer";
import { useExecutionStore } from "@/stores/execution-store";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Download, FileText, RefreshCw, XCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const execution = useExecutionStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Clear existing data
        execution.clearCheckpoints();
        execution.clearLogs();
        
        const response = await apiClient.sessions.getById(sessionId);
        setSessionData(response);
        
        // Populate execution store with session data
        execution.setSessionId(sessionId);
        execution.setStatus(response.status || "completed");
        
        if (response.agents && Array.isArray(response.agents)) {
          // Convert agents to proper format if needed
          const agents = response.agents.map((agent: any) => ({
            id: agent.name || agent.id,
            name: agent.name,
            status: agent.status,
            progress: agent.progress || 0
          }));
          execution.setAgents(agents);
        }
        
        if (response.checkpoints && Array.isArray(response.checkpoints)) {
          response.checkpoints.forEach((checkpoint: any) => {
            execution.addCheckpoint(checkpoint);
          });
        }
        
        if (response.logs && Array.isArray(response.logs)) {
          response.logs.forEach((log: any) => {
            execution.addLog(log);
          });
        }
      } catch (err: any) {
        console.error("Failed to load session:", err);
        setError(err.message || "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
    
    // Cleanup on unmount
    return () => {
      execution.clearCheckpoints();
      execution.clearLogs();
    };
  }, [sessionId]);

  const handleDownload = async () => {
    try {
      const blob = await apiClient.artifacts.downloadZip(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${sessionId.slice(0, 8)}_artifacts.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleExport = async (format: 'jira' | 'github' | 'markdown') => {
    try {
      setIsExporting(true);
      const blob = await apiClient.artifacts.export(sessionId, format);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${format}_export_${sessionId.slice(0, 8)}.${
        format === 'jira' ? 'csv' : format === 'github' ? 'json' : 'md'
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunAgain = () => {
    // TODO: Pre-fill execute page with same inputs
    router.push('/execute');
  };

  const isLive = execution.status === "running";

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto py-8 space-y-8">
        <Button variant="ghost" onClick={() => router.push('/history')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
        
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/history')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold">
                Session {sessionId.slice(0, 8)}
              </h1>
              <p className="text-muted-foreground">
                {sessionData?.createdAt ? 
                  `Started ${new Date(sessionData.createdAt).toLocaleString()}` : 
                  'Session Details'}
              </p>
            </div>
            
            <Badge variant={
              execution.status === "completed" ? "default" :
              execution.status === "running" ? "secondary" :
              execution.status === "failed" ? "destructive" :
              "outline"
            }>
              {execution.status}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        {!isLive && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download ZIP
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
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
                    onClick={() => handleExport('jira')}
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
                    onClick={() => handleExport('github')}
                    disabled={isExporting}
                  >
                    <FileText className="h-4 w-4 mr-2" />
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
                    onClick={() => handleExport('markdown')}
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
            
            <Button onClick={handleRunAgain}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Again
            </Button>
          </div>
        )}
      </div>

      {/* Session Viewer */}
      <SessionViewer 
        sessionId={sessionId} 
        isLive={isLive}
        onDownload={handleDownload}
        onExport={handleExport}
      />
    </div>
  );
}
