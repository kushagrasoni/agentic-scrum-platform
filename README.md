# Agentic Scrum Platform# Agentic Scrum Platform# Agentic Scrum Platform 🚀# Agentic Scrum Platform - Modern ArchitectureThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



A modern full-stack application for AI-powered Scrum team simulation using Next.js 16 and FastAPI.



## 🚀 Tech StackModern AI-powered software development planning platform using autonomous agents for complete Scrum workflow automation.



### Frontend

- **Next.js 16.0.3** - React framework with App Router

- **React 19.2.0** - Latest React with concurrent features## FeaturesModern, scalable AI-powered Scrum team simulation platform with Next.js frontend and FastAPI backend.

- **TypeScript 5** - Type-safe development

- **Tailwind CSS 4** - Utility-first CSS framework

- **shadcn/ui** - Accessible component library

- **Zustand 5.0.8** - Lightweight state management (13.8M weekly downloads)- **Multi-Provider AI**: Ollama, OpenAI, or Azure OpenAI support

- **TanStack Query 5.90.10** - Data fetching and caching (12.6M weekly)

- **react-hook-form 7.66.1** - Form management (14.1M weekly)- **5 Specialized Agents**: Product Owner, Scrum Master, Developer, QA, Summary

- **zod 4.1.12** - Runtime type validation (56.2M weekly)

- **Framer Motion 12.23.24** - Animation library- **Real-time Execution**: Live status updates and SSE log streaming## 🏗️ Project StructureA modern, production-ready platform for AI-powered Scrum team simulation. Built with Next.js 15, FastAPI, and PraisonAI Agents.## Getting Started

- **date-fns** - Date formatting utility

- **Session Management**: Full execution history with artifact downloads

### Backend

- **FastAPI 0.121.3** - High-performance async Python API framework- **Modern Stack**: Next.js 16 + FastAPI + PraisonAI Agents

- **Uvicorn 0.38.0** - ASGI server with hot reload

- **Pydantic 2.12.4** - Data validation using Python type hints

- **PraisonAI Agents 0.0.162** - AI agent orchestration framework

- **OpenAI SDK 2.8.1** - OpenAI and Azure OpenAI integration## Quick Start```

- **Azure Identity 1.19.0** - Enterprise authentication support



## 📋 Features

### Backendagentic-scrum-platform/

### AI-Powered Scrum Agents

- **Product Owner**: Analyzes requirements and creates user stories```bash

- **Scrum Master**: Facilitates process and removes blockers

- **Developer**: Implements technical solutionscd backend├── frontend/                 ← Next.js 15 Application## 🏗️ Architecture OverviewFirst, run the development server:

- **QA Engineer**: Tests and validates deliverables

- **Summary Agent**: Synthesizes team outputspython -m venv venv



### Multi-Provider Supportsource venv/bin/activate  # Windows: venv\Scripts\activate│   ├── src/

- **Ollama**: Local LLM deployment

- **OpenAI**: GPT models via APIpip install -r requirements.txt

- **Azure OpenAI**: Enterprise-grade with APIM support

uvicorn main:app --reload│   │   ├── app/             (App Router pages)

### Session Management

- Real-time execution tracking```

- Session history and artifacts

- Downloadable outputs (individual files and ZIP archives)│   │   ├── components/      (Reusable UI components)

- Server-Sent Events (SSE) for live log streaming

### Frontend

## 🏗️ Project Structure

```bash│   │   ├── lib/             (API client & utilities)### Frontend (Next.js 15 + TypeScript)```bash

```

agentic-scrum-platform/cd frontend

├── frontend/                 # Next.js application

│   ├── src/npm install│   │   ├── hooks/           (Custom React hooks)

│   │   ├── app/             # App Router pages

│   │   │   ├── page.tsx            # Homepagenpm run dev

│   │   │   ├── configure/          # API configuration

│   │   │   ├── execute/            # Execution dashboard```│   │   ├── stores/          (Zustand state management)- **App Router** with React 19npm run dev

