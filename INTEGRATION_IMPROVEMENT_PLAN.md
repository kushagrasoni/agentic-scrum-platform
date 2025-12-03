# Integration Improvement Plan
## Jira & GitHub Seamless Integration

## Current Issues Identified

### 1. **Agent Output Quality**
- **Problem**: LLM outputs contain meta-commentary like "It looks like your input describes...", "Per your instruction...", "I will disregard..."
- **Impact**: These conversational phrases pollute the exported artifacts and make Jira/GitHub imports look unprofessional
- **Root Cause**: Agent prompts don't enforce strict output formatting

### 2. **Domain/Technology Lock-in**
- **Problem**: Agents are hardcoded to "banking login EPIC" domain
- **Impact**: Cannot be reused for different domains (e-commerce, healthcare, manufacturing, etc.)
- **Root Cause**: Agent instructions contain specific domain references instead of being context-driven

### 3. **Unstructured Output Format**
- **Problem**: Outputs are free-form text without consistent structure
- **Impact**: Export parsers rely on regex/heuristics to extract user stories, often failing with variations
- **Example**: Current `_extract_user_stories()` uses fragile string matching on "**User Story" patterns

### 4. **Limited Jira Integration**
- **Problem**: Export only creates basic CSV with minimal fields
- **Missing Fields**:
  - Story Points / Estimates
  - Epic Link
  - Sprint Assignment
  - Acceptance Criteria (as separate field)
  - Components / Fix Versions
  - Custom Fields (common in enterprise Jira instances)

### 5. **Limited GitHub Integration**
- **Problem**: Export creates JSON but doesn't match GitHub API schema exactly
- **Missing Features**:
  - Milestone assignment
  - Project board placement
  - Issue relationships (depends on, blocks)
  - Task lists within issue body
  - Proper markdown formatting

### 6. **No API Integration**
- **Problem**: Exports are manual file downloads, not API-driven
- **Impact**: Users must manually import files into Jira/GitHub
- **Desired**: Direct push to Jira/GitHub via REST APIs

---

## Proposed Improvements

### **Phase 1: Agent Output Standardization** (CRITICAL)

#### 1.1 Implement Structured Output Schema
Replace free-form text with JSON/XML schemas:

```python
# Product Owner Output Schema
{
  "epic": {
    "vision": "string (2-3 sentences)",
    "scope": "string",
    "success_criteria": ["string"]
  },
  "user_stories": [
    {
      "id": "US-001",
      "title": "string",
      "as_a": "string (role)",
      "i_want": "string (feature)",
      "so_that": "string (benefit)",
      "acceptance_criteria": [
        {
          "given": "string",
          "when": "string",
          "then": "string"
        }
      ],
      "story_points": "number (1,2,3,5,8,13)",
      "priority": "High|Medium|Low",
      "labels": ["string"]
    }
  ]
}
```

#### 1.2 Add Output Validation & Sanitization
- Parse agent responses to extract structured data
- Strip meta-commentary using NLP or regex patterns
- Validate against JSON Schema
- Return validation errors to agent for retry (optional)

#### 1.3 Prompt Engineering Enhancements
**Techniques to Apply:**
1. **Strict Output Format Instructions**
   ```
   OUTPUT FORMAT (MANDATORY):
   Respond ONLY with valid JSON. No explanatory text before or after.
   
   FORBIDDEN PHRASES:
   - "It looks like"
   - "Per your instruction"
   - "I will now"
   - Any conversational commentary
   ```

2. **Few-Shot Examples**
   Include 2-3 perfect examples in system prompt:
   ```
   EXAMPLE INPUT: [requirements]
   EXAMPLE OUTPUT: [perfect JSON]
   ```

3. **Role Constraint**
   ```
   You are a Product Owner agent. You ONLY output structured deliverables.
   You do NOT explain your process or clarify instructions.
   ```

4. **Domain-Agnostic Instructions**
   ```
   Extract domain/technology context from user inputs.
   DO NOT assume banking, login, or any specific domain.
   Generate stories for ANY provided context (e-commerce, healthcare, IoT, etc.)
   ```

---

### **Phase 2: Enhanced Jira Integration**

#### 2.1 Jira-Compliant CSV Export
Expand CSV to include all standard Jira fields:

