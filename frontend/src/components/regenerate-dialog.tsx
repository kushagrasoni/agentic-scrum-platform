'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'story' | 'task' | 'test';
  itemId: string;
  itemTitle: string;
  itemSummary?: string;
  onRegenerate: (feedback: string) => void;
  isRegenerating?: boolean;
}

const SUGGESTION_CHIPS: Record<string, string[]> = {
  story: [
    'More detailed acceptance criteria',
    'Simplify the scope',
    'Add edge cases',
    'Focus on user value',
    'Include non-functional requirements',
  ],
  task: [
    'Break into smaller tasks',
    'Add more technical details',
    'Include testing considerations',
    'Clarify dependencies',
    'Estimate more accurately',
  ],
  test: [
    'Add more test cases',
    'Include negative scenarios',
    'Add performance tests',
    'Cover edge cases',
    'Simplify test steps',
  ],
};

export function RegenerateDialog({
  open,
  onOpenChange,
  itemType,
  itemId,
  itemTitle,
  itemSummary,
  onRegenerate,
  isRegenerating = false,
}: RegenerateDialogProps) {
  const [feedback, setFeedback] = useState('');

  const handleRegenerate = () => {
    onRegenerate(feedback);
    // Don't close dialog - let parent handle it after regeneration completes
  };

  const handleChipClick = (suggestion: string) => {
    setFeedback((prev) => {
      if (prev.trim()) {
        return `${prev.trim()}. ${suggestion}`;
      }
      return suggestion;
    });
  };

  const handleClose = (newOpen: boolean) => {
    if (!isRegenerating) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setFeedback('');
      }
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'story':
        return 'User Story';
      case 'task':
        return 'Task';
      case 'test':
        return 'Test Case';
      default:
        return 'Item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Regenerate {getItemTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Provide feedback to guide the AI in improving this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Item Summary */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-xs">
                {itemId}
              </Badge>
            </div>
            <p className="font-medium text-sm">{itemTitle}</p>
            {itemSummary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {itemSummary}
              </p>
            )}
          </div>

          {/* Feedback Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What would you like to change? (optional)
            </label>
            <Textarea
              placeholder="e.g., Add more specific acceptance criteria, focus on security aspects, break down into smaller pieces..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isRegenerating}
            />
          </div>

          {/* Suggestion Chips */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Quick suggestions
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CHIPS[itemType].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleChipClick(suggestion)}
                  disabled={isRegenerating}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="gap-2"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
