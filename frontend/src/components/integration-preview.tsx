"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, ExternalLink, Tag } from "lucide-react";
import type { UserStory, Task, TestCase } from "@/types/agent-outputs";

// ============================================================================
// Jira Preview Component
// ============================================================================

interface JiraPreviewProps {
  story: UserStory;
  projectKey?: string;
}

export function JiraPreview({ story, projectKey = "PROJ" }: JiraPreviewProps) {
  // Compute validation warnings
  const warnings: string[] = [];
  if (story.title.length > 255) warnings.push("Title exceeds 255 characters");
  if (!story.as_a || !story.i_want || !story.so_that) warnings.push("Missing story format");
  if (story.acceptance_criteria.length === 0) warnings.push("No acceptance criteria");

  const issueKey = `${projectKey}-${story.id.replace(/\D/g, "") || "XXX"}`;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      {/* Jira Header */}
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-600" fill="currentColor">
              <path d="M11.571 11.513H0l5.785 5.786 5.786-5.786zm0 0l-5.786 5.786L11.571 23.3l5.786-5.785-5.786-5.786v-.216zm0 0L5.785 5.727 0 11.513h11.571zm0 0l5.786-5.786L11.571 0 5.785 5.727l5.786 5.786z"/>
            </svg>
            <span className="text-xs font-medium text-blue-600">Jira Preview</span>
          </div>
          {warnings.length === 0 ? (
            <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {warnings.length} warning{warnings.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-4 space-y-3">
        {/* Issue Key & Type */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
            {issueKey}
          </span>
          <span className="text-xs text-muted-foreground">Story</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-tight">{story.title}</h3>

        {/* Description */}
        <div className="text-sm space-y-2 bg-gray-50 p-3 rounded border">
          <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Description</div>
          {story.as_a && story.i_want && story.so_that ? (
            <p className="text-muted-foreground">
              <strong>As a</strong> {story.as_a}, <strong>I want</strong> {story.i_want}, <strong>so that</strong> {story.so_that}
            </p>
          ) : (
            <p className="text-muted-foreground italic">No description provided</p>
          )}
        </div>

        {/* Acceptance Criteria */}
        {story.acceptance_criteria.length > 0 && (
          <div className="text-sm space-y-2">
            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
              Acceptance Criteria
            </div>
            <ul className="space-y-1 text-muted-foreground">
              {story.acceptance_criteria.map((ac, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-600 font-mono text-xs mt-0.5">{idx + 1}.</span>
                  <span className="text-xs">
                    <strong>Given</strong> {ac.given}, <strong>when</strong> {ac.when}, <strong>then</strong> {ac.then}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata Row */}
        <div className="flex items-center gap-4 pt-2 border-t text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Priority:</span>
            <Badge 
              variant="outline" 
              className={
                story.priority === "High" ? "text-red-600 border-red-300" :
                story.priority === "Medium" ? "text-yellow-600 border-yellow-300" :
                "text-green-600 border-green-300"
              }
            >
              {story.priority}
            </Badge>
          </div>
          {story.story_points && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Points:</span>
              <Badge variant="secondary">{story.story_points}</Badge>
            </div>
          )}
        </div>

        {/* Labels */}
        {story.labels && story.labels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {story.labels.map((label, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                {label}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
              ai-generated
            </Badge>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
            <div className="font-medium text-yellow-800 mb-1">Compatibility Warnings:</div>
            <ul className="text-yellow-700 space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>- {w}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// ============================================================================
// GitHub Preview Component
// ============================================================================

interface GitHubPreviewProps {
  story: UserStory;
  owner?: string;
  repo?: string;
}

export function GitHubPreview({ story, owner = "org", repo = "project" }: GitHubPreviewProps) {
  // Compute validation warnings
  const warnings: string[] = [];
  if (story.title.length > 256) warnings.push("Title exceeds 256 characters");
  
  const issueNumber = parseInt(story.id.replace(/\D/g, "")) || 123;

  return (
    <Card className="border-gray-300 bg-white">
      {/* GitHub Header */}
      <CardHeader className="pb-2 pt-3 px-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="text-xs font-medium">GitHub Issue Preview</span>
          </div>
          {warnings.length === 0 ? (
            <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {warnings.length} warning{warnings.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Issue Title */}
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base leading-tight hover:text-blue-600 cursor-pointer">
              {story.title}
            </h3>
            <div className="text-xs text-muted-foreground mt-1">
              #{issueNumber} opened by ai-agent
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="text-sm bg-gray-50 p-3 rounded border font-mono text-xs">
          <div className="space-y-2">
            <div>
              <span className="font-bold">## User Story</span>
            </div>
            {story.as_a && story.i_want && story.so_that ? (
              <>
                <div>**As a** {story.as_a}</div>
                <div>**I want** {story.i_want}</div>
                <div>**So that** {story.so_that}</div>
              </>
            ) : (
              <div className="text-muted-foreground italic">No story format provided</div>
            )}
            
            {story.acceptance_criteria.length > 0 && (
              <>
                <div className="pt-2">
                  <span className="font-bold">## Acceptance Criteria</span>
                </div>
                {story.acceptance_criteria.map((ac, idx) => (
                  <div key={idx}>
                    - [ ] Given {ac.given}, when {ac.when}, then {ac.then}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Labels */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
            user-story
          </Badge>
          {story.priority === "High" && (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">
              priority: high
            </Badge>
          )}
          {story.priority === "Medium" && (
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
              priority: medium
            </Badge>
          )}
          {story.priority === "Low" && (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">
              priority: low
            </Badge>
          )}
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
            ai-generated
          </Badge>
          {story.labels?.slice(0, 2).map((label, idx) => (
            <Badge key={idx} className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs">
              {label}
            </Badge>
          ))}
        </div>

        {/* Repo info */}
        <div className="text-xs text-muted-foreground pt-2 border-t flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          <span>{owner}/{repo}</span>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
            <div className="font-medium text-yellow-800 mb-1">Compatibility Warnings:</div>
            <ul className="text-yellow-700 space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>- {w}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// ============================================================================
// Preview Panel Component (combines both)
// ============================================================================

type PreviewTarget = "jira" | "github";

interface PreviewPanelProps {
  story: UserStory;
  target: PreviewTarget;
  projectKey?: string;
  owner?: string;
  repo?: string;
}

export function PreviewPanel({ story, target, projectKey, owner, repo }: PreviewPanelProps) {
  if (target === "jira") {
    return <JiraPreview story={story} projectKey={projectKey} />;
  }
  return <GitHubPreview story={story} owner={owner} repo={repo} />;
}
