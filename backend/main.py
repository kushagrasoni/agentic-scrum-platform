"""
FastAPI Main Application
Entry point for the ChatGPTeam backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app import settings

# Import routers
from app.routers import config, agents, sessions, artifacts, integrations, telemetry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("🚀 Starting ChatGPTeam API...")
    yield
    logger.info("👋 Shutting down ChatGPTeam API...")


# Create FastAPI app
app = FastAPI(
    title="ChatGPTeam API",
    description="AI-powered Scrum team simulation API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Update to use settings.cors_origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(config.router, prefix="/api/config", tags=["Configuration"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(artifacts.router, prefix="/api/artifacts", tags=["Artifacts"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ChatGPTeam API",
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
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level="info"
    )