│   │   │   └── history/            # Session history

│   │   ├── components/      # React components

│   │   │   └── ui/          # shadcn/ui components

│   │   ├── hooks/           # Custom React hooksVisit http://localhost:3000│   │   └── types/           (TypeScript definitions)

│   │   ├── stores/          # Zustand state stores

│   │   ├── lib/             # Utilities

│   │   └── types/           # TypeScript types

│   ├── package.json## Usage│   ├── public/              (Static assets)- **Tailwind CSS 4** for styling# or

│   └── tsconfig.json

│

└── backend/                  # FastAPI application

    ├── main.py              # FastAPI app entry point1. **Configure** (`/configure`): Set up your AI provider (Ollama/OpenAI/Azure)│   └── package.json

    ├── requirements.txt     # Python dependencies

    └── app/2. **Execute** (`/execute`): Provide requirements and run the 5-agent workflow

        ├── models/          # Pydantic models

        │   ├── config.py       # Configuration models3. **Review** (`/history`): Access generated artifacts and session history│- **shadcn/ui** componentsyarn dev

        │   ├── agents.py       # Agent/session models

        │   └── responses.py    # API response models

        ├── core/            # Core business logic

        │   ├── agents.py           # Agent execution## Tech Stack└── backend/                  ← FastAPI Application

        │   ├── agents_config.py    # Agent definitions

        │   └── azure_patch.py      # Azure APIM patching

        ├── services/        # Service layer

        │   ├── agent_service.py    # Workflow orchestration**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query      ├── app/- **Zustand** for state management# or

        │   ├── storage_service.py  # Session/artifact storage

        │   └── azure_service.py    # Azure integration**Backend**: FastAPI, PraisonAI Agents, Pydantic, OpenAI SDK, Azure Identity

        └── routers/         # API endpoints

            ├── agents.py       # Agent execution    │   ├── main.py          (Entry point)

            ├── config.py       # Provider testing

            ├── sessions.py     # Session CRUD## Project Structure

            └── artifacts.py    # File downloads

```    │   ├── config.py        (Settings)- **TanStack Query** for data fetchingpnpm dev



## 🔧 Installation```



### Prerequisitesagentic-scrum-platform/    │   ├── models/          (Pydantic models)

- **Node.js** 18+ and npm

- **Python** 3.9+├── frontend/

- **API Keys** (at least one):

  - Ollama (local installation)│   └── src/    │   ├── routers/         (API endpoints)- **React Hook Form + Zod** for forms# or

  - OpenAI API key

  - Azure OpenAI credentials│       ├── app/          # Pages (configure, execute, history)



### Frontend Setup│       ├── components/   # shadcn/ui components    │   ├── services/        (Business logic)



```bash│       ├── hooks/        # TanStack Query hooks

cd frontend

npm install│       ├── stores/       # Zustand stores    │   ├── core/            (Core agent logic)bun dev

```

│       └── lib/          # API client

Create `.env.local`:

```env└── backend/    │   └── utils/           (Helpers)

NEXT_PUBLIC_API_URL=http://localhost:8000

```    └── app/



### Backend Setup        ├── core/         # Agent logic & Azure patch    └── requirements.txt### Backend (FastAPI + Python)```



```bash        ├── models/       # Pydantic models

cd backend

pip install -r requirements.txt        ├── routers/      # API endpoints```

```

        └── services/     # Business logic

Create `.env`:

```env```- **RESTful API** with automatic docs

# Choose one provider:



# Option 1: Ollama (local)

OPENAI_MODEL_NAME=llama3## Environment Variables## 🛠️ Tech Stack

OPENAI_BASE_URL=http://localhost:11434/v1

OPENAI_API_KEY=ollama



# Option 2: OpenAI**Backend (.env)**:- **Pydantic** models for validationOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

OPENAI_MODEL_NAME=gpt-4o

OPENAI_API_KEY=sk-your-api-key-here```env



