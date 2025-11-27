"""
FastAPI Main Application
Entry point for the Agentic Scrum Platform backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Import routers
from app.routers import config, agents, sessions, artifacts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("🚀 Starting Agentic Scrum Platform API...")
    yield
    logger.info("👋 Shutting down Agentic Scrum Platform API...")


# Create FastAPI app
app = FastAPI(
    title="Agentic Scrum Platform API",
    description="AI-powered Scrum team simulation API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(config.router, prefix="/api/config", tags=["Configuration"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(artifacts.router, prefix="/api/artifacts", tags=["Artifacts"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Agentic Scrum Platform API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
