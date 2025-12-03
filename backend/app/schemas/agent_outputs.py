"""
Agent Output Schemas
Pydantic models for structured agent outputs
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Union, Dict, Any
from datetime import datetime


class AcceptanceCriterion(BaseModel):
    """Single acceptance criterion in GIVEN/WHEN/THEN format"""
    given: str = Field(..., description="Given context")
    when: str = Field(..., description="When action occurs")
    then: str = Field(..., description="Then expected outcome")


class UserStory(BaseModel):
    """INVEST-compliant user story"""
    id: str = Field(..., description="Story identifier (e.g., US-001)")
    title: str = Field(..., max_length=255, description="Story title")
    as_a: str = Field(..., description="User role")
    i_want: str = Field(..., description="Desired feature/capability")
    so_that: str = Field(..., description="Business value/benefit")
    acceptance_criteria: List[AcceptanceCriterion] = Field(default_factory=list)
    priority: Literal["High", "Medium", "Low"] = Field(default="Medium")
    story_points: Optional[int] = Field(None, ge=1, le=13, description="Fibonacci: 1,2,3,5,8,13")
    labels: List[str] = Field(default_factory=list)
    
    @field_validator('story_points')
    @classmethod
    def validate_fibonacci(cls, v):
        """Ensure story points follow Fibonacci sequence"""
        if v is not None and v not in [1, 2, 3, 5, 8, 13]:
            raise ValueError('Story points must be Fibonacci: 1, 2, 3, 5, 8, or 13')
        return v


class EpicVision(BaseModel):
    """Product Owner epic vision output"""
    vision: str = Field(..., min_length=50, max_length=500, description="Epic vision statement")
    scope: str = Field(..., description="Epic scope and boundaries")
    success_criteria: List[str] = Field(default_factory=list, description="Success criteria")
    user_stories: List[UserStory] = Field(default_factory=list, description="User stories for this epic")


class Task(BaseModel):
    """Sprint task breakdown"""
    id: str = Field(..., description="Task identifier (e.g., T-001)")
    title: str = Field(..., max_length=255)
    description: str
    category: Literal["Backend", "Frontend", "Security", "Testing", "DevOps", "Documentation"] = Field(default="Backend")
    estimated_hours: float = Field(..., ge=0.5, le=40, description="Estimated effort in hours")
    dependencies: List[str] = Field(default_factory=list, description="Task IDs this depends on")


class Risk(BaseModel):
    """Risk or impediment"""
    id: str = Field(..., description="Risk identifier (e.g., R-001)")
    description: str
    severity: Literal["High", "Medium", "Low"] = Field(default="Medium")
    mitigation: str = Field(..., description="Mitigation strategy")


class SprintPlan(BaseModel):
    """Scrum Master sprint plan output"""
    sprint_goal: str = Field(..., min_length=20, max_length=200, description="Sprint goal statement")
    tasks: List[Task] = Field(default_factory=list)
    risks: List[Risk] = Field(default_factory=list)
    definition_of_done: List[str] = Field(default_factory=list)
    total_estimated_hours: Optional[float] = None


class APIEndpoint(BaseModel):
    """API endpoint specification"""
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    path: str
    description: str
    request_body: Optional[str] = None
    response: Optional[str] = None


class TechnicalDesign(BaseModel):
    """Tech Lead / Architect technical design output"""
    architecture_overview: str = Field(..., description="High-level architecture description")
    technology_stack: List[str] = Field(default_factory=list)
    api_endpoints: List[APIEndpoint] = Field(default_factory=list)
    database_schema: Optional[str] = None
    security_considerations: List[str] = Field(default_factory=list)
    code_structure: Union[str, Dict[str, Any]] = Field(..., description="Folder/module structure (can be string or object)")
    implementation_notes: str = Field(..., description="Key implementation details")


class CodeFile(BaseModel):
    """Individual code file"""
    filename: str = Field(..., description="File path (e.g., src/controllers/userController.js)")
    language: str = Field(..., description="Programming language (e.g., javascript, python, typescript)")
    description: str = Field(..., description="Brief description of what this file does")
    code: str = Field(..., description="The actual code content")


class EnvironmentVariable(BaseModel):
    """Environment variable definition"""
    name: str = Field(..., description="Variable name (e.g., DATABASE_URL)")
    description: str = Field(..., description="What this variable is for")
    example: str = Field(..., description="Example value")


class Dependency(BaseModel):
    """Project dependency"""
    name: str = Field(..., description="Package name")
    version: str = Field(..., description="Version (e.g., ^4.18.0)")
    purpose: str = Field(..., description="Why this dependency is needed")


class CodeImplementation(BaseModel):
    """Developer code implementation output"""
    summary: str = Field(..., description="Brief summary of the implementation")
    code_files: List[CodeFile] = Field(default_factory=list, description="List of generated code files")
    setup_instructions: List[str] = Field(default_factory=list, description="Steps to set up and run the project")
    environment_variables: List[EnvironmentVariable] = Field(default_factory=list, description="Required env vars")
    dependencies: List[Dependency] = Field(default_factory=list, description="Project dependencies")


class TestCase(BaseModel):
    """Individual test case"""
    id: str = Field(..., description="Test case identifier (e.g., TC-001)")
    title: str = Field(..., max_length=255)
    description: str
    test_type: Literal["Unit", "Integration", "E2E", "Performance", "Security"] = Field(default="Integration")
    preconditions: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    expected_result: str
    priority: Literal["High", "Medium", "Low"] = Field(default="Medium")


class TestSuite(BaseModel):
    """QA Engineer test suite output"""
    test_strategy: str = Field(..., description="Overall testing strategy")
    test_cases: List[TestCase] = Field(default_factory=list)
    test_data_requirements: List[str] = Field(default_factory=list)
    automation_approach: str = Field(..., description="Automation framework and approach")
    coverage_goals: Optional[str] = None


class ExecutiveSummary(BaseModel):
    """Release Manager executive summary output"""
    summary: str = Field(..., min_length=100, max_length=1000, description="Executive summary")
    scope_overview: str = Field(..., description="Scope and deliverables overview")
    key_risks: List[str] = Field(default_factory=list)
    test_readiness: str = Field(..., description="Test readiness assessment")
    recommendations: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)


class StructuredAgentOutput(BaseModel):
    """Complete structured output from all agents"""
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    context: dict = Field(default_factory=dict, description="User-provided context")
    
    # Agent outputs
    epic_vision: Optional[EpicVision] = None
    sprint_plan: Optional[SprintPlan] = None
    technical_design: Optional[TechnicalDesign] = None
    code_implementation: Optional[CodeImplementation] = None
    test_suite: Optional[TestSuite] = None
    executive_summary: Optional[ExecutiveSummary] = None
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return self.model_dump(exclude_none=True)
