"""
Azure Service
Handles Azure-specific operations and configurations
"""
from __future__ import annotations

import os
import logging
from typing import Optional, Dict, List

from app.core import apply_patch, is_patch_applied

logger = logging.getLogger(__name__)


class AzureService:
    """Service for Azure OpenAI and APIM operations."""
    
    def __init__(self):
        """Initialize Azure service."""
        logger.info("AzureService initialized")
    
    def configure_azure_environment(
        self,
        api_key: str,
        endpoint: str,
        deployment: str,
        api_version: str = "2024-02-01"
    ) -> None:
        """
        Configure environment for Azure OpenAI.
        
        Args:
            api_key: Azure OpenAI API key
            endpoint: Azure OpenAI endpoint URL
            deployment: Deployment name
            api_version: API version
        """
        os.environ["AZURE_OPENAI_API_KEY"] = api_key
        os.environ["OPENAI_API_KEY"] = api_key  # Fallback
        os.environ["AZURE_OPENAI_ENDPOINT"] = endpoint
        os.environ["OPENAI_MODEL_NAME"] = deployment
        os.environ["AZURE_OPENAI_API_VERSION"] = api_version
        
        logger.info(f"Azure environment configured: endpoint={endpoint}, deployment={deployment}")
        
        # Ensure patch is applied
        if not is_patch_applied():
            apply_patch()
            logger.info("Applied Azure OpenAI patch")
    
    def test_azure_connection(
        self,
        api_key: str,
        endpoint: str,
        deployment: str,
        api_version: str = "2024-02-01"
    ) -> Dict:
        """
        Test Azure OpenAI connection.
        
        Args:
            api_key: Azure OpenAI API key
            endpoint: Azure OpenAI endpoint URL
            deployment: Deployment name
            api_version: API version
        
        Returns:
            Dictionary with test results
        """
        try:
            from openai import AzureOpenAI
            
            # Normalize endpoint
            endpoint = endpoint.rstrip('/')
            
            logger.info(f"Testing Azure connection: {endpoint}")
            
            client = AzureOpenAI(
                api_key=api_key,
                azure_endpoint=endpoint,
                api_version=api_version
            )
            
            # Try a simple completion
            response = client.chat.completions.create(
                model=deployment,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            logger.info("Azure connection test successful")
            
            return {
                "success": True,
                "message": f"Connected to Azure OpenAI at {endpoint}",
                "deployment": deployment,
                "response_id": response.id
            }
            
        except Exception as e:
            logger.error(f"Azure connection test failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}",
                "error": str(e)
            }
    
    def configure_apim(
        self,
        apim_endpoint: str,
        api_key: str,
        path_prefix: Optional[str] = None
    ) -> None:
        """
        Configure Azure API Management (APIM) settings.
        
        Args:
            apim_endpoint: APIM endpoint URL
            api_key: APIM subscription key
            path_prefix: Optional custom path prefix
        """
        os.environ["AZURE_OPENAI_ENDPOINT"] = apim_endpoint
        os.environ["AZURE_OPENAI_API_KEY"] = api_key
        os.environ["OPENAI_API_KEY"] = api_key
        
        if path_prefix:
            os.environ["APIM_PATH_PREFIX"] = path_prefix
            logger.info(f"APIM configured with path prefix: {path_prefix}")
        
        logger.info(f"APIM configured: {apim_endpoint}")
    
    def get_available_deployments(self) -> List[str]:
        """
        Get list of available Azure OpenAI deployments.
        
        Note: This requires Azure Resource Management API access.
        For now, returns common deployment names.
        
        Returns:
            List of deployment names
        """
        # TODO: Implement actual Azure API call to list deployments
        return [
            "gpt-4",
            "gpt-4-turbo",
            "gpt-35-turbo",
            "gpt-4o"
        ]
    
    def validate_endpoint(self, endpoint: str) -> Dict:
        """
        Validate Azure endpoint format.
        
        Args:
            endpoint: Endpoint URL to validate
        
        Returns:
            Dictionary with validation results
        """
        errors = []
        warnings = []
        
        # Check if URL is valid
        if not endpoint:
            errors.append("Endpoint is required")
        elif not endpoint.startswith(("https://", "http://")):
            errors.append("Endpoint must start with https:// or http://")
        
        # Check for Azure patterns
        is_azure = "azure" in endpoint.lower() or "azure-api.net" in endpoint.lower()
        if not is_azure:
            warnings.append("Endpoint doesn't appear to be an Azure URL")
        
        # Check for trailing slash
        if endpoint.endswith('/'):
            warnings.append("Endpoint has trailing slash (will be normalized)")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "is_azure": is_azure
        }


# Global service instance
_azure_service: Optional[AzureService] = None


def get_azure_service() -> AzureService:
    """Get or create Azure service singleton."""
    global _azure_service
    if _azure_service is None:
        _azure_service = AzureService()
    return _azure_service
