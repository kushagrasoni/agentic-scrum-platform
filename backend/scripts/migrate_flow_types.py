"""
Migration Script: Add flowType and flowLabel to existing sessions
Infers the flow type based on artifacts present in each session.
"""
import json
import os
from pathlib import Path
from typing import Optional, Tuple

# Agent artifact patterns for inference
AGENT_ARTIFACTS = {
    "product_owner": ["po_vision_userstories_ac", "epic_vision", "product_owner"],
    "scrum_master": ["scrum_plan_breakdown", "sprint_plan", "scrum_master"],
    "tech_lead": ["tech_design", "technical_design", "tech_lead"],
    "developer": ["dev_design_and_app", "code_implementation", "developer"],
    "qa_automation": ["login_tests", "test_suite", "qa_automation", "qa_engineer"],
    "release_manager": ["scrum_summary", "executive_summary", "release_manager"],
}

# Full workflow has all 6 agents
FULL_WORKFLOW_AGENTS = {"product_owner", "scrum_master", "tech_lead", "developer", "qa_automation", "release_manager"}


def get_agent_label(agent_key: str) -> str:
    """Get human-readable label for agent."""
    labels = {
        "product_owner": "Product Owner",
        "scrum_master": "Scrum Master",
        "tech_lead": "Tech Lead",
        "developer": "Developer",
        "qa_automation": "QA Engineer",
        "release_manager": "Release Manager",
    }
    return labels.get(agent_key, agent_key.replace("_", " ").title())


def infer_agents_from_artifacts(artifacts: list) -> set:
    """Infer which agents ran based on artifact filenames."""
    detected_agents = set()
    
    for artifact in artifacts:
        # Handle both string and dict artifacts
        artifact_name = artifact if isinstance(artifact, str) else artifact.get("name", "")
        artifact_lower = artifact_name.lower()
        
        for agent_key, patterns in AGENT_ARTIFACTS.items():
            for pattern in patterns:
                if pattern in artifact_lower:
                    detected_agents.add(agent_key)
                    break
    
    return detected_agents


def infer_flow_type(detected_agents: set) -> Tuple[str, str]:
    """
    Infer flow type and label based on detected agents.
    
    Returns:
        Tuple of (flowType, flowLabel)
    """
    agent_count = len(detected_agents)
    
    if agent_count == 0:
        return "feature_workflow", "Feature Workflow (Unknown)"
    
    if agent_count == 1:
        agent = list(detected_agents)[0]
        return "single_agent", f"Single Agent: {get_agent_label(agent)}"
    
    # Check if it's a full workflow (5-6 agents)
    if agent_count >= 5 or detected_agents >= FULL_WORKFLOW_AGENTS - {"release_manager"}:
        return "feature_workflow", "Feature Workflow: Full Team"
    
    # 2-4 agents = mini flow
    agent_labels = [get_agent_label(a) for a in sorted(detected_agents)]
    # Create abbreviated label
    abbreviations = {
        "Product Owner": "PO",
        "Scrum Master": "SM",
        "Tech Lead": "Tech",
        "Developer": "Dev",
        "QA Engineer": "QA",
        "Release Manager": "RM",
    }
    short_labels = [abbreviations.get(label, label[:3]) for label in agent_labels]
    flow_label = " -> ".join(short_labels)
    
    return "mini_flow", flow_label


def migrate_session(session_dir: Path) -> Optional[dict]:
    """
    Migrate a single session's metadata.
    
    Returns:
        Dict with migration info or None if skipped
    """
    metadata_path = session_dir / "session_metadata.json"
    
    if not metadata_path.exists():
        return None
    
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        return {"session_id": session_dir.name, "status": "error", "error": str(e)}
    
    # Skip if already has flowType
    if metadata.get("flowType"):
        return {"session_id": session_dir.name, "status": "skipped", "reason": "already has flowType"}
    
    # Get artifacts from metadata or scan directory
    artifacts = metadata.get("artifacts", [])
    if not artifacts:
        # Scan directory for artifact files
        artifacts = [f.name for f in session_dir.iterdir() if f.is_file() and f.name != "session_metadata.json"]
    
    # Infer agents and flow type
    detected_agents = infer_agents_from_artifacts(artifacts)
    flow_type, flow_label = infer_flow_type(detected_agents)
    
    # Update metadata
    metadata["flowType"] = flow_type
    metadata["flowLabel"] = flow_label
    
    # Write back
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, default=str)
    
    return {
        "session_id": session_dir.name,
        "status": "migrated",
        "flowType": flow_type,
        "flowLabel": flow_label,
        "detected_agents": list(detected_agents),
    }


def main():
    """Run migration on all sessions."""
    output_dir = Path(__file__).parent.parent / "output"
    
    if not output_dir.exists():
        print(f"Output directory not found: {output_dir}")
        return
    
    print(f"Scanning sessions in: {output_dir}")
    print("-" * 60)
    
    results = {"migrated": 0, "skipped": 0, "error": 0}
    
    for session_dir in output_dir.iterdir():
        if not session_dir.is_dir():
            continue
        
        result = migrate_session(session_dir)
        
        if result is None:
            continue
        
        status = result["status"]
        results[status] = results.get(status, 0) + 1
        
        if status == "migrated":
            print(f"[OK] {result['session_id'][:8]}... -> {result['flowType']} ({result['flowLabel']})")
            print(f"     Agents detected: {', '.join(result['detected_agents']) or 'none'}")
        elif status == "skipped":
            print(f"[SKIP] {result['session_id'][:8]}... ({result['reason']})")
        else:
            print(f"[ERROR] {result['session_id'][:8]}... - {result.get('error', 'unknown')}")
    
    print("-" * 60)
    print(f"Migration complete: {results['migrated']} migrated, {results['skipped']} skipped, {results['error']} errors")


if __name__ == "__main__":
    main()
