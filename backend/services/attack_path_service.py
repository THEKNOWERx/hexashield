import networkx as nx
import os
import json
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import RandomForestClassifier

# --- MITRE & EXPLOIT KNOWLEDGE BASE (REAL-WORLD DATA) ---
VULN_KB = {
    "CVE-2021-44228": {
        "technique": "T1190", 
        "technique_name": "Exploit Public-Facing Application",
        "exploit": "metasploit/exploit/multi/http/log4j_ghostwriter",
        "payload": "java -jar log4j-shell.jar -i {IP} -p {PORT}",
        "outcome": "Remote Code Execution (RCE) via JNDI injection."
    },
    "CVE-2017-0144": {
        "technique": "T1210",
        "technique_name": "Exploitation of Remote Services",
        "exploit": "metasploit/exploit/windows/smb/ms17_010_eternalblue",
        "payload": "msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST={IP}",
        "outcome": "Kernel-level RCE on unpatched SMBv1 systems."
    },
    "CVE-2014-6271": {
        "technique": "T1190",
        "technique_name": "Exploit Public-Facing Application",
        "exploit": "exploit-db/34765.py",
        "payload": "env x='() { :;}; echo vulnerable' bash -c 'echo test'",
        "outcome": "Environment variable injection through CGI/Bash."
    },
    "CVE-2019-11043": {
        "technique": "T1190",
        "technique_name": "Exploit Public-Facing Application",
        "exploit": "github/neex/phuip-fpizdam",
        "payload": "fpm-shell-exploit --url http://{IP}/index.php",
        "outcome": "PHP-FPM remote code execution via fastcgi_split_path_info."
    },
    "CVE-2023-22515": {
        "technique": "T1190",
        "technique_name": "Exploit Public-Facing Application",
        "exploit": "exploit-db/51812",
        "payload": "/setup/setup-restore.action - protocol-poisoning",
        "outcome": "Broken access control in Atlassian Confluence allowing admin creation."
    },
    "CVE-2022-22965": {
        "technique": "T1190",
        "technique_name": "Exploit Public-Facing Application",
        "exploit": "metasploit/exploit/multi/http/spring_framework_rce_spring4shell",
        "payload": "Spring4Shell-POC.py --url http://{IP}",
        "outcome": "Unauthenticated RCE in Spring Framework on JDK 9+."
    },
    "CVE-2021-31166": {
        "technique": "T1210",
        "technique_name": "Exploitation of Remote Services",
        "exploit": "github/maasir89/CVE-2021-31166",
        "payload": "exploit.py --target {IP}",
        "outcome": "Remote Kernel Heap Overflow in HTTP.sys (Windows)."
    }
}

