/**
 * StoryCard Component
 * Displays user stories with inline editing and validation badges
 */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Edit2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Target,
  Star,
  Tag,
  RefreshCw,
  Loader2,
  Upload,
  AlertTriangle,
  Eye
} from 'lucide-react';
import type { UserStory, AcceptanceCriterion, StoryValidation } from '@/types/agent-outputs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StoryCardProps {
  story: UserStory;
  validation?: StoryValidation;
  onUpdate?: (story: UserStory) => void;
  onRegenerate?: (storyId: string) => void;
  onPreview?: (story: UserStory) => void;
  isRegenerating?: boolean;
  readOnly?: boolean;
}

export function StoryCard({ story, validation, onUpdate, onRegenerate, onPreview, isRegenerating = false, readOnly = false }: StoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState<UserStory>(story);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedStory);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedStory(story);
    setIsEditing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getValidationIcon = () => {
    if (!validation) return null;
    
    switch (validation.status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  // Compute export readiness
  const getExportReadiness = () => {
    const checks = {
      hasTitle: !!story.title && story.title.length >= 5,
      hasPriority: !!story.priority,
      hasAcceptanceCriteria: story.acceptance_criteria && story.acceptance_criteria.length > 0,
      hasStoryFormat: !!(story.as_a && story.i_want && story.so_that),
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const percentage = Math.round((passedChecks / totalChecks) * 100);
    
    return { checks, passedChecks, totalChecks, percentage };
  };

  const exportReadiness = getExportReadiness();

  const getExportBadgeVariant = () => {
    if (exportReadiness.percentage === 100) return "default";
    if (exportReadiness.percentage >= 75) return "secondary";
    if (exportReadiness.percentage >= 50) return "outline";
    return "destructive";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                {story.id}
              </Badge>
              {validation && getValidationIcon()}
              <Badge className={getPriorityColor(story.priority)}>
                {story.priority}
              </Badge>
              {story.story_points && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {story.story_points}
                </Badge>
              )}
              {/* Export Readiness Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={getExportBadgeVariant()} 
                      className="flex items-center gap-1 cursor-help"
                    >
                      {exportReadiness.percentage === 100 ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : exportReadiness.percentage >= 50 ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {exportReadiness.percentage}% Ready
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="text-xs space-y-1">
                      <div className="font-medium">Export Readiness Checks:</div>
                      <div className={exportReadiness.checks.hasTitle ? "text-green-600" : "text-red-600"}>
                        {exportReadiness.checks.hasTitle ? "[OK]" : "[X]"} Title (5+ chars)
                      </div>
                      <div className={exportReadiness.checks.hasPriority ? "text-green-600" : "text-red-600"}>
                        {exportReadiness.checks.hasPriority ? "[OK]" : "[X]"} Priority set
                      </div>
                      <div className={exportReadiness.checks.hasAcceptanceCriteria ? "text-green-600" : "text-red-600"}>
                        {exportReadiness.checks.hasAcceptanceCriteria ? "[OK]" : "[X]"} Acceptance criteria
                      </div>
                      <div className={exportReadiness.checks.hasStoryFormat ? "text-green-600" : "text-red-600"}>
                        {exportReadiness.checks.hasStoryFormat ? "[OK]" : "[X]"} Story format (As/I want/So that)
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {isEditing ? (
              <Input
                value={editedStory.title}
                onChange={(e) => setEditedStory({ ...editedStory, title: e.target.value })}
                className="font-semibold text-base"
                placeholder="Story title"
              />
            ) : (
              <CardTitle className="text-base leading-tight">{story.title}</CardTitle>
            )}
          </div>

          {!readOnly && (
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0" title="Edit story">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {onPreview && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onPreview(story)}
                      className="h-8 w-8 p-0"
                      title="Preview in Jira/GitHub"
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  {onRegenerate && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onRegenerate(story.id)}
                      disabled={isRegenerating}
                      className="h-8 w-8 p-0"
                      title="Regenerate this story"
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Story Format */}
        <div className="space-y-2 text-sm">
          {isEditing ? (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">As a</Label>
                <Input
                  value={editedStory.as_a}
                  onChange={(e) => setEditedStory({ ...editedStory, as_a: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">I want</Label>
                <Textarea
                  value={editedStory.i_want}
                  onChange={(e) => setEditedStory({ ...editedStory, i_want: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">So that</Label>
                <Textarea
                  value={editedStory.so_that}
                  onChange={(e) => setEditedStory({ ...editedStory, so_that: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              {story.as_a && (
                <p>
                  <span className="font-medium text-muted-foreground">As a</span>{' '}
                  <span className="text-foreground">{story.as_a}</span>
                </p>
              )}
              {story.i_want && (
                <p>
                  <span className="font-medium text-muted-foreground">I want</span>{' '}
                  <span className="text-foreground">{story.i_want}</span>
                </p>
              )}
              {story.so_that && (
                <p>
                  <span className="font-medium text-muted-foreground">So that</span>{' '}
                  <span className="text-foreground">{story.so_that}</span>
                </p>
              )}
              {/* Show fallback message if no story format */}
              {!story.as_a && !story.i_want && !story.so_that && (
                <p className="text-muted-foreground italic">No story format defined</p>
              )}
            </>
          )}
        </div>

        {/* Acceptance Criteria */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Acceptance Criteria</Label>
          </div>
          <div className="space-y-2 pl-6">
            {story.acceptance_criteria.map((criterion, index) => (
              <div key={index} className="text-sm space-y-1 border-l-2 border-blue-200 pl-3">
                {criterion.given && (
                  <p>
                    <span className="font-medium text-blue-600">Given</span>{' '}
                    <span className="text-muted-foreground">{criterion.given}</span>
                  </p>
                )}
                {criterion.when && (
                  <p>
                    <span className="font-medium text-purple-600">When</span>{' '}
                    <span className="text-muted-foreground">{criterion.when}</span>
                  </p>
                )}
                {criterion.then && (
                  <p>
                    <span className="font-medium text-green-600">Then</span>{' '}
                    <span className="text-muted-foreground">{criterion.then}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Labels */}
        {story.labels && story.labels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {story.labels.map((label, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Validation Issues */}
        {validation && validation.issues.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">Validation Issues</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {validation.issues.map((issue, index) => (
                    <li key={index}>- {issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
