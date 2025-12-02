# Agentic Scrum Platform - AI Agent Instructions

## Project Overview
Full-stack platform demonstrating **human-AI Scrum team collaboration** where AI agents work alongside human team members as virtual teammates. Shows how real Scrum teams can leverage autonomous AI agents for daily activities like backlog refinement, sprint planning, code reviews, and test generation. **Demo/POC version** architecture (single FastAPI server with embedded agents) designed for showcasing practical AI team augmentation.

## Architecture

### Frontend (Next.js 16 + React 19 + TypeScript)
- **App Router pages:** `/` (home), `/configure` (LLM setup), `/execute` (workflow), `/history` (sessions)
- **State management:** Zustand stores with persistence (`config-store.ts`, `execution-store.ts`)
- **API layer:** `src/lib/api-client.ts` centralizes all backend calls with type-safe error handling
- **UI components:** shadcn/ui (Radix + Tailwind CSS 4), 15+ components in `src/components/ui/`
- **Port:** 3010 (configured in `package.json`)

### Backend (FastAPI 0.121.3 + Python 3.11+)
- **Structure:** Layered architecture (routers → services → core)
  - `app/routers/`: API endpoints (agents, config, sessions, artifacts)
  - `app/services/`: Business logic (agent_service, azure_service, storage_service, config_profile_service)
  - `app/core/`: Agent execution (`agents.py`, `agents_config.py`) and Azure patch (`azure_patch.py`)
- **Port:** 8020 (configured in `app/config.py`)
- **Agent orchestration:** PraisonAI Agents (0.0.162) with sequential execution
- **5 agent roles:** Product Owner → Scrum Master → Developer → QA Engineer → Summary Agent

## Critical Implementation Patterns

### 1. Azure OpenAI + APIM Support
The platform requires custom Azure OpenAI handling via monkey-patching:
- **Patch location:** `backend/app/core/azure_patch.py`
- **Applied in:** `AgentService.__init__()` (runs on service initialization)
- **Why:** PraisonAI doesn't natively support Azure APIM endpoints with custom path prefixes
- **Key features:** Endpoint normalization, APIM path prefix injection, AzureOpenAI client switching
- **Environment variables:**
  - `AZURE_OPENAI_ENDPOINT`: Base Azure endpoint (may include APIM gateway)
  - `AZURE_OPENAI_API_VERSION`: API version (e.g., "2024-02-15-preview")
  - `OPENAI_MODEL_NAME`: Azure deployment name (not model name)
  - `APIM_PATH_PREFIX`: Optional custom APIM path (defaults to "openai")

### 2. Multi-Provider Configuration System
- **Profile-based configs:** Each provider (Ollama/OpenAI/Azure) supports multiple saved profiles with unique IDs
- **Storage:** JSON files in `backend/data/llm_profiles/profiles.json`
- **Flow:** Frontend stores profiles in Zustand → API resolves profile by ID → Environment variables set in `AgentService.setup_environment()`
- **Config models:** Pydantic models in `app/models/config.py` (OllamaConfigModel, OpenAIConfigModel, AzureConfigModel)

### 3. Session Management & SSE Streaming
- **In-memory sessions:** Dict in `app/routers/agents.py` (`active_sessions`) - NOT persisted to database
- **Session structure:** Status, agents array (name/status/progress), logs, checkpoints
- **Real-time updates:** Two SSE endpoints:
  - `GET /api/agents/stream/{session_id}`: Status + checkpoint updates
  - `GET /api/agents/stream-logs/{session_id}`: Real-time log streaming
- **Output persistence:** `backend/output/{session_id}/` contains agent artifacts + `session_metadata.json`

### 4. Agent Execution Workflow
```
1. Frontend: POST /api/agents/execute with {llmProfileId, inputs}
2. Router: resolve_config() fetches profile, validates, returns config model
3. AgentService.setup_environment(): Set env vars for provider
4. AgentService.execute_workflow(): Sequential agent execution with callbacks
   - status_callback: Updates agent progress in session
   - log_callback: Streams logs to SSE clients
   - checkpoint_callback: Saves agent outputs
5. Each agent: run_agent_async() → PraisonAI Agent.chat() → LLM response
6. Storage: save_session() writes metadata + artifacts to filesystem
```

