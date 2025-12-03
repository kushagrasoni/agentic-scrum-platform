"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Tag,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import type { UserStory, Task, TestCase } from "@/types/agent-outputs";

// ============================================================================
// Types
// ============================================================================

type PreviewTarget = "jira" | "github";
type ItemType = "story" | "task" | "test";

interface PreviewItem {
  type: ItemType;
  data: UserStory | Task | TestCase;
}

// ============================================================================
// Jira Icons & Styling
// ============================================================================

const JiraIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.571 11.513H0l5.785 5.786 5.786-5.786zm0 0l-5.786 5.786L11.571 23.3l5.786-5.785-5.786-5.786v-.216zm0 0L5.785 5.727 0 11.513h11.571zm0 0l5.786-5.786L11.571 0 5.785 5.727l5.786 5.786z"/>
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const getIssueTypeIcon = (type: ItemType) => {
  switch (type) {
    case "story":
      return <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center"><span className="text-white text-[10px] font-bold">S</span></div>;
    case "task":
      return <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center"><span className="text-white text-[10px] font-bold">T</span></div>;
    case "test":
      return <div className="w-4 h-4 bg-purple-500 rounded-sm flex items-center justify-center"><span className="text-white text-[10px] font-bold">TC</span></div>;
  }
};

// ============================================================================
// Jira Preview Component
// ============================================================================

interface JiraPreviewContentProps {
  item: PreviewItem;
}

