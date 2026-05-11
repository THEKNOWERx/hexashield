import json
from typing import Dict, Any

def format_validation_json(data: Dict[str, Any]) -> str:
    """Task 11: Structured JSON Output"""
    return json.dumps(data, indent=4)