## Developer Workflows

### Running Development Servers
```powershell
# Backend (from backend/)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8020

# Frontend (from frontend/)
npm install
npm run dev  # Starts on port 3010
```

### Testing Provider Connections
Use `POST /api/config/test` endpoint before execution to validate credentials:
```json
{
  "mode": "azure",
  "data": {
    "apiKey": "...",
    "endpoint": "https://your-apim.azure-api.net",
    "deployment": "gpt-4",
    "apiVersion": "2024-02-15-preview"
  }
}
```

### Debugging Agent Execution
- **Backend logs:** Check uvicorn console for agent lifecycle, LLM calls, Azure patch status
- **Frontend logs:** React Query devtools show API call status
- **SSE debugging:** Browser network tab → EventStream shows live updates
- **Artifact inspection:** `backend/output/{session_id}/` contains all agent outputs

## Code Conventions

### Backend Python
- **Async everywhere:** All agent execution uses `async/await` (FastAPI + PraisonAI support)
- **Type hints:** Use Pydantic models for request/response validation
- **Error handling:** Raise `HTTPException` with status codes, detailed error messages
- **Logging:** Use module-level `logger = logging.getLogger(__name__)` with INFO level
- **Environment setup:** Always call `setup_environment()` before agent execution

### Frontend TypeScript
- **API calls:** Use `api-client.ts` methods, never fetch directly
- **State persistence:** Zustand stores auto-persist to localStorage (except execution state)
- **Error boundaries:** API errors surface via TanStack Query error state
- **SSE consumption:** Use `EventSource` for `/stream` endpoints, parse `data:` fields as JSON

## Common Issues & Fixes

### "OPENAI_MODEL_NAME not configured"
- **Cause:** Frontend sent null/undefined apiMode or config
- **Fix:** Ensure `useConfigStore.getState().activeApiConfig` returns valid config before calling execute

### Azure 401 Unauthorized
- **Cause:** Missing APIM subscription key or incorrect deployment name
- **Fix:** Verify `deployment` field matches Azure OpenAI deployment (NOT model name like "gpt-4")

### SSE stream connection refused
- **Cause:** Session ID not in `active_sessions` or CORS issues
- **Fix:** Check session created before streaming, verify `cors_origins` includes frontend URL

### Agent execution hangs
- **Cause:** PraisonAI blocking call or LLM timeout
- **Fix:** Check backend logs for stack traces, verify LLM endpoint reachable with `curl`

## Human-AI Collaboration Features

### Demo Scenario Templates
- **Location:** `frontend/src/lib/demo-templates.ts`
- **Purpose:** Pre-built realistic scenarios (Login MFA, Payment API, SQL Migration, Bug Fix) to quickly demonstrate AI capabilities
- **Usage:** Template selector on execute page auto-fills requirements/context/constraints
- **Categories:** feature, api-design, technical-debt, bug-fix

### Export to External Tools
- **Backend endpoint:** `GET /api/artifacts/{session_id}/export?format=jira|github|markdown`
- **Frontend:** Export dialog in history page with 3 format options
- **Formats:**
  - **Jira CSV:** User stories formatted for Jira bulk import
  - **GitHub JSON:** Issues array ready for GitHub API
  - **Markdown:** Complete documentation for Confluence/Notion
- **Use case:** Shows how AI outputs integrate into existing human workflows

### Enhanced Execution Visualization
- **Visual Pipeline:** Agent workflow displayed as connected cards with role-specific icons (Users, BookOpen, FileText, TestTube, CheckCircle)
- **Progress Tracking:** Real-time progress bars, color-coded status (green=completed, blue=running, red=error, gray=waiting)
- **Dual View Tabs:** 
  - **Pipeline Tab:** Visual representation of all 5 agents with completion percentage
  - **Activity Logs Tab:** Scrollable real-time logs with timestamps and severity badges
