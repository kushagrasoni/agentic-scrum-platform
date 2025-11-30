"""
Config Profile Service
Persists provider configurations on disk.
"""
from __future__ import annotations

import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class ConfigProfileService:
    """Persist and retrieve provider configuration profiles."""

    def __init__(self, storage_path: str = "./data/llm_profiles/profiles.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.storage_path.exists():
            self._write({
                "ollama": [],
                "openai": [],
                "azure": []
            })

    def _read(self) -> Dict[str, List[Dict]]:
        return json.loads(self.storage_path.read_text(encoding="utf-8"))

    def _write(self, data: Dict[str, List[Dict]]):
        self.storage_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def list_profiles(self) -> Dict[str, List[Dict]]:
        return self._read()

    def add_profile(self, mode: str, name: str, data: Dict) -> Dict:
        profiles = self._read()
        now = datetime.utcnow().isoformat() + "Z"
        profile = {
            "llmProfileId": str(uuid.uuid4()),
            "name": name or "New Profile",
            "mode": mode,
            "data": data,
            "createdAt": now,
            "updatedAt": now,
        }
        profiles.setdefault(mode, []).append(profile)
        self._write(profiles)
        return profile

    def get_profile(self, profile_id: str) -> Optional[Dict]:
        profiles = self._read()
        for items in profiles.values():
            for item in items:
                if item.get("llmProfileId") == profile_id:
                    return item
        return None

    def update_profile(self, profile_id: str, mode: str, name: Optional[str], data: Optional[Dict]) -> Optional[Dict]:
        profiles = self._read()
        updated = None
        for m, items in profiles.items():
            for idx, item in enumerate(items):
                if item.get("llmProfileId") == profile_id:
                    if name is not None:
                        item["name"] = name
                    if data is not None:
                        item["data"] = data
                    item["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                    updated = item
                    # if mode changed, move profile
                    if m != mode:
                        profiles[m].pop(idx)
                        profiles.setdefault(mode, []).append(item)
                    break
        if updated:
            self._write(profiles)
        return updated

    def delete_profile(self, profile_id: str) -> bool:
        profiles = self._read()
        changed = False
        for m, items in profiles.items():
            remaining = [p for p in items if p.get("llmProfileId") != profile_id]
            if len(remaining) != len(items):
                profiles[m] = remaining
                changed = True
        if changed:
            self._write(profiles)
        return changed


_config_profile_service: Optional[ConfigProfileService] = None


def get_config_profile_service() -> ConfigProfileService:
    global _config_profile_service
    if _config_profile_service is None:
        _config_profile_service = ConfigProfileService()
    return _config_profile_service
