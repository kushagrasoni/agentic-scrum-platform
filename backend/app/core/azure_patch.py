"""
Azure OpenAI Patch for PraisonAI
Monkey patches PraisonAI's OpenAIClient to support Azure OpenAI and Azure API Management
"""
from __future__ import annotations

import os
import logging

logger = logging.getLogger(__name__)


def apply_patch() -> None:
    """
    Apply Azure OpenAI patch to PraisonAI OpenAIClient.
    
    This patch enables:
    - Azure OpenAI support via AzureOpenAI client
    - Azure API Management (APIM) endpoint support
    - Proper endpoint normalization and API version handling
    """
    try:
        # Optional imports; if unavailable, silently no-op
        from openai import AzureOpenAI, AsyncAzureOpenAI, OpenAI, AsyncOpenAI  # type: ignore
    except Exception:
        logger.warning("OpenAI SDK not available, skipping Azure patch")
        return

    try:
        from praisonaiagents.llm.openai_client import OpenAIClient
    except Exception:
        logger.warning("PraisonAI not available, skipping Azure patch")
        return

    # Check if already patched
    if getattr(OpenAIClient, "__patched_for_azure__", False):
        logger.info("Azure patch already applied")
        return

    # Store original client getters
    base_sync = OpenAIClient.sync_client.fget
    base_async = OpenAIClient.async_client.fget

    def is_azure_endpoint(url: str) -> bool:
        """Check if URL is an Azure endpoint."""
        return bool(url) and ("azure" in url.lower() or "azure-api.net" in url.lower())

    def normalize_endpoint(url: str) -> str:
        """
        Normalize Azure endpoint URL.
        
        - Removes query parameters and fragments
        - Handles APIM path prefixes
        - Ensures proper formatting for Azure SDK
        """
        url = (url or "").strip()
        
        # Remove query/fragment
        for sep in ["?", "#"]:
            if sep in url:
                url = url.split(sep, 1)[0]
        
        url = url.rstrip('/')
        
        # Handle custom APIM prefix if needed
        apim_prefix = os.environ.get("APIM_PATH_PREFIX", "").strip('/')
        if apim_prefix and apim_prefix != "openai":
            url = f"{url}/{apim_prefix}"
            logger.info(f"Added custom APIM prefix: {apim_prefix}")
        
        return url

    def sync_client(self):  # type: ignore[no-redef]
        """Patched sync_client property to support Azure."""
        if getattr(self, "_sync_client", None) is not None:
            return self._sync_client
        
        # Check if Azure mode should be used
        azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT") or self.base_url or ""
        use_azure = (
            (is_azure_endpoint(azure_endpoint) or os.environ.get("AZURE_OPENAI_API_KEY"))
            and (AzureOpenAI is not None)
        )
        
        if use_azure:
            endpoint = normalize_endpoint(azure_endpoint)
            api_version = (
                os.environ.get("AZURE_OPENAI_API_VERSION")
                or os.environ.get("OPENAI_API_VERSION")
                or os.environ.get("OPENAI_VERSION")
                or "2024-02-01"
            )
            logger.info(f"Creating AzureOpenAI sync client: endpoint={endpoint}, api_version={api_version}")
            
            self._sync_client = AzureOpenAI(
                api_key=self.api_key,
                azure_endpoint=endpoint,
                api_version=api_version,
            )
            return self._sync_client
        
        # Fallback to original OpenAI client
        logger.info("Using default OpenAI sync client (non-Azure)")
        return base_sync(self)

    def async_client(self):  # type: ignore[no-redef]
        """Patched async_client property to support Azure."""
        if getattr(self, "_async_client", None) is not None:
            return self._async_client
        
        # Check if Azure mode should be used
        azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT") or self.base_url or ""
        use_azure = (
            (is_azure_endpoint(azure_endpoint) or os.environ.get("AZURE_OPENAI_API_KEY"))
            and (AsyncAzureOpenAI is not None)
        )
        
        if use_azure:
            endpoint = normalize_endpoint(azure_endpoint)
            api_version = (
                os.environ.get("AZURE_OPENAI_API_VERSION")
                or os.environ.get("OPENAI_API_VERSION")
                or os.environ.get("OPENAI_VERSION")
                or "2024-02-01"
            )
            logger.info(f"Creating AsyncAzureOpenAI client: endpoint={endpoint}, api_version={api_version}")
            
            self._async_client = AsyncAzureOpenAI(
                api_key=self.api_key,
                azure_endpoint=endpoint,
                api_version=api_version,
            )
            return self._async_client
        
        # Fallback to original async client
        logger.info("Using default OpenAI async client (non-Azure)")
        return base_async(self)

    # Apply the patches
    OpenAIClient.sync_client = property(sync_client)
    OpenAIClient.async_client = property(async_client)
    OpenAIClient.__patched_for_azure__ = True
    
    logger.info("Azure OpenAI patch applied successfully")


def is_patch_applied() -> bool:
    """Check if the Azure patch has been applied."""
    try:
        from praisonaiagents.llm.openai_client import OpenAIClient
        return getattr(OpenAIClient, "__patched_for_azure__", False)
    except Exception:
        return False
