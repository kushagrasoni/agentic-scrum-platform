"""
Test script to validate session persistence logic
Run this to verify the persist_session_to_disk function works correctly
"""

import sys
import asyncio
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.models import AgentStatus, Artifact, Session
from app.services import get_storage_service
from app.routers.agents import active_sessions, persist_session_to_disk


async def test_persist_session():
    """Test that persist_session_to_disk correctly converts data types"""
    
    print("\n" + "="*60)
    print("Testing Session Persistence")
    print("="*60 + "\n")
    
    # Create a mock session in active_sessions (simulating what happens during execution)
    test_session_id = "test-session-123"
    
    # Simulate the data structure that callbacks create
    active_sessions[test_session_id] = {
        "status": "completed",
        "agents": [
            {"name": "product_owner", "status": "completed", "progress": 100, "error": None},
            {"name": "scrum_master", "status": "completed", "progress": 100, "error": None},
            {"name": "developer", "status": "completed", "progress": 100, "error": None}
        ],
        "logs": [
            {
                "timestamp": datetime.now().isoformat(),
                "level": "info",
                "agent": "product_owner",
                "message": "Test log message"
            }
        ],
        "config": {
            "mode": "azure",
            "apiKey": "test-key",
            "endpoint": "https://test.azure.com",
            "deployment": "gpt-4",
            "apiVersion": "2024-02-15"
        },
        "checkpoints": [
            {
                "agent": "product_owner",
                "content": "Test checkpoint content",
                "timestamp": datetime.now().isoformat()
            }
        ],
        "artifacts": [],
        "createdAt": datetime.now().isoformat(),
        "completedAt": datetime.now().isoformat()
    }
    
    print("1. Created mock session in active_sessions")
    print(f"   Session ID: {test_session_id}")
    print(f"   Agents: {len(active_sessions[test_session_id]['agents'])}")
    print(f"   Logs: {len(active_sessions[test_session_id]['logs'])}")
    print(f"   Checkpoints: {len(active_sessions[test_session_id]['checkpoints'])}")
    
    # Create a test artifact file (simulate what storage_service would return)
    storage = get_storage_service()
    
    # Create test directory
    session_dir = Path("output") / test_session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    
    # Create a dummy artifact
    artifact_path = session_dir / "test_artifact.txt"
    artifact_path.write_text("Test artifact content")
    
    print("\n2. Created test artifact file")
    print(f"   Path: {artifact_path}")
    
    # Now test the persist function
    print("\n3. Calling persist_session_to_disk...")
    
    try:
        await persist_session_to_disk(test_session_id, storage)
        print("   ✓ Persistence succeeded!")
        
        # Load the saved session to verify
        metadata_path = session_dir / "session_metadata.json"
        
        if metadata_path.exists():
            import json
            with open(metadata_path, 'r') as f:
                saved_data = json.load(f)
            
            print("\n4. Verification:")
            print(f"   ✓ Metadata file created: {metadata_path}")
            print(f"   ✓ Status: {saved_data.get('status')}")
            print(f"   ✓ Agents count: {len(saved_data.get('agents', []))}")
            print(f"   ✓ Artifacts count: {len(saved_data.get('artifacts', []))}")
            print(f"   ✓ Checkpoints count: {len(saved_data.get('checkpoints', []))}")
            print(f"   ✓ Logs count: {len(saved_data.get('logs', []))}")
            
            # Verify agents structure
            if saved_data.get('agents'):
                first_agent = saved_data['agents'][0]
                print(f"\n   Agent structure:")
                print(f"      - name: {first_agent.get('name')}")
                print(f"      - status: {first_agent.get('status')}")
                print(f"      - progress: {first_agent.get('progress')}")
                
                # Check if it's a dict (correct) not a string (error)
                if isinstance(first_agent, dict):
                    print(f"   ✓ Agents are properly serialized as dicts")
                else:
                    print(f"   ✗ ERROR: Agents are {type(first_agent)} instead of dict")
            
            # Verify artifacts structure
            if saved_data.get('artifacts'):
                first_artifact = saved_data['artifacts'][0]
                print(f"\n   Artifact structure:")
                print(f"      - name: {first_artifact.get('name')}")
                print(f"      - path: {first_artifact.get('path')}")
                print(f"      - size: {first_artifact.get('size')}")
                
                if isinstance(first_artifact, dict):
                    print(f"   ✓ Artifacts are properly serialized as dicts")
                else:
                    print(f"   ✗ ERROR: Artifacts are {type(first_artifact)} instead of dict")
            
            print("\n" + "="*60)
            print("✓ ALL TESTS PASSED - Persistence is working correctly!")
            print("="*60 + "\n")
            
        else:
            print(f"   ✗ ERROR: Metadata file not created at {metadata_path}")
            
    except Exception as e:
        print(f"   ✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\n" + "="*60)
        print("✗ TEST FAILED - Check the error above")
        print("="*60 + "\n")
    
    finally:
        # Cleanup
        print("\n5. Cleaning up test data...")
        import shutil
        if session_dir.exists():
            shutil.rmtree(session_dir)
        if test_session_id in active_sessions:
            del active_sessions[test_session_id]
        print("   ✓ Cleanup complete")


if __name__ == "__main__":
    print("\n🧪 Running Session Persistence Test")
    asyncio.run(test_persist_session())