function JiraPreviewContent({ item }: JiraPreviewContentProps) {
  const { type, data } = item;
  
  // Get common fields - keep original ID (Jira will generate new ID on import)
  const getId = () => {
    if ("id" in data) return data.id;
    return "XXX";
  };
  
  const getTitle = () => {
    if ("title" in data) return data.title;
    return "Untitled";
  };
  
  const getPriority = () => {
    if ("priority" in data) return data.priority;
    return "Medium";
  };

  const issueKey = getId();

  // Validation warnings
  const warnings: string[] = [];
  const title = getTitle();
  if (title.length > 255) warnings.push("Title exceeds 255 characters");
  
  if (type === "story") {
    const story = data as UserStory;
    if (!story.as_a || !story.i_want || !story.so_that) warnings.push("Missing story format (As a/I want/So that)");
    if (!story.acceptance_criteria || story.acceptance_criteria.length === 0) warnings.push("No acceptance criteria");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {getIssueTypeIcon(type)}
        <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
          {issueKey}
        </span>
        <Badge variant="outline" className="text-xs capitalize">{type}</Badge>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg leading-tight">{title}</h3>

      {/* Description based on type */}
      <div className="text-sm space-y-2 bg-gray-50 p-3 rounded border">
        <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Description</div>
        
        {type === "story" && (() => {
          const story = data as UserStory;
          return story.as_a && story.i_want && story.so_that ? (
            <p className="text-muted-foreground">
              <strong>As a</strong> {story.as_a}, <strong>I want</strong> {story.i_want}, <strong>so that</strong> {story.so_that}
            </p>
          ) : (
            <p className="text-muted-foreground italic">No description provided</p>
          );
        })()}
        
        {type === "task" && (() => {
          const task = data as Task;
          return <p className="text-muted-foreground">{task.description || "No description"}</p>;
        })()}
        
        {type === "test" && (() => {
          const test = data as TestCase;
          return <p className="text-muted-foreground">{test.description || "No description"}</p>;
        })()}
      </div>

      {/* Type-specific content */}
      {type === "story" && (() => {
        const story = data as UserStory;
        return story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
          <div className="text-sm space-y-2">
            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
              Acceptance Criteria ({story.acceptance_criteria.length})
            </div>
            <ul className="space-y-1 text-muted-foreground">
              {story.acceptance_criteria.map((ac, idx) => (
                <li key={idx} className="flex gap-2 text-xs">
                  <span className="text-green-600 font-mono">{idx + 1}.</span>
                  <span>
                    <strong>Given</strong> {ac.given}, <strong>when</strong> {ac.when}, <strong>then</strong> {ac.then}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
      
      {type === "task" && (() => {
        const task = data as Task;
        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Category:</span>
              <Badge variant="outline" className="ml-2">{task.category}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Estimate:</span>
              <Badge variant="secondary" className="ml-2">{task.estimated_hours}h</Badge>
            </div>
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Dependencies:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {task.dependencies.map((dep, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{dep}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
      
      {type === "test" && (() => {
        const test = data as TestCase;
        return (
          <div className="space-y-3 text-sm">
            {test.steps && test.steps.length > 0 && (
              <div>
                <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Test Steps ({test.steps.length})
                </div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                  {test.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className="flex gap-4">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2">{test.test_type}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant="outline" className="ml-2">{test.priority}</Badge>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Metadata Row */}
      <div className="flex items-center gap-4 pt-2 border-t text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Priority:</span>
          <Badge 
            variant="outline" 
            className={
              getPriority() === "High" ? "text-red-600 border-red-300" :
              getPriority() === "Medium" ? "text-yellow-600 border-yellow-300" :
              "text-green-600 border-green-300"
            }
          >
            {getPriority()}
          </Badge>
        </div>
        {type === "story" && (data as UserStory).story_points && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Points:</span>
            <Badge variant="secondary">{(data as UserStory).story_points}</Badge>
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="h-3 w-3 text-muted-foreground" />
        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
          ai-generated
        </Badge>
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
          {type}
        </Badge>
        {type === "story" && (data as UserStory).labels?.slice(0, 3).map((label, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">{label}</Badge>
        ))}
      </div>

      {/* Validation Status */}
      <div className={`rounded-lg p-3 ${warnings.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        {warnings.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ready for Jira import</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>{warnings.length} issue{warnings.length > 1 ? 's' : ''} to review</span>
            </div>
            <ul className="text-xs text-yellow-700 space-y-1 ml-6">
              {warnings.map((w, idx) => (
                <li key={idx}>- {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// GitHub Preview Component
// ============================================================================

interface GitHubPreviewContentProps {
  item: PreviewItem;
  owner?: string;
  repo?: string;
}

function GitHubPreviewContent({ item, owner = "org", repo = "project" }: GitHubPreviewContentProps) {
  const { type, data } = item;
  
  const getId = () => {
    if ("id" in data) return data.id;
    return "XXX";
  };
  
  const getTitle = () => {
    if ("title" in data) return data.title;
    return "Untitled";
  };

  const issueNumber = parseInt(getId().replace(/\D/g, "")) || 123;
  const title = getTitle();

  // Validation
  const warnings: string[] = [];
  if (title.length > 256) warnings.push("Title exceeds 256 characters");

  // Build markdown body
  const buildBody = () => {
    const lines: string[] = [];
    
    if (type === "story") {
      const story = data as UserStory;
      lines.push("## User Story");
      if (story.as_a && story.i_want && story.so_that) {
        lines.push(`**As a** ${story.as_a}`);
        lines.push(`**I want** ${story.i_want}`);
        lines.push(`**So that** ${story.so_that}`);
      }
      if (story.acceptance_criteria && story.acceptance_criteria.length > 0) {
        lines.push("");
        lines.push("## Acceptance Criteria");
        story.acceptance_criteria.forEach((ac) => {
          lines.push(`- [ ] Given ${ac.given}, when ${ac.when}, then ${ac.then}`);
        });
      }
    } else if (type === "task") {
      const task = data as Task;
      lines.push("## Task");
      lines.push(task.description || "No description");
      lines.push("");
      lines.push(`**Category:** ${task.category}`);
      lines.push(`**Estimate:** ${task.estimated_hours}h`);
    } else if (type === "test") {
      const test = data as TestCase;
      lines.push("## Test Case");
      lines.push(test.description || "No description");
      if (test.steps && test.steps.length > 0) {
        lines.push("");
        lines.push("### Steps");
        test.steps.forEach((step, idx) => {
          lines.push(`${idx + 1}. ${step}`);
        });
      }
      if (test.expected_result) {
        lines.push("");
        lines.push(`**Expected Result:** ${test.expected_result}`);
      }
    }
    
    return lines;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg leading-tight hover:text-blue-600 cursor-pointer">
            {title}
          </h3>
          <div className="text-xs text-muted-foreground mt-1">
            #{issueNumber} opened by ai-agent
          </div>
        </div>
      </div>

      {/* Body (Markdown preview) */}
      <div className="text-sm bg-gray-50 p-3 rounded border font-mono text-xs space-y-1">
        {buildBody().map((line, idx) => (
          <div key={idx} className={line.startsWith("##") ? "font-bold pt-2" : ""}>
            {line || <br />}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
          {type}
        </Badge>
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
          ai-generated
        </Badge>
        {type === "story" && (data as UserStory).priority === "High" && (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">
            priority: high
          </Badge>
        )}
      </div>

      {/* Repo info */}
      <div className="text-xs text-muted-foreground pt-2 border-t flex items-center gap-1">
        <ExternalLink className="h-3 w-3" />
        <span>{owner}/{repo}/issues/{issueNumber}</span>
      </div>

      {/* Validation Status */}
      <div className={`rounded-lg p-3 ${warnings.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        {warnings.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ready for GitHub import</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>{warnings.length} issue{warnings.length > 1 ? 's' : ''} to review</span>
            </div>
            <ul className="text-xs text-yellow-700 space-y-1 ml-6">
              {warnings.map((w, idx) => (
                <li key={idx}>- {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Preview Panel Component (Sheet/Drawer)
// ============================================================================

interface PreviewPanelProps {
  items: PreviewItem[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  initialTarget?: PreviewTarget;
}

export function PreviewPanel({
  items,
  isOpen,
  onClose,
  initialIndex = 0,
  initialTarget = "jira",
}: PreviewPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [target, setTarget] = useState<PreviewTarget>(initialTarget);
  
  // Reset index when items change or panel opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const currentItem = items[currentIndex];
  
  const goNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] sm:max-w-[600px] lg:w-[650px] lg:max-w-[650px] flex flex-col h-full">
        {/* Visually hidden title for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Integration Preview</SheetTitle>
          <SheetDescription>Preview how items will appear when exported to Jira or GitHub</SheetDescription>
        </SheetHeader>
        
        {/* Header with Title on left, Toggle centered, space on right for close button */}
        <div className="grid grid-cols-3 items-center flex-shrink-0 pt-2 pb-2 pr-8 border-b">
          <div className="flex items-center gap-2 pl-1">
            <Eye className="h-5 w-5" />
            <span className="font-semibold">Integration Preview</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={target === "jira" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTarget("jira")}
                className="h-7 px-2 gap-1 text-xs"
              >
                <JiraIcon className="h-3 w-3" />
                Jira
              </Button>
              <Button
                variant={target === "github" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTarget("github")}
                className="h-7 px-2 gap-1 text-xs"
              >
                <GitHubIcon className="h-3 w-3" />
                GitHub
              </Button>
            </div>
          </div>
          <div></div>
        </div>

        {/* Navigation */}
        {items.length > 1 && (
          <div className="flex items-center justify-between py-1 border-b flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} of {items.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              disabled={currentIndex === items.length - 1}
              className="h-7 px-2 text-xs"
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden mt-2 mb-2">
          <ScrollArea className="h-full pr-4">
            {currentItem ? (
              <Card className="border-2 mb-4">
                <CardHeader className="py-2 px-2 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {target === "jira" ? (
                        <JiraIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <GitHubIcon className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium">
                        {target === "jira" ? "Jira Issue Preview" : "GitHub Issue Preview"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {currentItem.type}
                    </Badge>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-4">
                  {target === "jira" ? (
                    <JiraPreviewContent item={currentItem} />
                  ) : (
                    <GitHubPreviewContent item={currentItem} />
                  )}
                </CardContent>
                <Separator />
                {/* Push Action Footer */}
                <div className="p-3 bg-muted/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Ready to push this {currentItem.type} to {target === "jira" ? "Jira" : "GitHub"}?
                  </span>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      // TODO: Implement actual push logic
                      alert(`Push to ${target === "jira" ? "Jira" : "GitHub"} - Feature coming soon!\n\nThis will create a ${currentItem.type} in your ${target === "jira" ? "Jira project" : "GitHub repository"}.`);
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Push to {target === "jira" ? "Jira" : "GitHub"}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No item selected
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Preview Button (to be used in cards)
// ============================================================================

interface PreviewButtonProps {
  onClick: () => void;
  className?: string;
}

export function PreviewButton({ onClick, className }: PreviewButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-8 gap-1 ${className}`}
      title="Preview in Jira/GitHub"
    >
      <Eye className="h-4 w-4" />
      Preview
    </Button>
  );
}
