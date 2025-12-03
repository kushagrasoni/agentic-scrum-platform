"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  FileText,
  Github,
  Upload,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Download,
  ExternalLink,
  AlertCircle,
  Check,
  Settings,
  List,
  Eye,
} from "lucide-react";
import type { StructuredAgentOutput, UserStory, Task, TestCase } from "@/types/agent-outputs";
import { apiClient } from "@/lib/api-client";

type ExportTarget = 'jira' | 'github' | 'markdown' | 'zip';

interface ExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  structuredData?: StructuredAgentOutput;
}

interface ExportItem {
  id: string;
  type: 'story' | 'task' | 'test';
  title: string;
  selected: boolean;
  data: UserStory | Task | TestCase;
}

interface JiraConfig {
  projectKey: string;
  epicLink: string;
  sprint: string;
  defaultAssignee: string;
  addAiLabel: boolean;
}

interface GitHubConfig {
  milestone: string;
  labels: string[];
  addAiLabel: boolean;
}

export function ExportWizard({ open, onOpenChange, sessionId, structuredData }: ExportWizardProps) {
  const [step, setStep] = useState(1);
  const [exportTarget, setExportTarget] = useState<ExportTarget>('jira');
  const [exportItems, setExportItems] = useState<ExportItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; items?: string[] } | null>(null);
  
  // Configuration states
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>({
    projectKey: 'PROJ',
    epicLink: '',
    sprint: '',
    defaultAssignee: '',
    addAiLabel: true,
  });
  
  const [githubConfig, setGitHubConfig] = useState<GitHubConfig>({
    milestone: '',
    labels: [],
    addAiLabel: true,
  });

  // Initialize export items from structured data
  useMemo(() => {
    if (!structuredData) return;
    
    const items: ExportItem[] = [];
    
    // Add user stories
    if (structuredData.epic_vision?.user_stories) {
      structuredData.epic_vision.user_stories.forEach((story, idx) => {
        items.push({
          id: story.id || `US-${idx + 1}`,
          type: 'story',
          title: story.title,
          selected: true,
          data: story,
        });
      });
    }
    
    // Add tasks
    if (structuredData.sprint_plan?.tasks) {
      structuredData.sprint_plan.tasks.forEach((task, idx) => {
        items.push({
          id: task.id || `TASK-${idx + 1}`,
          type: 'task',
          title: task.title,
          selected: false,
          data: task,
        });
      });
    }
    
    // Add test cases
    if (structuredData.test_suite?.test_cases) {
      structuredData.test_suite.test_cases.forEach((test, idx) => {
        items.push({
          id: test.id || `TC-${idx + 1}`,
          type: 'test',
          title: test.title,
          selected: false,
          data: test,
        });
      });
    }
    
    setExportItems(items);
  }, [structuredData]);

  const selectedCount = exportItems.filter(item => item.selected).length;
  const storyCount = exportItems.filter(item => item.type === 'story' && item.selected).length;
  const taskCount = exportItems.filter(item => item.type === 'task' && item.selected).length;
  const testCount = exportItems.filter(item => item.type === 'test' && item.selected).length;

  const toggleItem = (id: string) => {
    setExportItems(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAll = (selected: boolean) => {
    setExportItems(items => items.map(item => ({ ...item, selected })));
  };

  const toggleByType = (type: 'story' | 'task' | 'test', selected: boolean) => {
    setExportItems(items =>
      items.map(item =>
        item.type === type ? { ...item, selected } : item
      )
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);

    try {
      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Determine format based on target
      const format = exportTarget === 'zip' ? 'markdown' : exportTarget;
      
      if (exportTarget === 'zip') {
        // Download as ZIP
        const response = await fetch(`/api/sessions/${sessionId}/artifacts/download`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_${sessionId.slice(0, 8)}_artifacts.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Export to specific format
        const blob = await apiClient.artifacts.export(sessionId, format as 'jira' | 'github' | 'markdown');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${format}_export_${sessionId.slice(0, 8)}.${format === 'jira' ? 'csv' : format === 'github' ? 'json' : 'md'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      clearInterval(progressInterval);
      setExportProgress(100);
      
      setExportResult({
        success: true,
        message: `Successfully exported ${selectedCount} items`,
        items: exportItems.filter(item => item.selected).map(item => item.id),
      });
      
      setStep(4); // Success step
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({
        success: false,
        message: 'Export failed. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setExportProgress(0);
    setExportResult(null);
  };

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const getTargetIcon = (target: ExportTarget) => {
    switch (target) {
      case 'jira':
        return <Upload className="h-5 w-5" />;
      case 'github':
        return <Github className="h-5 w-5" />;
      case 'markdown':
        return <FileText className="h-5 w-5" />;
      case 'zip':
        return <Download className="h-5 w-5" />;
    }
  };

  const getTargetLabel = (target: ExportTarget) => {
    switch (target) {
      case 'jira':
        return 'Jira CSV';
      case 'github':
        return 'GitHub Issues';
      case 'markdown':
        return 'Markdown';
      case 'zip':
        return 'ZIP Archive';
    }
  };

  const getTypeColor = (type: 'story' | 'task' | 'test') => {
    switch (type) {
      case 'story':
        return 'bg-blue-100 text-blue-700';
      case 'task':
        return 'bg-green-100 text-green-700';
      case 'test':
        return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 && <><List className="h-5 w-5" /> Select Items to Export</>}
            {step === 2 && <><Settings className="h-5 w-5" /> Configure Export</>}
            {step === 3 && <><Eye className="h-5 w-5" /> Review & Export</>}
            {step === 4 && <><CheckCircle2 className="h-5 w-5 text-green-500" /> Export Complete</>}
          </DialogTitle>
          <DialogDescription>
            {step < 4 && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
                  <span className="text-sm">Select</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center gap-1 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
                  <span className="text-sm">Configure</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center gap-1 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
                  <span className="text-sm">Export</span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Items */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                  Deselect All
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedCount} of {exportItems.length} selected
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => toggleByType('story', true)}
              >
                User Stories ({exportItems.filter(i => i.type === 'story').length})
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-green-50"
                onClick={() => toggleByType('task', true)}
              >
                Tasks ({exportItems.filter(i => i.type === 'task').length})
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-orange-50"
                onClick={() => toggleByType('test', true)}
              >
                Test Cases ({exportItems.filter(i => i.type === 'test').length})
              </Badge>
            </div>

            <Separator />

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {exportItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      item.selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <Badge variant="secondary" className={getTypeColor(item.type)}>
                      {item.type.toUpperCase()}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.id}</p>
                    </div>
                    {item.selected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))}
                
                {exportItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No items available for export</p>
                    <p className="text-sm">Run a workflow to generate exportable content</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 2: Configure Export */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Export Target Selection */}
            <div className="space-y-3">
              <Label>Export Target</Label>
              <RadioGroup
                value={exportTarget}
                onValueChange={(v) => setExportTarget(v as ExportTarget)}
                className="grid grid-cols-2 gap-3"
              >
                {(['jira', 'github', 'markdown', 'zip'] as ExportTarget[]).map((target) => (
                  <div key={target} className="relative">
                    <RadioGroupItem value={target} id={target} className="peer sr-only" />
                    <Label
                      htmlFor={target}
                      className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
                    >
                      {getTargetIcon(target)}
                      <div>
                        <p className="font-medium">{getTargetLabel(target)}</p>
                        <p className="text-xs text-muted-foreground">
                          {target === 'jira' && 'Import into Jira projects'}
                          {target === 'github' && 'Create GitHub issues'}
                          {target === 'markdown' && 'Documentation format'}
                          {target === 'zip' && 'Download all files'}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Target-specific configuration */}
            {exportTarget === 'jira' && (
              <div className="space-y-4">
                <h4 className="font-medium">Jira Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectKey">Project Key</Label>
                    <Input
                      id="projectKey"
                      value={jiraConfig.projectKey}
                      onChange={(e) => setJiraConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                      placeholder="e.g., PROJ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="epicLink">Epic Link (optional)</Label>
                    <Input
                      id="epicLink"
                      value={jiraConfig.epicLink}
                      onChange={(e) => setJiraConfig(prev => ({ ...prev, epicLink: e.target.value }))}
                      placeholder="e.g., PROJ-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sprint">Sprint (optional)</Label>
                    <Input
                      id="sprint"
                      value={jiraConfig.sprint}
                      onChange={(e) => setJiraConfig(prev => ({ ...prev, sprint: e.target.value }))}
                      placeholder="e.g., Sprint 23"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignee">Default Assignee</Label>
                    <Input
                      id="assignee"
                      value={jiraConfig.defaultAssignee}
                      onChange={(e) => setJiraConfig(prev => ({ ...prev, defaultAssignee: e.target.value }))}
                      placeholder="Unassigned"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="jiraAiLabel"
                    checked={jiraConfig.addAiLabel}
                    onCheckedChange={(checked) => setJiraConfig(prev => ({ ...prev, addAiLabel: !!checked }))}
                  />
                  <Label htmlFor="jiraAiLabel" className="text-sm">
                    Add "ai-generated" label to all items
                  </Label>
                </div>
              </div>
            )}

            {exportTarget === 'github' && (
              <div className="space-y-4">
                <h4 className="font-medium">GitHub Configuration</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="milestone">Milestone (optional)</Label>
                    <Input
                      id="milestone"
                      value={githubConfig.milestone}
                      onChange={(e) => setGitHubConfig(prev => ({ ...prev, milestone: e.target.value }))}
                      placeholder="e.g., v1.0 Release"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labels">Additional Labels (comma-separated)</Label>
                    <Input
                      id="labels"
                      value={githubConfig.labels.join(', ')}
                      onChange={(e) => setGitHubConfig(prev => ({ 
                        ...prev, 
                        labels: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
                      }))}
                      placeholder="e.g., enhancement, frontend"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="githubAiLabel"
                    checked={githubConfig.addAiLabel}
                    onCheckedChange={(checked) => setGitHubConfig(prev => ({ ...prev, addAiLabel: !!checked }))}
                  />
                  <Label htmlFor="githubAiLabel" className="text-sm">
                    Add "ai-generated" label to all items
                  </Label>
                </div>
              </div>
            )}

            {(exportTarget === 'markdown' || exportTarget === 'zip') && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {exportTarget === 'markdown' 
                    ? 'Markdown export will include all selected items in a single formatted document.'
                    : 'ZIP archive will include all session artifacts in their original format.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 3: Review & Export */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Export Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p className="font-medium flex items-center gap-2">
                    {getTargetIcon(exportTarget)}
                    {getTargetLabel(exportTarget)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-medium">{selectedCount} items selected</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Breakdown</p>
                  <p className="font-medium">
                    {storyCount > 0 && `${storyCount} stories`}
                    {taskCount > 0 && `, ${taskCount} tasks`}
                    {testCount > 0 && `, ${testCount} tests`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Session</p>
                  <p className="font-medium">{sessionId.slice(0, 8)}...</p>
                </div>
              </div>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} />
              </div>
            )}

            {exportResult && !exportResult.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{exportResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && exportResult?.success && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Export Successful!</h3>
              <p className="text-muted-foreground">
                {exportResult.message}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {exportResult.items?.slice(0, 5).map((item) => (
                <Badge key={item} variant="secondary">{item}</Badge>
              ))}
              {(exportResult.items?.length || 0) > 5 && (
                <Badge variant="outline">+{(exportResult.items?.length || 0) - 5} more</Badge>
              )}
            </div>

            <div className="pt-4">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View in {getTargetLabel(exportTarget)}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step < 4 && (
            <>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isExporting}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  disabled={step === 1 && selectedCount === 0}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleExport} disabled={isExporting || selectedCount === 0}>
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      {getTargetIcon(exportTarget)}
                      <span className="ml-2">Export to {getTargetLabel(exportTarget)}</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          
          {step === 4 && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
