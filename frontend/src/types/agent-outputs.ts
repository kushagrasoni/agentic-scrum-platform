/**
 * Structured Agent Output Types
 * Matches backend Pydantic schemas
 */

// Product Owner Output Types
export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

export interface UserStory {
  id: string;
  title: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria: AcceptanceCriterion[];
  priority: 'High' | 'Medium' | 'Low';
  story_points?: number;
  labels: string[];
}

export interface EpicVision {
  vision: string;
  scope: string;
  success_criteria: string[];
  user_stories: UserStory[];
}

// Scrum Master Output Types
export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_hours: number;
  dependencies: string[];
}

export interface Risk {
  id: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface SprintPlan {
  sprint_goal: string;
  tasks: Task[];
  risks: Risk[];
  definition_of_done: string[];
  total_estimated_hours?: number;
}

// Developer Output Types
export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  request_body?: string;
  response?: string;
}

export interface TechnicalDesign {
  architecture_overview: string;
  technology_stack: string[];
  api_endpoints: APIEndpoint[];
  database_schema?: string;
  security_considerations: string[];
  code_structure: string | Record<string, any>;
  implementation_notes: string;
}

// Developer Code Output Types
export interface CodeFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export interface EnvironmentVariable {
  name: string;
  description: string;
  example: string;
}

export interface Dependency {
  name: string;
  version: string;
  purpose: string;
}

export interface CodeImplementation {
  summary: string;
  code_files: CodeFile[];
  setup_instructions: string[];
  environment_variables: EnvironmentVariable[];
  dependencies: Dependency[];
}

// QA Engineer Output Types
export interface TestCase {
  id: string;
  title: string;
  description: string;
  test_type: 'Unit' | 'Integration' | 'E2E' | 'Performance' | 'Security';
  preconditions: string[];
  steps: string[];
  expected_result: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface TestSuite {
  test_strategy: string;
  test_cases: TestCase[];
  test_data_requirements: string[];
  automation_approach: string;
  coverage_goals?: string;
}

// Release Manager Output Types
export interface ExecutiveSummary {
  summary: string;
  scope_overview: string;
  key_risks: string[];
  test_readiness: string;
  recommendations: string[];
  next_steps?: string[];
}

// Combined Structured Output
export interface StructuredAgentOutput {
  session_id: string;
  epic_vision?: EpicVision;
  sprint_plan?: SprintPlan;
  technical_design?: TechnicalDesign;
  code_implementation?: CodeImplementation;
  test_suite?: TestSuite;
  executive_summary?: ExecutiveSummary;
}

// Validation Types
export interface ValidationCheck {
  jira_compatible: boolean;
  title_length: string;
  has_priority: boolean;
  has_story_points: boolean;
  has_acceptance_criteria: boolean;
}

export interface StoryValidation {
  story_id: string;
  status: 'valid' | 'warning' | 'error';
  checks: ValidationCheck;
  issues: string[];
}

export interface ValidationResult {
  validations: StoryValidation[];
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
    readiness_percentage: number;
  };
}