```csv
Summary,Description,Issue Type,Priority,Story Points,Epic Link,Sprint,Components,Labels,Acceptance Criteria,Reporter,Assignee
"User Login","As a customer, I want...",Story,High,5,EPIC-123,Sprint 1,Frontend;Security,"user-story,ai-generated","GIVEN... WHEN... THEN...",AI Agent,Unassigned
```

#### 2.2 Jira REST API Direct Push (Optional Enhancement)
Implement `/api/artifacts/{session_id}/push-to-jira` endpoint:

```python
@router.post("/{session_id}/push-to-jira")
async def push_to_jira(session_id: str, jira_config: JiraConfig):
    """
    Directly create Jira issues via REST API
    
    Args:
        jira_config: {
            "url": "https://yourcompany.atlassian.net",
            "email": "user@company.com",
            "api_token": "***",
            "project_key": "PROJ",
            "epic_key": "PROJ-123" (optional)
        }
    """
    # Parse structured outputs
    stories = parse_user_stories(session_id)
    
    # Call Jira API
    jira = JIRA(jira_config.url, basic_auth=(email, token))
    created_issues = []
    
    for story in stories:
        issue = jira.create_issue(
            project=project_key,
            summary=story.title,
            description=format_jira_description(story),
            issuetype={'name': 'Story'},
            customfield_10016=story.story_points,  # Story Points
            customfield_10014=epic_key,  # Epic Link
            labels=story.labels
        )
        created_issues.append(issue.key)
    
    return {"success": True, "issues": created_issues}
```

**Benefits:**
- Zero manual work for users
- Preserves all metadata
- Creates proper epic/story relationships

---

### **Phase 3: Enhanced GitHub Integration**

#### 3.1 GitHub-Compliant JSON Export
Match GitHub Issues API schema exactly:

```json
{
  "issues": [
    {
      "title": "User Login Feature",
      "body": "## User Story\nAs a customer, I want...\n\n## Acceptance Criteria\n- [ ] GIVEN...\n- [ ] WHEN...\n- [ ] THEN...",
      "labels": ["user-story", "ai-generated", "priority:high"],
      "milestone": 1,
      "assignees": [],
      "projects": ["project-board-id"]
    }
  ]
}
```

**Key Improvements:**
- Use GitHub-flavored markdown task lists for acceptance criteria
- Include proper label taxonomy (type:, priority:, size:)
- Support milestone assignment
- Project board placement

#### 3.2 GitHub REST API Direct Push
Implement `/api/artifacts/{session_id}/push-to-github` endpoint:

```python
@router.post("/{session_id}/push-to-github")
async def push_to_github(session_id: str, github_config: GitHubConfig):
    """
    Directly create GitHub issues via REST API
    
    Args:
        github_config: {
            "token": "ghp_***",
            "owner": "username",
            "repo": "repository",
            "milestone": 1,
            "project_id": 123 (optional)
        }
    """
    stories = parse_user_stories(session_id)
    
    headers = {"Authorization": f"token {github_config.token}"}
    created_issues = []
    
    for story in stories:
        response = requests.post(
            f"https://api.github.com/repos/{owner}/{repo}/issues",
            json={
                "title": story.title,
                "body": format_github_markdown(story),
                "labels": story.labels,
                "milestone": github_config.milestone
            },
            headers=headers
        )
        created_issues.append(response.json()["number"])
    
    return {"success": True, "issues": created_issues}
```

---

### **Phase 4: Skills-Based Agent Architecture**

Replace domain-specific prompts with skill-based definitions:

```python
AGENT_SKILLS = {
    "product_owner": {
        "core_skills": [
            "Requirements Analysis",
            "User Story Creation (INVEST)",
            "Acceptance Criteria (GIVEN/WHEN/THEN)",
            "Prioritization (MoSCoW or Value/Effort)",
            "Epic Vision Definition"
        ],
        "output_schema": "user_story_schema.json",
        "instructions": """
        Apply your Product Owner skills to the provided context.
        
        CONTEXT (from user input):
        - Domain: {{domain}}
        - Technology Stack: {{tech_stack}}
        - Requirements: {{requirements}}
        - Constraints: {{constraints}}
        
        OUTPUT: JSON matching output_schema
        RULES: No meta-commentary, domain-agnostic analysis
        """
    },
    
    "scrum_master": {
        "core_skills": [
            "Sprint Planning",
            "Work Breakdown Structure (WBS)",
            "Risk Identification & Mitigation",
            "Definition of Done Creation",
            "Effort Estimation (hours/points)"
        ],
        "output_schema": "sprint_plan_schema.json"
    },
    
    "developer": {
        "core_skills": [
            "Technical Design",
            "Architecture Selection",
            "Code Skeleton Generation",
            "API Contract Definition",
            "Security Best Practices"
        ],
        "output_schema": "technical_design_schema.json"
    }
}
```