- **Agent Cards:** Each agent shows icon, status badge, progress percentage, and current activity
- **Accordion Outputs:** Collapsible sections for each agent's deliverable with descriptions:
  - Product Owner: Vision, user stories & acceptance criteria
  - Scrum Master: Sprint plan, tasks & risk analysis
  - Developer: Technical design & code implementation
  - QA Engineer: Test cases & automation scripts
  - Release Manager: Executive summary & delivery plan
- **Benefits:** Reduces cognitive load, makes outputs scannable, shows team collaboration flow

## Key Files Reference
- **Agent definitions:** `backend/app/core/agents_config.py` - Modify prompts, roles, output filenames here
- **API routes:** `backend/app/routers/agents.py` - Execution logic, SSE streaming
- **Export logic:** `backend/app/routers/artifacts.py` - Format conversion for Jira/GitHub/Markdown
- **Demo templates:** `frontend/src/lib/demo-templates.ts` - Pre-built scenario definitions
- **Frontend types:** `frontend/src/types/index.ts` - Shared TypeScript interfaces
- **Config schema:** `backend/app/models/config.py` - Provider-specific validation models
- **Zustand stores:** `frontend/src/stores/` - Client-side state management

## Documentation References
- **Technical design:** `TECHNICAL_DESIGN.md` (detailed architecture diagrams, API specs)
- **Architecture comparison:** `ARCHITECTURE_COMPARISON.md` (demo vs enterprise patterns)
- **Quick start:** `QUICKSTART.md` (setup commands, latest fixes)
- **Enhancement roadmap:** `ENHANCEMENT_ROADMAP.md` (future improvements, enterprise features)

## POC Demo Focus: Human-AI Collaboration

### Primary Use Cases to Demonstrate
1. **On-Demand AI Assistance** - Human PO writes rough requirements → AI agents generate user stories, acceptance criteria, test cases
2. **Sprint Planning Support** - AI Scrum Master breaks down work, estimates effort, identifies risks from human-provided epic
3. **Code Generation** - AI Developer creates boilerplate, design patterns, API contracts from human specifications
4. **Automated QA** - AI QA Engineer generates test suites, test data, edge cases from human-written code
5. **Documentation** - AI Summary Agent creates sprint reports, release notes, technical docs from team artifacts

### Key Demo Scenarios
- **Scenario 1: "New Feature Request"** - Human submits "Build login with MFA" → AI team delivers complete package (stories, design, code, tests)
- **Scenario 2: "Technical Debt Sprint"** - Human describes legacy system → AI team plans refactoring, migration strategy, test coverage
- **Scenario 3: "Bug Triage"** - Human pastes error logs → AI team analyzes root cause, suggests fixes, generates regression tests
- **Scenario 4: "API Design Review"** - Human sketches API idea → AI team provides OpenAPI spec, security review, client SDK skeleton

### What NOT to Build (Out of Scope for POC)
- Real-time collaboration features (chat, co-editing)
- Human task assignment or project management
- Integration with actual Jira/GitHub (simulated data is fine)
- User authentication/multi-tenancy
- Advanced scheduling or resource allocation
- Microservices architecture (keep monolithic for demo simplicity)

## Notes for AI Agents
- This is a **POC demo** focusing on showcasing AI agent capabilities to augment human teams, NOT replacing them
- Emphasize **practical day-to-day use cases** over architectural complexity
- When adding features, prioritize those that show **immediate value to Scrum practitioners** (POs, SMs, Developers, QA)
- Keep the demo **self-contained and easy to run** - avoid external dependencies unless critical
- Agent prompts in `agents_config.py` should produce **realistic, production-quality outputs** that humans would actually use
- SSE streaming requires careful handling of async generators - use `asyncio.sleep()` for polling intervals
- Azure APIM integration is fragile - changes to `azure_patch.py` require thorough testing with real endpoints
