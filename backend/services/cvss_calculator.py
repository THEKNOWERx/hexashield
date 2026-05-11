from cvss import CVSS3, CVSS2
from typing import Dict, Union, Optional
import re
from decimal import Decimal

class CVSSCalculator:
    """
    PROFESSIONAL CVSS CALCULATOR MODULE (Security Engineer Grade)
    Calculates high-precision scores from vector strings with automated severity mapping.
    Resolves type-safety issues between Decimal (library core) and Float (UI/API).
    """

    @staticmethod
    def get_risk_level(score: float) -> str:
        """Standard NIST/FIRST Severity Rating Scale mapping."""
        if score == 0: return "None"
        if 0.1 <= score <= 3.9: return "Low"
        if 4.0 <= score <= 6.9: return "Medium"
        if 7.0 <= score <= 8.9: return "High"
        if 9.0 <= score <= 10.0: return "Critical"
        return "Unknown"

    @staticmethod
    def calculate(vector: str) -> Dict[str, Union[float, str, bool]]:
        """
        Parses a CVSS vector string (v2 or v3) and returns structured risk intelligence.
        """
        if not vector or not isinstance(vector, str):
            return {"error": "Invalid vector: Empty or non-string input.", "valid": False}

        try:
            # Determine CVSS version and initialize appropriate engine
            if vector.startswith("CVSS:3"):
                engine = CVSS3(vector)
                version_str = f"CVSS v3.{engine.minor_version}"
            elif "(" in vector and ")" in vector or "AV:" in vector: # Likely v2
                engine = CVSS2(vector)
                version_str = "CVSS v2.0"
            else:
                return {"error": "Unsupported CVSS version or malformed vector.", "valid": False}

            # Perform calculation with Type Safety (Decimal to Float)
            base_score = float(engine.base_score)
            risk_level = CVSSCalculator.get_risk_level(base_score)
            risk_percent = (base_score / 10.0) * 100

            return {
                "vector": vector,
                "score": base_score,
                "risk_level": risk_level,
                "risk_percentage": f"{risk_percent:.1f}%",
                "version": version_str,
                "valid": True,
                "metrics": {
                    "base_score": base_score,
                    "temporal_score": float(engine.temporal_score) if getattr(engine, "temporal_score", None) is not None else None,
                    "environmental_score": float(engine.environmental_score) if getattr(engine, "environmental_score", None) is not None else None
                }
            }
        except Exception as e:
            return {
                "vector": vector,
                "error": f"Validation Error: {str(e)}",
                "valid": False
            }

if __name__ == "__main__":
    # Test Suite for Security Engineer Verification
    test_vectors = [
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", # Critical (9.8)
        "CVSS:3.0/AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:L/A:L", # Medium (4.2)
        "AV:N/AC:L/Au:N/C:C/I:C/A:C" # CVSS v2 Critical (10.0)
    ]
    
    calculator = CVSSCalculator()
    print("--- CVSS SECURITY ENGINEER AUDIT ---")
    for v in test_vectors:
        res = calculator.calculate(v)
        if res.get("valid"):
            print(f"Vector: {v}")
            print(f"Version: {res['version']}")
            print(f"Result: {res['risk_level']} ({res['score']}) - {res['risk_percentage']}\n")
        else:
            print(f"Vector: {v}")
            print(f"Error: {res.get('error')}\n")
