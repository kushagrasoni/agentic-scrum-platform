# 🚀 Quick Start Guide

## Latest Fixes Applied ✅

### 1. Fixed `updatedAt` Field Error
- **Problem**: Session model tried to set non-existent `updatedAt` field
- **Solution**: Changed to use `completedAt` on success, `status="error"` + `error` field on failure

### 2. Fixed Configuration Not Being Sent  
- **Problem**: Frontend could send null `apiMode` causing "OPENAI_MODEL_NAME not configured" error
- **Solution**: Added guard in `handleExecute`, proper type casting, error handling, and debug logging

### 3. Fixed Artifact Display Error
- **Problem**: Code treated artifacts as objects, but they're strings
- **Solution**: Use artifact string directly with `index` as key

---

## What We Just Built

A modern **Agentic Scrum Platform** with:
- ✅ **Next.js 15** frontend (TypeScript + Tailwind CSS 4)
- ✅ **FastAPI** backend (Python with async support)
- ✅ **15 UI components** from shadcn/ui
- ✅ **State management** with Zustand
- ✅ **Data fetching** with TanStack Query
- ✅ **Type-safe** API client

## 📦 What's Installed

### Frontend Packages (All Latest & Popular)
```
@tanstack/react-query  5.90.10  (12.6M downloads/week) ✅
zustand                5.0.8    (13.8M downloads/week) ✅
react-hook-form        7.66.1   (14.1M downloads/week) ✅
zod                    4.1.12   (56.2M downloads/week) ✅
framer-motion          12.23.24 (12.2M downloads/week) ✅
lucide-react           0.554.0  (13.8M downloads/week) ✅
next-themes            0.4.6    (theme switching) ✅
```

### UI Components (shadcn/ui)
```
✅ button, card, input, label, select, textarea
✅ badge, progress, tabs, alert
✅ dialog, dropdown-menu, separator, skeleton
✅ sonner (toast notifications)
```

## 🎯 Run the Project

### Option 1: Frontend Only (Test UI)
```powershell
npm run dev
```
Opens at **http://localhost:3000**

### Option 2: Full Stack

**Terminal 1 - Frontend:**
```powershell
npm run dev
```

**Terminal 2 - Backend:**
```powershell
cd backend

# First time: Install dependencies
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Then run:
uvicorn main:app --reload
```
- Frontend: **http://localhost:3000**
- Backend: **http://localhost:8000**
- API Docs: **http://localhost:8000/docs**

## 📁 Project Organization

```
agentic-scrum-platform/
├── 🎨 Frontend (Next.js)
│   ├── app/          - Pages & routing
│   ├── components/   - UI components
│   ├── hooks/        - TanStack Query hooks
│   ├── stores/       - Zustand state
│   ├── lib/          - API client
│   └── types/        - TypeScript types
│
└── ⚡ Backend (FastAPI)
    ├── main.py       - FastAPI app
    ├── app/
    │   ├── models.py   - Pydantic models
    │   ├── config.py   - Settings
    │   └── routers/    - API endpoints
    └── requirements.txt
```

## 🔥 Key Features

### Already Working:
1. ✅ **Type-safe API client** - Full TypeScript support
2. ✅ **State management** - Config & execution stores
3. ✅ **Data fetching hooks** - Ready to use
4. ✅ **UI components** - 15 accessible components
5. ✅ **Dark mode** - Theme switching built-in
6. ✅ **Toast notifications** - Sonner integrated
7. ✅ **API structure** - All endpoints defined

### Next Steps:
1. 🚧 **Migrate agent logic** from old project
2. 🚧 **Build UI pages** (Configure, Execute, Artifacts, History)
3. 🚧 **Connect to AI** (PraisonAI Agents)

## 📖 API Endpoints Ready

```
Configuration:
  POST   /api/config/test        - Test LLM connection
  GET    /api/config/models      - List models
  POST   /api/config/save        - Save config

Agents:
  POST   /api/agents/execute     - Start execution
  GET    /api/agents/status/:id  - Get status
  GET    /api/agents/logs/:id    - Stream logs
  POST   /api/agents/cancel/:id  - Cancel

Sessions:
  GET    /api/sessions           - List sessions
  GET    /api/sessions/:id       - Get session
  DELETE /api/sessions/:id       - Delete session

Artifacts:
  GET    /api/artifacts/:id      - List artifacts
  GET    /api/artifacts/:id/:file - Get file
  GET    /api/artifacts/:id/download - Download ZIP
```

## 🎨 Using UI Components

Example with the installed components:

```tsx
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function MyPage() {
  return (
    <Card>
      <Input placeholder="Enter text..." />
      <Button>Submit</Button>
    </Card>
  )
}
```

## 🔧 Using State & Hooks

```tsx
'use client'
import { useConfigStore } from '@/stores/config-store'
import { useTestConnection } from '@/hooks/use-config'

export default function ConfigPage() {
  const { apiMode, setApiMode } = useConfigStore()
  const testMutation = useTestConnection()
  
  // ... your component logic
}
```

## 📝 Environment Setup

Create `.env.local` in root:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `backend/.env`:
```env
OPENAI_API_KEY=your_key_here
# See backend/.env.example for more options
```

## 🎯 Current Progress

```
✅ Frontend Setup           100%
✅ Dependencies             100%
✅ State Management         100%
✅ API Client               100%
✅ Backend Structure        100%
🚧 Agent Migration          0%
🚧 UI Pages                 0%
🚧 Real-time Updates        0%

Overall: 60% Complete
```

## 🚦 What's Next?

1. **Test the setup:**
   ```powershell
   npm run dev
   ```
   Should see Next.js running at localhost:3000

2. **Explore the structure:**
   - Check `components/ui/` for available components
   - Look at `hooks/` for data fetching
   - Review `stores/` for state management
   - See `lib/api-client.ts` for API methods

3. **Build pages:**
   - Create app pages using the components
   - Connect to hooks for data
   - Add forms with React Hook Form + Zod

4. **Migrate agent logic:**
   - Copy from old project
   - Adapt to FastAPI
   - Test execution flow

## 🆘 Troubleshooting

**Port already in use:**
```powershell
# Frontend (3000)
npm run dev -- -p 3001

# Backend (8000)
uvicorn main:app --reload --port 8001
```

**Module not found:**
```powershell
# Frontend
npm install

# Backend
pip install -r requirements.txt
```

## 📚 Resources

- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **shadcn/ui:** https://ui.shadcn.com
- **TanStack Query:** https://tanstack.com/query
- **Zustand:** https://zustand.docs.pmnd.rs

---

**You're all set!** 🎉 Start with `npm run dev` and begin building your pages!