# Option 3: Azure OpenAIOPENAI_API_KEY=your_key_here### Frontend

OPENAI_MODEL_NAME=gpt-4o

AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.comAZURE_OPENAI_API_KEY=your_key_here

AZURE_OPENAI_API_KEY=your-azure-key

AZURE_OPENAI_API_VERSION=2024-08-01-previewAZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com- **Framework**: Next.js 15 (App Router, React 19)- **PraisonAI Agents** for AI orchestration

AZURE_OPENAI_DEPLOYMENT=gpt-4o

```

# For Azure APIM (optional)

APIM_SUBSCRIPTION_KEY=your-apim-key- **Language**: TypeScript 5

```

**Frontend (.env.local)**:

## 🚀 Running the Application

```env- **Styling**: Tailwind CSS 4- **Async/await** supportYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Development Mode

NEXT_PUBLIC_API_URL=http://localhost:8000

**Terminal 1 - Backend:**

```bash```- **UI Components**: shadcn/ui

cd backend

uvicorn main:app --reload

```

Server runs on: http://localhost:8000## License- **State Management**: Zustand

API docs: http://localhost:8000/docs



**Terminal 2 - Frontend:**

```bashMIT- **Data Fetching**: TanStack Query

cd frontend

npm run dev

```- **Forms**: React Hook Form + Zod## 🚀 Quick StartThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

Application runs on: http://localhost:3000

- **Animations**: Framer Motion

### Production Build



**Frontend:**

```bash### Backend

cd frontend

npm run build- **Framework**: FastAPI 0.115+### 1. Frontend Setup (Already Done! ✅)## Learn More

npm start

```- **Language**: Python 3.11+



**Backend:**- **AI Framework**: PraisonAI Agents

```bash

cd backend- **LLM**: OpenAI, Azure OpenAI

uvicorn main:app --host 0.0.0.0 --port 8000

```All dependencies installed:To learn more about Next.js, take a look at the following resources:



## 📖 Usage Guide## 🚀 Quick Start



### 1. Configure API Provider```



Navigate to http://localhost:3000/configure### Frontend



Choose your provider:```bash✅ @tanstack/react-query (12.6M downloads/week)- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- **Ollama**: Install locally and configure model name

- **OpenAI**: Enter API key and select modelcd frontend

- **Azure**: Configure endpoint, API key, deployment, and API version

npm install✅ zustand (13.8M downloads/week)- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

Click **Test Connection** to verify settings.

npm run dev

### 2. Execute Workflow

```✅ react-hook-form (14.1M downloads/week)

Navigate to http://localhost:3000/execute