class AttackPathService:
    def __init__(self):
        self.model = self._train_risk_model()
        
    def _train_risk_model(self):
        """Simulates a trained Random Forest model based on academic evaluation."""
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        X = np.array([
            [9.8, 1, 5, 1], [3.2, 0, 2, 0], [7.5, 1, 4, 1], [5.0, 0, 3, 1],
            [10.0, 1, 5, 0], [2.0, 0, 5, 1], [8.8, 1, 3, 1], [6.1, 1, 4, 0]
        ])
        y = np.array([3, 0, 2, 1, 3, 0, 2, 1]) 
        rf.fit(X, y)
        return rf

    def get_score(self, cvss: float, exploit_avail: int, importance: int, exposure: str) -> Dict:
        """AI-Based Risk Scoring."""
        exp_val = 1 if exposure.lower() == "public" else 0
        input_data = np.array([[cvss, exploit_avail, importance, exp_val]])
        pred = self.model.predict(input_data)[0]
        probs = self.model.predict_proba(input_data)[0]
        levels = ["Low", "Medium", "High", "Critical"]
        return {
            "level": levels[pred],
            "confidence": float(np.max(probs)),
            "numeric": int(pred)
        }

    def get_exploit_probability(self, cvss: float, exploit_avail: int) -> float:
        """Calculates approximate likelihood of exploitation."""
        base = cvss / 10.0
        if exploit_avail: base += 0.2
        return min(0.99, base)

    def predict_next_move(self, current_finding_cve: str) -> Dict[str, str]:
        """Predicts the likely next lateral movement step based on current TTP."""
        mappings = {
            "T1190": {"next": "T1059", "name": "Command and Scripting Interpreter", "goal": "Lateral Movement"},
            "T1210": {"next": "T1078", "name": "Valid Accounts", "goal": "Privilege Escalation"},
            "None": {"next": "T1046", "name": "Network Service Discovery", "goal": "Reconnaissance"}
        }
        kb = VULN_KB.get(current_finding_cve, {})
        tech = kb.get("technique", "None")
        return mappings.get(tech, mappings["None"])

    # ------------------------------------------------------------- intelligence
    @staticmethod
    def _infer_technique(finding) -> Dict[str, str]:
        """Resolve a MITRE technique + outcome for ANY finding, not just known CVEs."""
        cve = getattr(finding, "cve_id", None)
        kb = VULN_KB.get(cve)
        if kb:
            return {
                "technique": kb["technique"],
                "technique_name": kb["technique_name"],
                "outcome": kb["outcome"],
            }

        # Generalised inference from the finding's own metadata.
        mitre = getattr(finding, "mitre_id", None)
        name = (getattr(finding, "name", "") or "").lower()
        owasp = (getattr(finding, "owasp_category", "") or "")
        port = getattr(finding, "port", None)

        remote_svc_ports = {135, 139, 445, 3389, 22, 23, 1433, 3306, 5432}
        if port in remote_svc_ports or any(k in name for k in ["smb", "rdp", "ssh", "rpc", "netbios"]):
            technique, tname = "T1210", "Exploitation of Remote Services"
        elif any(k in name for k in ["sql", "injection", "xss", "rce", "traversal", "upload", "deserial"]):
            technique, tname = "T1190", "Exploit Public-Facing Application"
        elif "auth" in name or "credential" in name or "default" in name or owasp.startswith("A07"):
            technique, tname = "T1078", "Valid Accounts"
        else:
            technique, tname = "T1190", "Exploit Public-Facing Application"

        sev = (getattr(finding, "severity", "") or "").capitalize()
        if sev == "Critical":
            outcome = f"Critical exposure enabling full compromise via {getattr(finding, 'name', 'the service')}."
        elif sev == "High":
            outcome = f"High-impact weakness in {getattr(finding, 'name', 'the service')} allowing unauthorised access."
        elif sev == "Medium":
            outcome = f"Moderate exposure in {getattr(finding, 'name', 'the service')} aiding further intrusion."
        else:
            outcome = f"Information exposure via {getattr(finding, 'name', 'the service')}."

        return {"technique": technique, "technique_name": tname, "outcome": outcome}

    def generate_graph(self, scan_data: Any) -> Dict[str, Any]:
        """Translate real scan findings into a staged, multi-step attack graph."""
        target = scan_data.target
        findings = list(getattr(scan_data, "findings", []) or [])
        importance = getattr(scan_data, "asset_importance", 3)
        exposure = getattr(scan_data, "exposure", "Public")
        is_public = str(exposure).lower() == "public"

        G = nx.DiGraph()

        # Stage 0 — Adversary entry point.
        attacker_id = "adversary_actor"
        G.add_node(attacker_id, label="Adversary", type="Entry", stage=0,
                   detail="External threat actor initiating the intrusion.")

        # Stage 1 — Target host.
        host_id = f"host_{target}"
        G.add_node(host_id, label=target, type="Host", stage=1, importance=importance,
                   detail=f"{'Internet-facing' if is_public else 'Internal'} asset (importance {importance}/5).")
        G.add_edge(attacker_id, host_id, label="INITIAL ACCESS" if is_public else "INTERNAL ACCESS")

        # Rank findings by severity/score; keep the graph readable.
        def _score(f):
            return (1 if (getattr(f, "severity", "") or "").lower() == "critical" else 0,
                    getattr(f, "cvss", 0) or 0)
        findings = sorted(findings, key=_score, reverse=True)[:8]

        prioritized_risks = []
        service_nodes = {}

        for f in findings:
            cve = getattr(f, "cve_id", None) or f"FINDING-{getattr(f, 'id', '?')}"
            intel = self._infer_technique(f)
            exploit_avail = 1 if (VULN_KB.get(getattr(f, "cve_id", None)) or getattr(f, "exploit_db_id", None)) else 0
            cvss = getattr(f, "cvss", 0) or 0.0

            exploit_prob = self.get_exploit_probability(cvss, exploit_avail)
            risk = self.get_score(cvss, exploit_avail, importance, exposure)
            port = getattr(f, "port", None)

            # Stage 2 — Service / port (optional).
            parent_id = host_id
            if port:
                svc_id = f"service_{port}"
                if svc_id not in service_nodes:
                    G.add_node(svc_id, label=f"Port {port}", type="Service", stage=2,
                               detail=f"Exposed service listening on port {port}.")
                    G.add_edge(host_id, svc_id, label="EXPOSES")
                    service_nodes[svc_id] = True
                parent_id = svc_id

            # Stage 3 — Vulnerability.
            vuln_id = f"vuln_{cve}_{getattr(f, 'id', id(f))}"
            G.add_node(vuln_id, label=cve, type="Vulnerability", stage=3,
                       risk=risk["level"], prob=round(exploit_prob, 2),
                       mitre=intel["technique"], cvss=cvss,
                       detail=getattr(f, "name", cve))
            G.add_edge(parent_id, vuln_id, label="VULNERABLE")

            # Stage 4 — Impact.
            imp_id = f"impact_{vuln_id}"
            G.add_node(imp_id, label=intel["outcome"][:60], type="Impact", stage=4,
                       risk=risk["level"], detail=intel["outcome"])
            G.add_edge(vuln_id, imp_id, label="LEADS TO")

            next_step = self.predict_next_move(getattr(f, "cve_id", "None"))
            prioritized_risks.append({
                "cve": cve,
                "name": getattr(f, "name", cve),
                "risk_level": risk["level"],
                "exploit_prob": round(exploit_prob, 2),
                "confidence": round(risk["confidence"], 2),
                "mitre_tech": intel["technique"],
                "next_expected_move": next_step["name"],
                "attacker_goal": next_step["goal"],
                "action": f"Remediate immediately — {intel['outcome']}" if risk["level"] in ("Critical", "High") else "Monitor and schedule remediation.",
            })

        # Stage 5 — Objective, reached only if a serious impact exists.
        serious = [r for r in prioritized_risks if r["risk_level"] in ("Critical", "High")]
        if serious:
            obj_id = "objective_compromise"
            G.add_node(obj_id, label="Asset / Domain Compromise", type="Objective", stage=5,
                       detail="Adversary objective: full control of the target environment.")
            for n in list(G.nodes()):
                if G.nodes[n].get("type") == "Impact" and G.nodes[n].get("risk") in ("Critical", "High"):
                    G.add_edge(n, obj_id, label="ENABLES")

        prioritized_risks = sorted(
            prioritized_risks,
            key=lambda x: (x["risk_level"] == "Critical", x["exploit_prob"]),
            reverse=True,
        )

        scenario = "No exploitable attack paths were identified for this target."
        if prioritized_risks:
            top = prioritized_risks[0]
            scenario = (
                f"An adversary targets {target} through {top['name']} "
                f"(exploit likelihood {int(top['exploit_prob'] * 100)}%), "
                f"with the goal of {top['attacker_goal'].lower()}."
            )

        nodes = [{
            "id": n,
            "label": G.nodes[n].get("label"),
            "type": G.nodes[n].get("type"),
            "stage": G.nodes[n].get("stage", 0),
            "risk": G.nodes[n].get("risk"),
            "prob": G.nodes[n].get("prob"),
            "mitre": G.nodes[n].get("mitre"),
            "cvss": G.nodes[n].get("cvss"),
            "detail": G.nodes[n].get("detail"),
        } for n in G.nodes()]

        links = [{"source": u, "target": v, "label": d.get("label", "")} for u, v, d in G.edges(data=True)]

        critical_count = sum(1 for r in prioritized_risks if r["risk_level"] == "Critical")
        top_prob = max((r["exploit_prob"] for r in prioritized_risks), default=0.0)

        return {
            "target": target,
            "graph": {"nodes": nodes, "links": links},
            "predictive_analysis": {
                "top_risks": prioritized_risks[:3],
                "threat_scenario": scenario,
                "remediation_priority": prioritized_risks[:5],
            },
            "metrics": {
                "paths": len([n for n in nodes if n["type"] == "Vulnerability"]),
                "critical": critical_count,
                "max_exploit_prob": round(top_prob, 2),
                "exposure": exposure,
            },
        }


attack_path_service = AttackPathService()
