"use client";

import { useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessions } from "@/hooks/use-sessions";
import { useDownloadArtifacts } from "@/hooks/use-artifacts";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Trash2, 
  Search, 
  Eye, 
  FileText, 
  Github,
  MoreVertical,
  Filter,
  Calendar,
  Users,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Upload
} from "lucide-react";
import { formatDistanceToNow, isWithinInterval, subDays, subWeeks, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

type StatusFilter = 'all' | 'completed' | 'running' | 'error';
type DateFilter = 'all' | 'today' | 'week' | 'month';
type SortOrder = 'newest' | 'oldest';

export default function HistoryPage() {
  const router = useRouter();
  const { data: sessions, isLoading, error, refetch } = useSessions();
  const { mutate: downloadArtifacts } = useDownloadArtifacts();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  
  // UI states
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    let result = [...sessions];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((session) =>
        session.id.toLowerCase().includes(term) ||
        session.artifacts?.some(a => 
          (typeof a === 'string' ? a : a.name).toLowerCase().includes(term)
        )
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((session) => session.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subWeeks(now, 1);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      result = result.filter((session) => 
        isWithinInterval(new Date(session.createdAt), { start: startDate, end: now })
      );
    }
    
    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [sessions, searchTerm, statusFilter, dateFilter, sortOrder]);

  const handleExport = async (sessionId: string, format: 'jira' | 'github' | 'markdown') => {
    try {
      setIsExporting(true);
      const blob = await apiClient.artifacts.export(sessionId, format);
      
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
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      completed: { variant: "default", label: "Completed" },
      running: { variant: "secondary", label: "Running" },
      failed: { variant: "destructive", label: "Failed" },
      error: { variant: "destructive", label: "Error" },
    };
    const { variant, label } = config[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleDownload = (sessionId: string) => {
    downloadArtifacts(sessionId);
  };

  const handleDelete = async (sessionId: string) => {
    try {
      setIsDeleting(true);
      await apiClient.sessions.delete(sessionId);
      setSessionToDelete(null);
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
      await Promise.all(sessions.map(session => apiClient.sessions.delete(session.id)));
      refetch();
    } catch (error) {
      console.error('Clear all failed:', error);
      alert('Failed to delete all sessions');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter('all');
    setDateFilter('all');
    setSortOrder('newest');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFilter !== 'all';

  // Calculate stats
  const stats = useMemo(() => {
    if (!sessions) return { total: 0, completed: 0, running: 0, failed: 0 };
    return {
      total: sessions.length,
      completed: sessions.filter(s => s.status === 'completed').length,
      running: sessions.filter(s => s.status === 'running').length,
      failed: sessions.filter(s => s.status === 'error' || s.status === 'failed').length,
    };
  }, [sessions]);

  // Get artifact count helper
  const getArtifactCount = (session: any) => {
    if (!session.artifacts) return 0;
    return session.artifacts.length;
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Execution History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage past Scrum workflow executions
          </p>
        </div>
        <Button onClick={() => router.push("/execute")}>
          New Execution
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500 transition-colors" onClick={() => setStatusFilter('completed')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setStatusFilter('running')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500 transition-colors" onClick={() => setStatusFilter('error')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by session ID or artifact name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="error">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Last 24h</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
              <SelectTrigger className="w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <XCircle className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            
            {/* Refresh */}
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-destructive">x</button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-destructive">x</button>
                </Badge>
              )}
              {dateFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Date: {dateFilter}
                  <button onClick={() => setDateFilter('all')} className="ml-1 hover:text-destructive">x</button>
                </Badge>
              )}
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredSessions.length} of {sessions?.length || 0} sessions
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {sessions && sessions.length > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearAll}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Sessions
          </Button>
        </div>
      )}

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
              {hasActiveFilters ? "No sessions match your filters" : "No execution history yet"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => router.push("/execute")}>
                Start Your First Execution
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {filteredSessions && filteredSessions.length > 0 && (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <Card 
              key={session.id} 
              className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer"
              onClick={() => router.push(`/session/${session.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  {/* Left: Session Info */}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      session.status === 'completed' ? 'bg-green-100' :
                      session.status === 'running' ? 'bg-blue-100' :
                      'bg-red-100'
                    }`}>
                      {getStatusIcon(session.status)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          Session {session.id.slice(0, 8)}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        {session.completedAt && session.status === 'completed' && (
                          <span className="ml-2">
                            - Completed in {Math.round((new Date(session.completedAt).getTime() - new Date(session.createdAt).getTime()) / 1000)}s
                          </span>
                        )}
                      </p>
                      
                      {/* Metrics Row */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{getArtifactCount(session)} artifacts</span>
                        </div>
                        {session.agents && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{session.agents.length} agents</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Artifact Tags */}
                      {session.artifacts && session.artifacts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {session.artifacts.slice(0, 5).map((artifact, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {typeof artifact === 'string' ? artifact.replace('.json', '').replace('.txt', '') : artifact.name}
                            </Badge>
                          ))}
                          {session.artifacts.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{session.artifacts.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right: Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/session/${session.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    
                    {session.artifacts && session.artifacts.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(session.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download ZIP
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleExport(session.id, 'jira')}>
                            <Upload className="h-4 w-4 mr-2" />
                            Export to Jira (CSV)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(session.id, 'github')}>
                            <Github className="h-4 w-4 mr-2" />
                            Export to GitHub (JSON)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(session.id, 'markdown')}>
                            <FileText className="h-4 w-4 mr-2" />
                            Export Markdown
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/session/${session.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setSessionToDelete(session.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
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
              onClick={() => sessionToDelete && handleDelete(sessionToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