Runs on [http://localhost:3000](http://localhost:3000)

1. Fill in the input fields:

   - **Requirements**: Project description✅ zod (56.2M downloads/week)You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

   - **Context**: Additional background

   - **Constraints**: Technical/business constraints### Backend



2. Click **Execute Agents** to start the workflow```bash✅ framer-motion (12.2M downloads/week)



3. Monitor real-time progress:cd backend

   - Agent status indicators

   - Live log streamingpython -m venv venv✅ lucide-react (13.8M downloads/week)## Deploy on Vercel

   - Generated artifacts

venv\Scripts\activate  # Windows

### 3. View History

pip install -r requirements.txt✅ next-themes

Navigate to http://localhost:3000/history

python main.py

- Browse past sessions

- Search by session ID```✅ shadcn/ui componentsThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- View execution details

- Download artifacts (individual or ZIP)Runs on [http://localhost:8000](http://localhost:8000)



## 🔌 API Endpoints```



### Configuration## ✅ Status

- `POST /api/config/test-ollama` - Test Ollama connection

- `POST /api/config/test-openai` - Test OpenAI connectionCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- `POST /api/config/test-azure` - Test Azure OpenAI connection

**Completed:**

### Agents

- `POST /api/agents/execute` - Start agent workflow- ✅ Monorepo structure with frontend/ and backend/### 2. Backend Setup

- `GET /api/agents/status/{session_id}` - Get execution status

- `GET /api/agents/logs/{session_id}` - Stream logs (SSE)- ✅ Next.js 15 + TypeScript setup

- `POST /api/agents/cancel/{session_id}` - Cancel execution

- ✅ shadcn/ui components```powershell

### Sessions

- `GET /api/sessions` - List all sessions- ✅ Zustand & TanStack Query# Navigate to backend

- `GET /api/sessions/{session_id}` - Get session details

- ✅ FastAPI with organized routers & modelscd backend

### Artifacts

- `GET /api/artifacts/{session_id}/{filename}` - Download file- ✅ Type-safe API client

- `GET /api/artifacts/{session_id}/archive` - Download ZIP

# Create virtual environment

## 🏛️ Architecture

**Next Steps:**python -m venv venv

### Frontend Architecture

- **App Router**: File-based routing with React Server Components- 🚧 Migrate core agent logic.\venv\Scripts\Activate.ps1

- **State Management**: Zustand for global state, React Query for server state

- **Type Safety**: Full TypeScript coverage with strict mode- 🚧 Build UI pages

- **Styling**: Tailwind CSS with custom theme configuration

- **Components**: Reusable shadcn/ui components with accessibility- 🚧 Implement services layer# Install dependencies



### Backend Architecture- 🚧 Real-time SSE streamingpip install -r requirements.txt

- **API Layer**: FastAPI routers for endpoint handling

- **Service Layer**: Business logic separation```

- **Core Layer**: Agent execution and configuration

- **Models**: Pydantic for validation and serialization---

- **Storage**: File-based session/artifact persistence

### 3. Run Development Servers

### Agent Workflow

1. **Product Owner** → Analyzes requirementsBuilt with ❤️ for AI-powered development

2. **Scrum Master** → Plans sprint and identifies risks

3. **Developer** → Creates technical implementation**Terminal 1 - Frontend:**

4. **QA Engineer** → Designs test strategy```powershell

5. **Summary Agent** → Synthesizes all outputsnpm run dev

# → http://localhost:3000

## 🧪 Testing```



### Backend Testing**Terminal 2 - Backend:**

```bash```powershell

cd backendcd backend

pytestuvicorn main:app --reload

```# → http://localhost:8000

# → http://localhost:8000/docs (API documentation)

### Frontend Testing```

```bash

cd frontend## 📁 Project Structure

npm test

``````

agentic-scrum-platform/

## 🐛 Troubleshooting├── app/                     # Next.js App Router

│   ├── layout.tsx          # Root layout with providers

### Backend Issues│   ├── page.tsx            # Home page

│   └── globals.css         # Global styles

**Import errors after update:**├── components/             # React components

```bash│   ├── ui/                # shadcn/ui components (15 components)

pip install -r requirements.txt --upgrade --force-reinstall│   └── providers.tsx      # Query + Theme providers

```├── lib/                   # Utilities

│   ├── api-client.ts     # Typed API client

**Azure APIM 500 errors:**│   └── utils.ts          # Helper functions

- Verify `APIM_SUBSCRIPTION_KEY` is set├── stores/               # Zustand stores

- Check endpoint URL format (no trailing slash)│   ├── config-store.ts   # API configuration state

- Ensure API version is correct│   └── execution-store.ts # Execution state

├── hooks/                # Custom React hooks

**Ollama connection failed:**│   ├── use-config.ts     # Configuration hooks

- Verify Ollama is running: `ollama serve`│   ├── use-agents.ts     # Agent execution hooks

- Check model is pulled: `ollama pull llama3`│   ├── use-sessions.ts   # Session management

│   └── use-artifacts.ts  # Artifact management

### Frontend Issues├── types/               # TypeScript definitions

│   └── index.ts        # Shared types

**Module not found:**└── backend/            # FastAPI backend

```bash    ├── main.py        # FastAPI app

rm -rf node_modules package-lock.json    ├── app/

npm install    │   ├── config.py      # Settings

```    │   ├── models.py      # Pydantic models

    │   └── routers/       # API endpoints

**TypeScript errors:**    │       ├── config.py    # /api/config/*

```bash    │       ├── agents.py    # /api/agents/*

npm run build    │       ├── sessions.py  # /api/sessions/*

```    │       └── artifacts.py # /api/artifacts/*

    └── requirements.txt

**Port already in use:**```

```bash

# Windows## 🎯 Features Implemented

netstat -ano | findstr :3000

taskkill /PID <PID> /F### ✅ Completed

- [x] Next.js 15 + TypeScript setup

# Linux/Mac- [x] Tailwind CSS 4 configuration

lsof -ti:3000 | xargs kill -9- [x] shadcn/ui component library (15 components)

```- [x] Zustand state management stores

- [x] TanStack Query hooks for all endpoints

## 📦 Deployment- [x] Typed API client with error handling

- [x] FastAPI backend structure

### Frontend (Vercel)- [x] API routers for all endpoints

1. Push code to GitHub- [x] Pydantic models for validation

2. Import repository to Vercel- [x] CORS configuration

3. Set environment variables:- [x] Theme provider (dark/light mode)

   - `NEXT_PUBLIC_API_URL=https://your-api-domain.com`- [x] Toast notifications (Sonner)

4. Deploy

### 🚧 In Progress

### Backend (Railway/Render/Heroku)- [ ] Migrate agent logic from old project

1. Add `Procfile`:- [ ] Build UI pages (Configure, Execute, Artifacts, History)

   ```- [ ] Implement real-time log streaming (SSE)

   web: uvicorn main:app --host 0.0.0.0 --port $PORT- [ ] Connect to PraisonAI Agents

   ```- [ ] Session persistence

2. Set environment variables (all provider keys)- [ ] Artifact storage

3. Deploy from GitHub repository

## 📖 API Endpoints

### Docker Deployment

### Configuration

**Create `docker-compose.yml`:**| Method | Endpoint | Description |

```yaml|--------|----------|-------------|

version: '3.8'| POST | `/api/config/test` | Test LLM connection |

services:| GET | `/api/config/models` | List available models |

  backend:| POST | `/api/config/save` | Save configuration |

    build: ./backend

    ports:### Agent Execution

      - "8000:8000"| Method | Endpoint | Description |

    environment:|--------|----------|-------------|

      - OPENAI_API_KEY=${OPENAI_API_KEY}| POST | `/api/agents/execute` | Start agent workflow |

  | GET | `/api/agents/status/{id}` | Get execution status |

  frontend:| GET | `/api/agents/logs/{id}` | Stream logs (SSE) |

    build: ./frontend| POST | `/api/agents/cancel/{id}` | Cancel execution |

    ports:

      - "3000:3000"### Session Management

    environment:| Method | Endpoint | Description |

      - NEXT_PUBLIC_API_URL=http://backend:8000|--------|----------|-------------|

```| GET | `/api/sessions` | List all sessions |

| GET | `/api/sessions/{id}` | Get session details |

Run:| DELETE | `/api/sessions/{id}` | Delete session |

```bash

docker-compose up### Artifacts

```| Method | Endpoint | Description |

|--------|----------|-------------|

## 🤝 Contributing| GET | `/api/artifacts/{id}` | List session artifacts |

| GET | `/api/artifacts/{id}/{file}` | Get specific file |

1. Fork the repository| GET | `/api/artifacts/{id}/download` | Download as ZIP |

2. Create a feature branch: `git checkout -b feature-name`

3. Commit changes: `git commit -am 'Add feature'`## 🛠️ Tech Stack Details

4. Push to branch: `git push origin feature-name`

5. Submit a Pull Request### Frontend (All Latest Stable)

- **Next.js** 16.0.3

## 📄 License- **React** 19.2.0

- **TypeScript** 5

MIT License - see LICENSE file for details- **Tailwind CSS** 4

- **@tanstack/react-query** 5.90.10 (13M/week)

## 🙏 Acknowledgments- **zustand** 5.0.8 (14M/week)

- **react-hook-form** 7.66.1 (14M/week)

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework- **zod** 4.1.12 (56M/week) 

- [Next.js](https://nextjs.org/) - React framework- **framer-motion** 12.23.24 (12M/week)

- [PraisonAI](https://docs.praison.ai/) - AI agent framework- **lucide-react** 0.554.0 (14M/week)

- [shadcn/ui](https://ui.shadcn.com/) - Component library- **next-themes** 0.4.6

- [Vercel](https://vercel.com/) - Deployment platform- **sonner** 2.0.7



## 📞 Support### Backend

- **FastAPI** 0.115+

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)- **Uvicorn** 0.32+ (with standard extras)

- **Documentation**: [Wiki](https://github.com/your-repo/wiki)- **Pydantic** 2.9.2

- **Discord**: [Community Server](https://discord.gg/your-invite)- **PraisonAI Agents** 0.0.30

- **OpenAI** SDK 1.54.4

---- **Azure Identity** 1.19.0

- **httpx** 0.27.2

Built with ❤️ using the latest stable versions of all dependencies (updated November 2025)

## 🎨 Available UI Components

From shadcn/ui:
- `button`, `card`, `input`, `label`
- `select`, `textarea`, `badge`, `progress`
- `tabs`, `alert`, `dialog`, `dropdown-menu`
- `separator`, `skeleton`, `sonner`

## 📝 Development Commands

### Frontend
```powershell
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # Run ESLint
```

### Backend
```powershell
uvicorn main:app --reload    # Development with auto-reload
python main.py               # Alternative entry point
```

## 🔧 Configuration

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Environment (.env)
```env
# Copy from .env.example and configure
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=your_key_here
AZURE_API_KEY=your_key_here
AZURE_ENDPOINT=your_endpoint_here
```

## 📊 Project Status

**Overall Progress:** 60% Complete

| Component | Status |
|-----------|--------|
| Frontend Setup | ✅ 100% |
| State Management | ✅ 100% |
| API Client | ✅ 100% |
| Backend Structure | ✅ 100% |
| Agent Migration | 🚧 0% |
| UI Pages | 🚧 0% |
| Real-time Features | 🚧 0% |

## 🎯 Next Steps

1. **Migrate Agent Logic**
   - Copy from `agentic_scrum_low_code_type`
   - Integrate PraisonAI Agents
   - Implement execution flow

2. **Build UI Pages**
   - Configuration page
   - Execution dashboard
   - Artifacts viewer
   - Session history

3. **Implement Real-time**
   - Server-Sent Events for logs
   - WebSocket for status updates

4. **Testing & Polish**
   - Error handling
   - Loading states
   - Unit tests

## 📚 Documentation

- **API Docs:** http://localhost:8000/docs (when backend running)
- **Frontend:** http://localhost:3000
- **shadcn/ui:** https://ui.shadcn.com
- **TanStack Query:** https://tanstack.com/query
- **Zustand:** https://zustand.docs.pmnd.rs

## 🤝 Architecture Decisions

### Why These Libraries?
- **Zustand over Redux:** 6x more popular than Jotai, simpler API, no boilerplate
- **TanStack Query:** Industry standard for data fetching (13M downloads/week)
- **React Hook Form:** Most popular form library (14M downloads/week)
- **Zod:** Most popular validation library (56M downloads/week)
- **shadcn/ui:** Modern, accessible, customizable components

### Design Principles
- **Type Safety:** TypeScript everywhere
- **Developer Experience:** Hot reload, auto-complete, error handling
- **Performance:** Code splitting, lazy loading, optimistic updates
- **Accessibility:** WCAG 2.1 AA compliant components
- **Modern UX:** Dark mode, animations, real-time updates

---

Built with ❤️ using modern web technologies
