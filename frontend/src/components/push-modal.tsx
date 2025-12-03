"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { StructuredAgentOutput } from "@/types/agent-outputs";

// SVG Icons
const JiraIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 005.215 5.214h2.129v2.058a5.218 5.218 0 005.215 5.214V6.758a1.001 1.001 0 00-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 005.215 5.215h2.129v2.057A5.215 5.215 0 0024 12.483V1.005A1.001 1.001 0 0023.013 0z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

interface PushItem {
  id: string;
  title: string;
  description: string;
  type: "story" | "task" | "test";
  selected: boolean;
}

interface PushResult {
  success: boolean;
  title: string;
  issue_key?: string;
  issue_number?: number;
  url?: string;
  error?: string;
}

interface PushModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  structuredData?: StructuredAgentOutput;
}

type PushTarget = "jira" | "github";
type PushStep = "select" | "configure" | "pushing" | "complete";

export function PushModal({
  open,
  onOpenChange,
  sessionId,
  structuredData,
}: PushModalProps) {
  const [step, setStep] = useState<PushStep>("select");
  const [target, setTarget] = useState<PushTarget>("jira");
  const [items, setItems] = useState<PushItem[]>([]);
  const [jiraStatus, setJiraStatus] = useState<{ connected: boolean; projects: string[] } | null>(null);
  const [githubStatus, setGithubStatus] = useState<{ connected: boolean; repos: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<PushResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Jira config
  const [jiraProject, setJiraProject] = useState("");
  const [jiraIssueType, setJiraIssueType] = useState("Story");

  // GitHub config
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");

  // Load integration status and build items list
  useEffect(() => {
    if (open) {
      loadIntegrationStatus();
      buildItemsList();
      setStep("select");
      setError(null);
      setResults([]);
      setProgress(0);
    }
  }, [open, structuredData]);

  const loadIntegrationStatus = async () => {
    try {
      const [jiraRes, githubRes] = await Promise.all([
        apiClient.integrations.jira.status(),
        apiClient.integrations.github.status(),
      ]);

      if (jiraRes.success && jiraRes.data?.connected) {
        setJiraStatus({
          connected: true,
          projects: jiraRes.data.details?.projects || [],
        });
        if (jiraRes.data.details?.projects?.[0]) {
          setJiraProject(jiraRes.data.details.projects[0]);
        }
      } else {
        setJiraStatus({ connected: false, projects: [] });
      }

      if (githubRes.success && githubRes.data?.connected) {
        setGithubStatus({
          connected: true,
          repos: githubRes.data.details?.repos || [],
        });
        if (githubRes.data.details?.repos?.[0]) {
          const [owner, repo] = githubRes.data.details.repos[0].split("/");
          setGithubOwner(owner || "");
          setGithubRepo(repo || "");
        }
      } else {
        setGithubStatus({ connected: false, repos: [] });
      }
    } catch (err) {
      console.error("Failed to load integration status:", err);
    }
  };

  const buildItemsList = () => {
    if (!structuredData) {
      setItems([]);
      return;
    }

    const newItems: PushItem[] = [];

    // Add user stories from epic_vision
    if (structuredData.epic_vision?.user_stories) {
      structuredData.epic_vision.user_stories.forEach((story, idx) => {
        newItems.push({
          id: `story-${idx}`,
          title: story.title || `User Story ${idx + 1}`,
          description: story.as_a ? `As a ${story.as_a}, I want ${story.i_want}, so that ${story.so_that}` : "",
          type: "story",
          selected: true,
        });
      });
    }

    // Add tasks from sprint_plan
    if (structuredData.sprint_plan?.tasks) {
      structuredData.sprint_plan.tasks.forEach((task, idx) => {
        newItems.push({
          id: `task-${idx}`,
          title: task.title || `Task ${idx + 1}`,
          description: task.description || "",
          type: "task",
          selected: false,
        });
      });
    }

    // Add test cases from test_suite
    if (structuredData.test_suite?.test_cases) {
      structuredData.test_suite.test_cases.forEach((test, idx) => {
        newItems.push({
          id: `test-${idx}`,
          title: test.title || `Test Case ${idx + 1}`,
          description: test.description || "",
          type: "test",
          selected: false,
        });
      });
    }

    setItems(newItems);
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectAll = (type?: "story" | "task" | "test") => {
    setItems((prev) =>
      prev.map((item) =>
        type === undefined || item.type === type ? { ...item, selected: true } : item
      )
    );
  };

  const deselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const selectedItems = items.filter((item) => item.selected);
  const selectedCount = selectedItems.length;

  const canPush = () => {
    if (selectedCount === 0) return false;
    if (target === "jira") {
      return jiraStatus?.connected && jiraProject.length > 0;
    }
    if (target === "github") {
      return githubStatus?.connected && githubOwner.length > 0 && githubRepo.length > 0;
    }
    return false;
  };

  const handlePush = async () => {
    if (!canPush()) return;

    setStep("pushing");
    setProgress(0);
    setResults([]);
    setError(null);

    try {
      const pushItems = selectedItems.map((item) => ({
        title: item.title,
        description: item.description,
      }));

      if (target === "jira") {
        const response = await apiClient.integrations.jira.push({
          project_key: jiraProject,
          items: pushItems,
          default_issue_type: jiraIssueType,
          default_labels: ["ai-generated", "agentic-scrum"],
        });

        if (response.success && response.data) {
          setResults(response.data.results || []);
          setProgress(100);
          setStep("complete");
        } else {
          setError(response.message || "Failed to push to Jira");
          setStep("configure");
        }
      } else if (target === "github") {
        const response = await apiClient.integrations.github.push({
          owner: githubOwner,
          repo: githubRepo,
          items: pushItems,
          default_labels: ["ai-generated", "agentic-scrum"],
        });

        if (response.success && response.data) {
          setResults(response.data.results || []);
          setProgress(100);
          setStep("complete");
        } else {
          setError(response.message || "Failed to push to GitHub");
          setStep("configure");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push failed");
      setStep("configure");
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Push to {target === "jira" ? "Jira" : "GitHub"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Select items to push and choose your target"}
            {step === "configure" && "Configure push settings"}
            {step === "pushing" && "Creating issues..."}
            {step === "complete" && "Push completed"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select items and target */}
        {step === "select" && (
          <div className="flex-1 space-y-4 overflow-hidden">
            {/* Target selection */}
            <div className="space-y-2">
              <Label>Target Platform</Label>
              <RadioGroup
                value={target}
                onValueChange={(v) => setTarget(v as PushTarget)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="jira" id="push-jira" className="peer sr-only" />
                  <Label
                    htmlFor="push-jira"
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      target === "jira" ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                  >
                    <div className="text-blue-600">
                      <JiraIcon />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Jira</div>
                      <div className="text-xs text-muted-foreground">
                        {jiraStatus?.connected ? (
                          <span className="text-green-600">Connected</span>
                        ) : (
                          <span className="text-yellow-600">Not connected</span>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="github" id="push-github" className="peer sr-only" />
                  <Label
                    htmlFor="push-github"
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      target === "github" ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                  >
                    <GitHubIcon />
                    <div className="flex-1">
                      <div className="font-medium">GitHub</div>
                      <div className="text-xs text-muted-foreground">
                        {githubStatus?.connected ? (
                          <span className="text-green-600">Connected</span>
                        ) : (
                          <span className="text-yellow-600">Not connected</span>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Connection warning */}
            {((target === "jira" && !jiraStatus?.connected) ||
              (target === "github" && !githubStatus?.connected)) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {target === "jira" ? "Jira" : "GitHub"} is not connected. Please go to{" "}
                  <a href="/settings/integrations" className="underline font-medium">
                    Integration Settings
                  </a>{" "}
                  to connect first.
                </AlertDescription>
              </Alert>
            )}

            {/* Items selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items to Push ({selectedCount} selected)</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => selectAll()}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => selectAll("story")}
                >
                  Stories ({items.filter((i) => i.type === "story").length})
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => selectAll("task")}
                >
                  Tasks ({items.filter((i) => i.type === "task").length})
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => selectAll("test")}
                >
                  Tests ({items.filter((i) => i.type === "test").length})
                </Badge>
              </div>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-2 rounded cursor-pointer hover:bg-muted/50 ${
                        item.selected ? "bg-primary/5" : ""
                      }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox checked={item.selected} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{item.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No items available to push
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === "configure" && (
          <div className="flex-1 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {target === "jira" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Key</Label>
                  {jiraStatus?.projects && jiraStatus.projects.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {jiraStatus.projects.map((proj) => (
                        <Badge
                          key={proj}
                          variant={jiraProject === proj ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setJiraProject(proj)}
                        >
                          {proj}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Input
                      value={jiraProject}
                      onChange={(e) => setJiraProject(e.target.value)}
                      placeholder="PROJ"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Issue Type</Label>
                  <div className="flex gap-2">
                    {["Story", "Task", "Bug"].map((type) => (
                      <Badge
                        key={type}
                        variant={jiraIssueType === type ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setJiraIssueType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {target === "github" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Repository</Label>
                  {githubStatus?.repos && githubStatus.repos.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {githubStatus.repos.map((repo) => {
                        const [owner, name] = repo.split("/");
                        const isSelected = githubOwner === owner && githubRepo === name;
                        return (
                          <Badge
                            key={repo}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setGithubOwner(owner);
                              setGithubRepo(name);
                            }}
                          >
                            {repo}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={githubOwner}
                        onChange={(e) => setGithubOwner(e.target.value)}
                        placeholder="owner"
                      />
                      <Input
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="repo"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm font-medium mb-2">Push Summary</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Items to create: {selectedCount}</div>
                <div>
                  Target: {target === "jira" ? `Jira (${jiraProject})` : `GitHub (${githubOwner}/${githubRepo})`}
                </div>
                <div>Labels: ai-generated, agentic-scrum</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pushing */}
        {step === "pushing" && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <div className="text-lg font-medium mb-2">Creating Issues...</div>
            <div className="text-sm text-muted-foreground mb-4">
              Pushing {selectedCount} items to {target === "jira" ? "Jira" : "GitHub"}
            </div>
            <Progress value={progress} className="w-64" />
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <div className="flex-1 space-y-4">
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-medium">Push Complete!</div>
              <div className="text-sm text-muted-foreground">
                {successCount} created, {failedCount} failed
              </div>
            </div>

            <ScrollArea className="h-[200px] border rounded-lg p-2">
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-2 rounded ${
                      result.success ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{result.title}</span>
                        {result.issue_key && (
                          <Badge variant="outline" className="text-xs">
                            {result.issue_key}
                          </Badge>
                        )}
                        {result.issue_number && (
                          <Badge variant="outline" className="text-xs">
                            #{result.issue_number}
                          </Badge>
                        )}
                      </div>
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View issue <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {result.error && (
                        <p className="text-xs text-red-600">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="mt-4">
          {step === "select" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("configure")}
                disabled={
                  selectedCount === 0 ||
                  (target === "jira" && !jiraStatus?.connected) ||
                  (target === "github" && !githubStatus?.connected)
                }
              >
                Next: Configure
              </Button>
            </>
          )}
          {step === "configure" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handlePush} disabled={!canPush()}>
                <Upload className="h-4 w-4 mr-2" />
                Push {selectedCount} Items
              </Button>
            </>
          )}
          {step === "pushing" && (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Pushing...
            </Button>
          )}
          {step === "complete" && (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
