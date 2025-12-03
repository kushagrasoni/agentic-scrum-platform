/**
 * StructuredOutputViewer Component
 * Displays structured agent outputs with tabs for each agent's deliverables
 */
'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { StoryCard } from '@/components/story-card';
import { TaskList } from '@/components/task-card';
import { TestCaseList } from '@/components/test-case-card';
import { RegenerateDialog } from '@/components/regenerate-dialog';
import { ExportWizard } from '@/components/export-wizard';
import { PushModal } from '@/components/push-modal';
import { PreviewPanel } from '@/components/preview-panel';
import { 
  Users, 
  Calendar, 
  Code, 
  TestTube, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Target,
  Layers,
  Download,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronRight,
  Upload
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import type { StructuredAgentOutput, ValidationResult, UserStory, Task, TestCase, CodeFile } from '@/types/agent-outputs';
import { useToast } from '@/hooks/use-toast';

interface StructuredOutputViewerProps {
  sessionId: string;
}

interface RegenerateDialogState {
  open: boolean;
  itemType: 'story' | 'task' | 'test';
  agentName: string;
  itemId: string;
  itemTitle: string;
  itemSummary?: string;
}

export function StructuredOutputViewer({ sessionId }: StructuredOutputViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [regeneratingAgent, setRegeneratingAgent] = useState<string | null>(null);
  const [regeneratingItem, setRegeneratingItem] = useState<string | null>(null);
  const [exportWizardOpen, setExportWizardOpen] = useState(false);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  // Preview panel state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<{ type: 'story' | 'task' | 'test'; data: UserStory | Task | TestCase }[]>([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [regenerateDialog, setRegenerateDialog] = useState<RegenerateDialogState>({
    open: false,
    itemType: 'story',
    agentName: '',
    itemId: '',
    itemTitle: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch structured output
  const { data: structuredData, isLoading, error } = useQuery<StructuredAgentOutput>({
    queryKey: ['structured-output', sessionId],
    queryFn: () => apiClient.sessions.getStructured(sessionId),
    retry: 1,
  });

  // Fetch validation results
  const { data: validation } = useQuery<ValidationResult>({
    queryKey: ['validation', sessionId],
    queryFn: () => apiClient.artifacts.validate(sessionId, 'jira'),
    enabled: !!structuredData?.epic_vision,
    retry: false,
  });

  // Regenerate mutation
  const regenerateMutation = useMutation({
    mutationFn: async (agentName: string) => {
      // Get current session timestamp BEFORE regeneration
      const currentSession = await apiClient.sessions.get(sessionId);
      const startTimestamp = currentSession.completedAt || currentSession.createdAt;
      
      // Start regeneration
      const response = await apiClient.agents.regenerate(sessionId, agentName);
      
      return { response, startTimestamp, agentName };
    },
    onMutate: (agentName) => {
      setRegeneratingAgent(agentName);
      toast({
        title: 'Regenerating...',
        description: `Starting regeneration for ${getAgentLabel(agentName)}`,
      });
    },
    onSuccess: ({ startTimestamp, agentName }) => {
      // Poll for completion by checking if session timestamp has changed
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 3 seconds = 90 seconds max
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const session = await apiClient.sessions.get(sessionId);
          const currentTimestamp = session.completedAt || session.createdAt;
          
          // Check if timestamp has changed (regeneration completed)
          if (currentTimestamp !== startTimestamp) {
            clearInterval(pollInterval);
            
            // Invalidate and refetch queries to update UI
            await queryClient.invalidateQueries({ queryKey: ['structured-output', sessionId] });
            await queryClient.invalidateQueries({ queryKey: ['validation', sessionId] });
            await queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
            await queryClient.refetchQueries({ queryKey: ['structured-output', sessionId] });
            
            setRegeneratingAgent(null);
            
            toast({
              title: 'Regeneration complete',
              description: `${getAgentLabel(agentName)} output has been updated.`,
            });
          } else if (attempts >= maxAttempts) {
            // Timeout - stop polling
            clearInterval(pollInterval);
            setRegeneratingAgent(null);
            
            toast({
              variant: 'destructive',
              title: 'Regeneration timeout',
              description: `${getAgentLabel(agentName)} regeneration is taking too long. Please refresh the page.`,
            });
          }
        } catch (error) {
          // Keep polling on error
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setRegeneratingAgent(null);
          }
        }
      }, 3000);
    },
    onError: (error: any, agentName) => {
      setRegeneratingAgent(null);
      toast({
        variant: 'destructive',
        title: 'Regeneration failed',
        description: error.message || 'Failed to regenerate agent output',
      });
    },
  });

  const handleRegenerate = (agentName: string) => {
    if (regeneratingAgent) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Another agent is currently being regenerated.',
      });
      return;
    }
    regenerateMutation.mutate(agentName);
  };

  // Item-level regeneration mutation
  const regenerateItemMutation = useMutation({
    mutationFn: async ({ agentName, itemId, feedback }: { agentName: string; itemId: string; feedback: string }) => {
      // Get current session timestamp BEFORE regeneration
      const currentSession = await apiClient.sessions.get(sessionId);
      const startTimestamp = currentSession.completedAt || currentSession.createdAt;
      
      // Start regeneration with feedback
      const response = await apiClient.agents.regenerateItem(sessionId, agentName, itemId, feedback);
      
      return { response, startTimestamp, agentName, itemId };
    },
    onMutate: ({ itemId }) => {
      setRegeneratingItem(itemId);
      toast({
        title: 'Regenerating item...',
        description: `Starting regeneration for ${itemId}`,
      });
    },
    onSuccess: ({ startTimestamp, itemId }) => {
      // Poll for completion by checking if session timestamp has changed
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const session = await apiClient.sessions.get(sessionId);
          const currentTimestamp = session.completedAt || session.createdAt;
          
          // Check if timestamp has changed (regeneration completed)
          if (currentTimestamp !== startTimestamp) {
            clearInterval(pollInterval);
            
            // Invalidate and refetch queries to update UI
            await queryClient.invalidateQueries({ queryKey: ['structured-output', sessionId] });
            await queryClient.invalidateQueries({ queryKey: ['validation', sessionId] });
            await queryClient.refetchQueries({ queryKey: ['structured-output', sessionId] });
            
            setRegeneratingItem(null);
            // Close the dialog
            setRegenerateDialog(prev => ({ ...prev, open: false }));
            
            toast({
              title: 'Item regeneration complete',
              description: `${itemId} has been updated.`,
            });
          } else if (attempts >= maxAttempts) {
            // Timeout - stop polling
            clearInterval(pollInterval);
            setRegeneratingItem(null);
            setRegenerateDialog(prev => ({ ...prev, open: false }));
            
            toast({
              variant: 'destructive',
              title: 'Regeneration timeout',
              description: `${itemId} regeneration is taking too long. Please refresh the page.`,
            });
          }
        } catch (error) {
          // Keep polling on error
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setRegeneratingItem(null);
            setRegenerateDialog(prev => ({ ...prev, open: false }));
          }
        }
      }, 2000);
    },
    onError: (error: any, { itemId }) => {
      setRegeneratingItem(null);
      setRegenerateDialog(prev => ({ ...prev, open: false }));
      toast({
        variant: 'destructive',
        title: 'Item regeneration failed',
        description: error.message || `Failed to regenerate ${itemId}`,
      });
    },
  });

  // Open regenerate dialog for a story
  const openRegenerateDialogForStory = (story: UserStory) => {
    setRegenerateDialog({
      open: true,
      itemType: 'story',
      agentName: 'product_owner',
      itemId: story.id,
      itemTitle: story.title,
      itemSummary: story.as_a ? `As a ${story.as_a}, I want ${story.i_want}` : undefined,
    });
  };

  // Open regenerate dialog for a task
  const openRegenerateDialogForTask = (task: Task) => {
    setRegenerateDialog({
      open: true,
      itemType: 'task',
      agentName: 'scrum_master',
      itemId: task.id,
      itemTitle: task.title,
      itemSummary: task.description,
    });
  };

  // Open regenerate dialog for a test case
  const openRegenerateDialogForTest = (test: TestCase) => {
    setRegenerateDialog({
      open: true,
      itemType: 'test',
      agentName: 'qa_automation',
      itemId: test.id,
      itemTitle: test.title,
      itemSummary: `${test.test_type} test - ${test.priority} priority`,
    });
  };

  // Handle regeneration from dialog
  const handleRegenerateFromDialog = (feedback: string) => {
    if (regeneratingItem) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Another item is currently being regenerated.',
      });
      return;
    }
    regenerateItemMutation.mutate({ 
      agentName: regenerateDialog.agentName, 
      itemId: regenerateDialog.itemId,
      feedback 
    });
  };

  // Legacy handler for direct regeneration (no dialog)
  const handleRegenerateItem = (agentName: string, itemId: string) => {
    if (regeneratingItem) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Another item is currently being regenerated.',
      });
      return;
    }
    regenerateItemMutation.mutate({ agentName, itemId, feedback: '' });
  };

  const getAgentLabel = (agentName: string): string => {
    const labels: Record<string, string> = {
      product_owner: 'Product Owner',
      scrum_master: 'Scrum Master',
      tech_lead: 'Tech Lead / Architect',
      developer: 'Developer',
      qa_automation: 'QA Engineer',
      release_manager: 'Release Manager',
    };
    return labels[agentName] || agentName;
  };

  // Preview handlers for different item types
  const openPreviewForStory = (story: UserStory) => {
    if (!structuredData?.epic_vision) return;
    const items = structuredData.epic_vision.user_stories.map(s => ({ type: 'story' as const, data: s }));
    const index = items.findIndex(i => (i.data as UserStory).id === story.id);
    setPreviewItems(items);
    setPreviewInitialIndex(index >= 0 ? index : 0);
    setPreviewOpen(true);
  };

  const openPreviewForTask = (task: Task) => {
    if (!structuredData?.sprint_plan) return;
    const items = structuredData.sprint_plan.tasks.map(t => ({ type: 'task' as const, data: t }));
    const index = items.findIndex(i => (i.data as Task).id === task.id);
    setPreviewItems(items);
    setPreviewInitialIndex(index >= 0 ? index : 0);
    setPreviewOpen(true);
  };

  const openPreviewForTest = (testCase: TestCase) => {
    if (!structuredData?.test_suite) return;
    const items = structuredData.test_suite.test_cases.map(tc => ({ type: 'test' as const, data: tc }));
    const index = items.findIndex(i => (i.data as TestCase).id === testCase.id);
    setPreviewItems(items);
    setPreviewInitialIndex(index >= 0 ? index : 0);
    setPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
          <p className="text-muted-foreground">Loading structured outputs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load structured outputs. This session may have raw text artifacts only.
        </AlertDescription>
      </Alert>
    );
  }

  if (!structuredData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No structured data available for this session.
        </AlertDescription>
      </Alert>
    );
  }

  const { epic_vision, sprint_plan, technical_design, code_implementation, test_suite, executive_summary } = structuredData;

  return (
    <div className="space-y-6">
      {/* Export Wizard */}
      <ExportWizard
        open={exportWizardOpen}
        onOpenChange={setExportWizardOpen}
        sessionId={sessionId}
        structuredData={structuredData}
      />

      {/* Push Modal */}
      <PushModal
        open={pushModalOpen}
        onOpenChange={setPushModalOpen}
        sessionId={sessionId}
        structuredData={structuredData}
      />

      {/* Preview Panel - Slide-out sheet for Jira/GitHub preview */}
      <PreviewPanel
        items={previewItems}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        initialIndex={previewInitialIndex}
      />

      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Output</h2>
          <p className="text-muted-foreground">Structured outputs from all AI agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportWizardOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setPushModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Push to Jira/GitHub
          </Button>
        </div>
      </div>

      {/* Validation Summary */}
      {validation && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Jira/GitHub Readiness</CardTitle>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {validation.summary.readiness_percentage}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{validation.summary.valid}</div>
                <div className="text-xs text-muted-foreground">Valid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{validation.summary.warnings}</div>
                <div className="text-xs text-muted-foreground">Warnings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{validation.summary.errors}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{validation.summary.total}</div>
                <div className="text-xs text-muted-foreground">Total Stories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Output View */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="epic" disabled={!epic_vision} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Epic Vision
          </TabsTrigger>
          <TabsTrigger value="sprint" disabled={!sprint_plan} className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sprint Plan
          </TabsTrigger>
          <TabsTrigger value="design" disabled={!technical_design} className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="code" disabled={!code_implementation} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="tests" disabled={!test_suite} className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!executive_summary} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Overview</CardTitle>
              <CardDescription>Structured outputs from all agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {epic_vision && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Product Owner</h4>
                      <p className="text-sm text-muted-foreground">
                        {epic_vision.user_stories.length} user stories created
                      </p>
                    </div>
                    <Badge variant="secondary">{epic_vision.user_stories.reduce((sum, s) => sum + (s.story_points || 0), 0)} points</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate('product_owner')}
                      disabled={regenerateMutation.isPending}
                      className="gap-2"
                    >
                      {regenerateMutation.isPending && regenerateMutation.variables === 'product_owner' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                )}

                {sprint_plan && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Scrum Master</h4>
                      <p className="text-sm text-muted-foreground">
                        {sprint_plan.tasks.length} tasks planned
                      </p>
                    </div>
                    <Badge variant="secondary">{sprint_plan.total_estimated_hours || 0}h estimated</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate('scrum_master')}
                      disabled={regenerateMutation.isPending}
                      className="gap-2"
                    >
                      {regenerateMutation.isPending && regenerateMutation.variables === 'scrum_master' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                )}

                {technical_design && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Code className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Tech Lead / Architect</h4>
                      <p className="text-sm text-muted-foreground">
                        {technical_design.api_endpoints.length} API endpoints defined
                      </p>
                    </div>
                    <Badge variant="secondary">{technical_design.technology_stack.length} technologies</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate('tech_lead')}
                      disabled={regenerateMutation.isPending}
                      className="gap-2"
                    >
                      {regenerateMutation.isPending && regenerateMutation.variables === 'tech_lead' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                )}

                {code_implementation ? (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Developer</h4>
                      <p className="text-sm text-muted-foreground">
                        {code_implementation.code_files.length} code files generated
                      </p>
                    </div>
                    <Badge variant="secondary">{code_implementation.dependencies.length} dependencies</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate('developer')}
                      disabled={regenerateMutation.isPending}
                      className="gap-2"
                    >
                      {regenerateMutation.isPending && regenerateMutation.variables === 'developer' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                ) : technical_design && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg border-dashed border-indigo-300 bg-indigo-50/50">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Developer</h4>
                      <p className="text-sm text-muted-foreground">
                        Code implementation not yet generated
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRegenerate('developer')}
                      disabled={regenerateMutation.isPending}
                      className="gap-2"
                    >
                      {regenerateMutation.isPending && regenerateMutation.variables === 'developer' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Generate Code
                    </Button>
                  </div>
                )}

                {test_suite && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <TestTube className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">QA Engineer</h4>
                      <p className="text-sm text-muted-foreground">
                        {test_suite.test_cases.length} test cases created
                      </p>
                    </div>
                    <Badge variant="secondary">{test_suite.test_cases.filter(tc => tc.priority === 'High').length} high priority</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate('qa_automation')}
                      disabled={regenerateMutation.isPending}
                      className="gap-2"
                    >
                      {regenerateMutation.isPending && regenerateMutation.variables === 'qa_automation' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                )}

                {executive_summary && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Release Manager</h4>
                      <p className="text-sm text-muted-foreground">
                        Executive summary and recommendations
                      </p>
                    </div>
                    <Badge variant="secondary">{executive_summary.key_risks.length} risks identified</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate('release_manager')}
                      disabled={regenerateMutation.isPending}
                      className="gap-2"
                    >
                      {regenerateMutation.isPending && regenerateMutation.variables === 'release_manager' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Epic Vision Tab */}
        <TabsContent value="epic" className="space-y-4 mt-6">
          {epic_vision && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Vision & Scope
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Vision</h4>
                    <p className="text-muted-foreground">{epic_vision.vision}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Scope</h4>
                    <p className="text-muted-foreground">{epic_vision.scope}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Success Criteria</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {epic_vision.success_criteria.map((criterion, idx) => (
                        <li key={idx} className="text-muted-foreground">{criterion}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* User Stories Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Stories ({epic_vision.user_stories.length})</h3>
                <p className="text-sm text-muted-foreground">Click the eye icon on any story to preview in Jira/GitHub</p>
              </div>

              {/* Stories List */}
              <div className="space-y-3">
                {epic_vision.user_stories.map((story) => (
                  <StoryCard 
                    key={story.id}
                    story={story}
                    validation={validation?.validations.find(v => v.story_id === story.id)}
                    onRegenerate={() => openRegenerateDialogForStory(story)}
                    onPreview={() => openPreviewForStory(story)}
                    isRegenerating={regeneratingItem === story.id}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Sprint Plan Tab */}
        <TabsContent value="sprint" className="space-y-4 mt-6">
          {sprint_plan && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Sprint Goal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{sprint_plan.sprint_goal}</p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Tasks ({sprint_plan.tasks.length})</h3>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">Click the eye icon on any task to preview</p>
                    <Badge variant="secondary">{sprint_plan.total_estimated_hours || 0}h total</Badge>
                  </div>
                </div>
                <TaskList 
                  tasks={sprint_plan.tasks}
                  onRegenerateTask={(task) => openRegenerateDialogForTask(task)}
                  onPreviewTask={(task) => openPreviewForTask(task)}
                  regeneratingTaskId={regeneratingItem}
                />
              </div>

              {sprint_plan.risks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sprint_plan.risks.map((risk) => (
                      <div key={risk.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={risk.severity === 'High' ? 'destructive' : risk.severity === 'Medium' ? 'default' : 'secondary'}>
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{risk.description}</p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Mitigation:</span> {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Technical Design Tab */}
        <TabsContent value="design" className="space-y-4 mt-6">
          {technical_design && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Architecture Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{technical_design.architecture_overview}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technology Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {technical_design.technology_stack.map((tech, idx) => (
                      <Badge key={idx} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {technical_design.api_endpoints.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>API Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {technical_design.api_endpoints.map((endpoint, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{endpoint.method}</Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                        </div>
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {technical_design.security_considerations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Considerations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {technical_design.security_considerations.map((consideration, idx) => (
                        <li key={idx} className="text-muted-foreground text-sm">{consideration}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Code Implementation Tab */}
        <TabsContent value="code" className="space-y-4 mt-6">
          {code_implementation && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{code_implementation.summary}</p>
                </CardContent>
              </Card>

              {code_implementation.dependencies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {code_implementation.dependencies.map((dep, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 border rounded">
                          <Badge variant="outline">{dep.name}</Badge>
                          <span className="text-sm text-muted-foreground">{dep.version}</span>
                          <span className="text-sm text-muted-foreground">- {dep.purpose}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {code_implementation.environment_variables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {code_implementation.environment_variables.map((env, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <code className="text-sm font-mono font-semibold">{env.name}</code>
                          <p className="text-sm text-muted-foreground mt-1">{env.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Example: <code>{env.example}</code></p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {code_implementation.setup_instructions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Setup Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2">
                      {code_implementation.setup_instructions.map((instruction, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{instruction}</code>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {code_implementation.code_files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Code Files ({code_implementation.code_files.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {code_implementation.code_files.map((file, idx) => (
                      <Collapsible key={idx} className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="bg-gray-100 px-4 py-3 flex items-center justify-between hover:bg-gray-200 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                              <FileText className="h-4 w-4 text-gray-600" />
                              <code className="text-sm font-mono font-semibold">{file.filename}</code>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{file.description?.slice(0, 50)}{file.description?.length > 50 ? '...' : ''}</span>
                              <Badge variant="secondary">{file.language}</Badge>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 py-2 bg-gray-50 border-t border-b">
                            <p className="text-sm text-muted-foreground">{file.description}</p>
                          </div>
                          <pre className="p-4 overflow-x-auto bg-gray-900 text-gray-100 text-sm max-h-96 overflow-y-auto">
                            <code>{file.code}</code>
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Test Suite Tab */}
        <TabsContent value="tests" className="space-y-4 mt-6">
          {test_suite && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Test Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{test_suite.test_strategy}</p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Test Cases ({test_suite.test_cases.length})</h3>
                  <p className="text-sm text-muted-foreground">Click the eye icon on any test to preview</p>
                </div>
                <TestCaseList 
                  testCases={test_suite.test_cases}
                  onRegenerateTest={(testCase) => openRegenerateDialogForTest(testCase)}
                  onPreviewTest={(testCase) => openPreviewForTest(testCase)}
                  regeneratingTestId={regeneratingItem}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Automation Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{test_suite.automation_approach}</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Executive Summary Tab */}
        <TabsContent value="summary" className="space-y-4 mt-6">
          {executive_summary && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{executive_summary.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scope Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{executive_summary.scope_overview}</p>
                </CardContent>
              </Card>

              {executive_summary.key_risks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Risks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {executive_summary.key_risks.map((risk, idx) => (
                        <li key={idx} className="text-muted-foreground">{risk}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {executive_summary.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {executive_summary.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-muted-foreground">{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {executive_summary.next_steps && executive_summary.next_steps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2">
                      {executive_summary.next_steps.map((step, idx) => (
                        <li key={idx} className="text-muted-foreground">{step}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Regenerate Dialog */}
      <RegenerateDialog
        open={regenerateDialog.open}
        onOpenChange={(open) => setRegenerateDialog(prev => ({ ...prev, open }))}
        itemType={regenerateDialog.itemType}
        itemId={regenerateDialog.itemId}
        itemTitle={regenerateDialog.itemTitle}
        itemSummary={regenerateDialog.itemSummary}
        onRegenerate={handleRegenerateFromDialog}
        isRegenerating={regeneratingItem === regenerateDialog.itemId}
      />
    </div>
  );
}
