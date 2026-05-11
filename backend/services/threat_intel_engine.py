import random
from typing import List, Dict, Any

class ThreatIntelEngine:
    """
    ADVANCED THREAT INTELLIGENCE ENGINE
    Transforms vulnerabilities into tactical attack scenarios and custom risk scores.
    """

    MITRE_MAP = {
        "RCE": {"id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access"},
        "PRIVILEGE": {"id": "T1068", "name": "Exploitation for Privilege Escalation", "tactic": "Privilege Escalation"},
        "COMMAND_EXEC": {"id": "T1059", "name": "Command and Scripting Interpreter", "tactic": "Execution"},
        "INJECTION": {"id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access"},
        "DIRECTORY_TRAVERSAL": {"id": "T1005", "name": "Data from Local System", "tactic": "Collection"},
        "AUTH_BYPASS": {"id": "T1548", "name": "Abuse Elevation Control Mechanism", "tactic": "Privilege Escalation"}
    }

    @staticmethod
    def get_mitre_mapping(cve_id: str, description: str) -> Dict[str, str]:
        """Maps CVE to MITRE ATT&CK techniques based on semantic analysis."""
        d_lower = description.lower()
        if "remote code execution" in d_lower or "rce" in d_lower:
            return ThreatIntelEngine.MITRE_MAP["RCE"]
        if "privilege escalation" in d_lower or "escalate" in d_lower:
            return ThreatIntelEngine.MITRE_MAP["PRIVILEGE"]
        if "command" in d_lower and "exec" in d_lower:
            return ThreatIntelEngine.MITRE_MAP["COMMAND_EXEC"]
        if "injection" in d_lower:
            return ThreatIntelEngine.MITRE_MAP["INJECTION"]
        if "traversal" in d_lower:
            return ThreatIntelEngine.MITRE_MAP["DIRECTORY_TRAVERSAL"]
        if "bypass" in d_lower and "auth" in d_lower:
            return ThreatIntelEngine.MITRE_MAP["AUTH_BYPASS"]
        
        # Default: General exploitation
        return {"technique_id": "T1190", "technique_name": "Exploit Public-Facing Application", "tactic": "Initial Access"}

    @staticmethod
    def calculate_custom_risk(cvss: float, exploit_available: bool, service_name: str, mitre_tactic: str) -> Dict[str, Any]:
        """
        Calculates a custom 0-100 Risk Score.
        Formula: (CVSS * 6) + (Exploit Bonus) + (Criticality Weight) + (Impact Weight)
        """
        base = cvss * 6  # Max 60
        exploit_bonus = 15 if exploit_available else 0
        
        # Service Criticality
        critical_services = ["database", "mysql", "postgresql", "oracle", "db", "rdp", "ssh"]
        med_services = ["web", "http", "https", "nginx", "apache"]
        
        service_weight = 0
        s_lower = service_name.lower()
        if any(s in s_lower for s in critical_services): service_weight = 15
        elif any(s in s_lower for s in med_services): service_weight = 8
        
        # MITRE Impact
        impact_weight = 0
        if mitre_tactic in ["Execution", "Privilege Escalation", "Initial Access"]:
            impact_weight = 10
            
        total_score = min(100, base + exploit_bonus + service_weight + impact_weight)
        
        level = "Low"
        if total_score >= 81: level = "Critical"
        elif total_score >= 61: level = "High"
        elif total_score >= 31: level = "Medium"
        
        return {
            "score": round(total_score, 1),
            "level": level
        }

    @staticmethod
    def generate_scenario(cve_id: str, service: str, technique: str) -> List[str]:
        """Generates a realistic, step-by-step attack scenario."""
        scenarios = [
            f"Attacker identifies target infrastructure via reconnaissance, discovering vulnerable {service}.",
            f"Deep-dive analysis confirms susceptiblity to {cve_id} (Technique: {technique}).",
            f"Weaponized exploit is delivered to the service interface.",
        ]
        
        if "Initial Access" in technique or "Execution" in technique:
            scenarios.append("Payload executes in the context of the service, granting an initial foothold.")
            scenarios.append("Attacker establishes a reverse shell / command channel.")
        elif "Privilege Escalation" in technique:
            scenarios.append("Attacker uses existing limited access to execute the elevation exploit.")
            scenarios.append("Successful hijacking of process token results in ROOT / SYSTEM level control.")
        else:
            scenarios.append("Attack results in unauthorized data access or service disruption.")
            
        scenarios.append("Attack chain concludes with evidence of target compromise and potential lateral movement.")
        return scenarios
