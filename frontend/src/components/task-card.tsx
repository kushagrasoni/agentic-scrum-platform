/**
 * TaskCard Component
 * Displays sprint tasks with dependencies and estimated hours
 */
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Link2, Layers, RefreshCw, Loader2 } from 'lucide-react';
import type { Task } from '@/types/agent-outputs';

interface TaskCardProps {
  task: Task;
  allTasks?: Task[];
  onRegenerate?: (taskId: string) => void;
  isRegenerating?: boolean;
  compact?: boolean;
}

export function TaskCard({ task, allTasks = [], onRegenerate, isRegenerating = false, compact = false }: TaskCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Backend': 'bg-blue-100 text-blue-800 border-blue-300',
      'Frontend': 'bg-purple-100 text-purple-800 border-purple-300',
      'DevOps': 'bg-orange-100 text-orange-800 border-orange-300',
      'Testing': 'bg-green-100 text-green-800 border-green-300',
      'Documentation': 'bg-gray-100 text-gray-800 border-gray-300',
      'Database': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getDependencyNames = () => {
    if (!task.dependencies || task.dependencies.length === 0) return [];
    return task.dependencies
      .map(depId => allTasks.find(t => t.id === depId))
      .filter(Boolean) as Task[];
  };

  const dependentTasks = getDependencyNames();

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
        <Badge variant="outline" className="font-mono text-xs">
          {task.id}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{task.title}</p>
          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
        </div>
        <Badge className={getCategoryColor(task.category)}>
          {task.category}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {task.estimated_hours}h
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {task.id}
              </Badge>
              <Badge className={getCategoryColor(task.category)}>
                {task.category}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{task.estimated_hours}h</span>
              </div>
            </div>
            <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
          </div>
          {onRegenerate && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onRegenerate(task.id)}
              disabled={isRegenerating}
              className="h-8 w-8 p-0"
              title="Regenerate this task"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <RefreshCw className="h-4 w-4 text-blue-600" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {task.description}
        </p>

        {/* Dependencies */}
        {task.dependencies.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Dependencies</span>
            </div>
            <div className="space-y-1 pl-6">
              {dependentTasks.length > 0 ? (
                dependentTasks.map((depTask) => (
                  <div key={depTask.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="font-mono text-xs">
                      {depTask.id}
                    </Badge>
                    <span className="text-muted-foreground truncate">
                      {depTask.title}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  {task.dependencies.map(depId => (
                    <Badge key={depId} variant="outline" className="font-mono text-xs mr-1">
                      {depId}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskListProps {
  tasks: Task[];
  showDependencies?: boolean;
  onRegenerateTask?: (task: Task) => void;
  regeneratingTaskId?: string | null;
}

export function TaskList({ tasks, showDependencies = true, onRegenerateTask, regeneratingTaskId }: TaskListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          allTasks={showDependencies ? tasks : undefined}
          onRegenerate={onRegenerateTask ? () => onRegenerateTask(task) : undefined}
          isRegenerating={regeneratingTaskId === task.id}
        />
      ))}
    </div>
  );
}