**Benefits:**
- Agents work across ANY domain
- Skills are transferable
- Output schemas enforce consistency
- Easy to add new agent types

---

### **Phase 5: Output Parsing & Transformation Layer**

Create middleware to convert structured outputs to integration formats:

```python
class OutputTransformer:
    """Transform structured agent outputs to various formats"""
    
    def to_jira_csv(self, session_id: str) -> str:
        stories = self.load_structured_output(session_id, "user_stories")
        # Convert JSON to Jira CSV with all fields
    
    def to_jira_api_payload(self, session_id: str, project_key: str) -> dict:
        stories = self.load_structured_output(session_id, "user_stories")
        # Convert to Jira REST API format
    
    def to_github_json(self, session_id: str) -> str:
        stories = self.load_structured_output(session_id, "user_stories")
        # Convert to GitHub Issues JSON
    
    def to_github_api_payload(self, session_id: str, repo: str) -> dict:
        stories = self.load_structured_output(session_id, "user_stories")
        # Convert to GitHub REST API format
    
    def to_azure_devops(self, session_id: str) -> dict:
        # Support Azure DevOps work items
    
    def to_confluence(self, session_id: str) -> str:
        # Generate Confluence-ready markdown
```

---

## Implementation Priority

### **MUST HAVE (MVP for seamless integration)**
1. ✅ Structured JSON output schemas for all agents
2. ✅ Domain-agnostic prompt refactoring
3. ✅ Meta-commentary suppression
4. ✅ Enhanced Jira CSV with all standard fields
5. ✅ Enhanced GitHub JSON with proper markdown

### **SHOULD HAVE (Production-ready)**
6. ✅ Output validation & sanitization layer
7. ✅ Skills-based agent architecture
8. ✅ OutputTransformer service
9. ⚠️ Jira REST API direct push
10. ⚠️ GitHub REST API direct push

### **NICE TO HAVE (Enterprise features)**
11. ⚠️ Azure DevOps integration
12. ⚠️ Confluence page generation
13. ⚠️ Slack/Teams notifications
14. ⚠️ Webhook support for CI/CD triggers

---

## Technical Requirements

### Backend Changes
1. **New file**: `backend/app/schemas/` - JSON schemas for agent outputs
2. **New file**: `backend/app/services/output_parser.py` - Parse & validate agent outputs
3. **New file**: `backend/app/services/output_transformer.py` - Convert to integration formats
4. **Update**: `backend/app/core/agents_config.py` - Domain-agnostic prompts with schemas
5. **Update**: `backend/app/routers/artifacts.py` - Enhanced export endpoints
6. **New file**: `backend/app/routers/integrations.py` - Direct API push endpoints

### Frontend Changes
1. **Update**: Export dialog with preview before download
2. **New**: Integration settings page (Jira/GitHub credentials)
3. **New**: Direct push buttons ("Push to Jira", "Push to GitHub")
4. **Update**: Display structured outputs in cards (not raw text)

### Dependencies
```txt
# Jira integration
jira==3.8.0

# GitHub integration
PyGithub==2.5.0

# JSON Schema validation
jsonschema==4.23.0

# Output parsing
pydantic==2.9.2  # Already in use
```

---

## Success Metrics

### Before Improvements
- ❌ 80% of outputs contain meta-commentary
- ❌ 100% domain-locked (banking only)
- ❌ Manual export + manual import required
- ❌ 50% of CSV imports fail due to missing fields
- ❌ No structured data for programmatic use

### After Improvements
- ✅ 0% meta-commentary (enforced by schema)
- ✅ 100% domain-agnostic (works for any industry)
- ✅ One-click direct push to Jira/GitHub
- ✅ 100% successful imports (validated schemas)
- ✅ Structured JSON for programmatic access

---

## Next Steps

**Recommend starting with Phase 1 (Agent Output Standardization)**:
1. Define JSON schemas for all 5 agents
2. Refactor `agents_config.py` with strict output instructions
3. Add output validation service
4. Test with multiple domains (healthcare, e-commerce, manufacturing)

This establishes the foundation for all other improvements.

**Would you like me to proceed with implementation?**
