"""
Agent Configuration and Role Definitions
Defines all agent roles, instructions, and behaviors for the Scrum workflow
"""
from __future__ import annotations
from typing import Dict, Any


def get_agent_configs(strict_mode: bool = False) -> Dict[str, Dict[str, Any]]:
    """
    Get configuration for all agent roles in the Scrum workflow.
    
    Args:
        strict_mode: If True, adds citation tags to agent outputs
    
    Returns:
        Dictionary mapping agent role to configuration
    """
    citation_suffix = " Include short inline quotes + citation tags for each sentence." if strict_mode else ""
    
    return {
        "product_owner": {
            "label": "Product Owner – Vision & Acceptance Criteria",
            "role": "Product Owner",
            "instructions": (
                "You are the Product Owner for a banking login EPIC. From the input, generate: \n"
                "1) A crisp vision statement for the EPIC.\n"
                "2) One or more INVEST-compliant user stories for an online banking login page.\n"
                "3) Detailed acceptance criteria using GIVEN/WHEN/THEN.\n"
                "Keep it specific to a web login (username/password, forgot password, remember me, lockout after failed attempts)."
                + (citation_suffix.replace("sentence", "sentence. Use [PO] tags") if strict_mode else "")
            ),
            "output_filename": "po_vision_userstories_ac.txt",
        },
        "scrum_master": {
            "label": "Scrum Master – Plan & Breakdown",
            "role": "Scrum Master",
            "instructions": (
                "You are the Scrum Master. Based on the PO artifacts, produce: \n"
                "- Sprint Goal (1-2 lines).\n"
                "- Task breakdown with estimates (in hours) across Backend, Frontend, Security, and Testing.\n"
                "- Risks & impediments with mitigations.\n"
                "- Definition of Done checklist."
                + (citation_suffix.replace("sentence", "sentence. Use [SM] tags") if strict_mode else "")
            ),
            "output_filename": "scrum_plan_breakdown.txt",
        },
        "developer": {
            "label": "Developer – Implementation Plan & Code Skeleton",
            "role": "Developer",
            "instructions": (
                "You are the Developer. Using PO acceptance criteria and SM plan, produce: \n"
                "- A concise technical design (frameworks, routing, auth flow).\n"
                "- A code skeleton for a minimal Flask app that serves a login page with CSRF protection and proper form validation.\n"
                "- Include a '/login' route (GET shows form, POST validates user), fake in-memory user store, password hashing with bcrypt.\n"
                "- Return the code in a single Python file called 'app_login.py' with clear comments."
                + (" Include citation tags [DEV] outside of code blocks." if strict_mode else "")
            ),
            "output_filename": "dev_design_and_app_login.py.txt",
        },
        "qa_automation": {
            "label": "QA Automation – Python Tests",
            "role": "QA Engineer",
            "instructions": (
                "You are a QA Automation engineer. Generate Playwright tests in **Python** (pytest/unittest style) for the banking login page.\n"
                "Include tests for: happy path login, invalid credentials, blank fields, lockout after failed attempts, and 'remember me'.\n"
                "Output a complete test module named 'tests/test_login.py' suitable for pytest or unittest discovery."
                + (" Include citation tags [QA] outside of code blocks." if strict_mode else "")
            ),
            "output_filename": "login_tests.py.txt",
        },
        "scrum_summary": {
            "label": "Scrum Summary (auto)",
            "role": "Release Manager",
            "instructions": (
                "You are a Release Manager summarizing outputs from PO, SM, DEV, QA. \n"
                "Produce a concise, executive-friendly summary highlighting scope, risks, and test readiness."
                + (citation_suffix.replace("sentence", "sentence. Use [SUMMARY] or [ACCEPT] tags") if strict_mode else "")
            ),
            "output_filename": "scrum_summary.txt",
        },
    }


def get_agent_list() -> list[str]:
    """Get list of all available agent roles."""
    return list(get_agent_configs().keys())


def get_agent_config(agent_name: str, strict_mode: bool = False) -> Dict[str, Any]:
    """
    Get configuration for a specific agent.
    
    Args:
        agent_name: Name of the agent role
        strict_mode: If True, adds citation tags
    
    Returns:
        Agent configuration dictionary
    
    Raises:
        KeyError: If agent name is not found
    """
    configs = get_agent_configs(strict_mode)
    if agent_name not in configs:
        raise KeyError(f"Agent '{agent_name}' not found. Available: {', '.join(configs.keys())}")
    return configs[agent_name]
