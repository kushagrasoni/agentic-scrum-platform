/**
 * TestCaseCard Component
 * Displays test cases with steps, preconditions, and expected results
 */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  ChevronDown, 
  ChevronRight,
  CheckSquare,
  Target,
  ListOrdered,
  RefreshCw,
  Loader2,
  Eye
} from 'lucide-react';
import type { TestCase } from '@/types/agent-outputs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface TestCaseCardProps {
  testCase: TestCase;
  onRegenerate?: (testId: string) => void;
  onPreview?: (testCase: TestCase) => void;
  isRegenerating?: boolean;
  compact?: boolean;
}

export function TestCaseCard({ testCase, onRegenerate, onPreview, isRegenerating = false, compact = false }: TestCaseCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getTestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Unit': 'bg-green-100 text-green-800 border-green-300',
      'Integration': 'bg-blue-100 text-blue-800 border-blue-300',
      'E2E': 'bg-purple-100 text-purple-800 border-purple-300',
      'Performance': 'bg-orange-100 text-orange-800 border-orange-300',
      'Security': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
        <Badge variant="outline" className="font-mono text-xs">
          {testCase.id}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{testCase.title}</p>
          <p className="text-xs text-muted-foreground truncate">{testCase.description}</p>
        </div>
        <Badge className={getTestTypeColor(testCase.test_type)}>
          {testCase.test_type}
        </Badge>
        <Badge className={getPriorityColor(testCase.priority)}>
          {testCase.priority}
        </Badge>
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
                {testCase.id}
              </Badge>
              <Badge className={getTestTypeColor(testCase.test_type)}>
                <TestTube className="h-3 w-3 mr-1" />
                {testCase.test_type}
              </Badge>
              <Badge className={getPriorityColor(testCase.priority)}>
                {testCase.priority}
              </Badge>
            </div>
            <CardTitle className="text-base leading-tight">{testCase.title}</CardTitle>
          </div>
          <div className="flex gap-1">
            {onPreview && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onPreview(testCase)}
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
                onClick={() => onRegenerate(testCase.id)}
                disabled={isRegenerating}
                className="h-8 w-8 p-0"
                title="Regenerate this test case"
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {testCase.description}
        </p>

        {/* Preconditions */}
        {testCase.preconditions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Preconditions</span>
            </div>
            <ul className="space-y-1 pl-6 list-disc marker:text-muted-foreground">
              {testCase.preconditions.map((condition, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Test Steps */}
        {testCase.steps.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <ListOrdered className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Test Steps ({testCase.steps.length})</span>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ol className="space-y-2 pl-6 list-decimal marker:text-muted-foreground marker:font-medium">
                {testCase.steps.map((step, index) => (
                  <li key={index} className="text-sm text-muted-foreground pl-2">
                    {step}
                  </li>
                ))}
              </ol>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Expected Result */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Expected Result</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
            {testCase.expected_result}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TestCaseListProps {
  testCases: TestCase[];
  filterByType?: string;
  filterByPriority?: string;
  onRegenerateTest?: (testCase: TestCase) => void;
  onPreviewTest?: (testCase: TestCase) => void;
  regeneratingTestId?: string | null;
}

export function TestCaseList({ testCases, filterByType, filterByPriority, onRegenerateTest, onPreviewTest, regeneratingTestId }: TestCaseListProps) {
  const filteredCases = testCases.filter(tc => {
    if (filterByType && tc.test_type !== filterByType) return false;
    if (filterByPriority && tc.priority !== filterByPriority) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {filteredCases.map((testCase) => (
        <TestCaseCard 
          key={testCase.id} 
          testCase={testCase}
          onRegenerate={onRegenerateTest ? () => onRegenerateTest(testCase) : undefined}
          onPreview={onPreviewTest ? () => onPreviewTest(testCase) : undefined}
          isRegenerating={regeneratingTestId === testCase.id}
        />
      ))}
    </div>
  );
}
