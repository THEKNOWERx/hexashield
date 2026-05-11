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

    def generate_graph(self, scan_data: Any) -> Dict[str, Any]:
        """
        [PREDICTIVE SOC ENGINE] Translates scan data into tactical decision intelligence.
        """
        target = scan_data.target
        findings = scan_data.findings
        importance = getattr(scan_data, 'asset_importance', 3)
        exposure = getattr(scan_data, 'exposure', 'Public')
        
        G = nx.DiGraph()
        attacker_id = "adversary_actor"
        G.add_node(attacker_id, label="Adversary Vector", type="Entry", color="#0055ff")
        
        host_id = f"host_{target}"
        G.add_node(host_id, label=target, type="Host", importance=importance, exposure=exposure)
        
        if exposure.lower() == "public":
            G.add_edge(attacker_id, host_id, label="INITIAL_ACCESS")

        prioritized_risks = []
        for f in findings:
            cve = f.cve_id
            kb_entry = VULN_KB.get(cve)
            if not kb_entry: continue
                
            exploit_prob = self.get_exploit_probability(f.cvss, 1 if kb_entry.get('exploit') else 0)
            risk = self.get_score(f.cvss, 1 if kb_entry.get('exploit') else 0, importance, exposure)
            next_step = self.predict_next_move(f.cve_id)
            
            risk_intel = {
                "cve": cve,
                "name": f.name,
                "risk_level": risk['level'],
                "exploit_prob": exploit_prob,
                "confidence": risk['confidence'],
                "mitre_tech": kb_entry['technique'],
                "next_expected_move": next_step['name'],
                "attacker_goal": next_step['goal'],
                "action": f"PATCH_ASAP // {kb_entry['outcome']}" if risk['level'] in ["Critical", "High"] else "MONITOR"
            }
            
            vuln_id = f"vuln_{cve}"
            imp_id = f"impact_{cve}"
            G.add_node(vuln_id, label=cve, type="Vulnerability", risk=risk['level'], prob=exploit_prob)
            G.add_node(imp_id, label=kb_entry['outcome'], type="Impact", color="#ff004c")
            
            G.add_edge(host_id, vuln_id, label="EXPOSED")
            G.add_edge(vuln_id, imp_id, label="LEADS_TO")
            
            prioritized_risks.append(risk_intel)

        prioritized_risks = sorted(prioritized_risks, key=lambda x: (x['risk_level'] == 'Critical', x['exploit_prob']), reverse=True)

        scenario = "No active threats detected."
        if prioritized_risks:
            top = prioritized_risks[0]
            scenario = f"Adversary targets {target} via {top['name']} (Prob: {int(top['exploit_prob']*100)}%) with the immediate goal of {top['attacker_goal']}."

        return {
            "graph": {
                "nodes": [{"id": n, "label": G.nodes[n]['label'], "type": G.nodes[n].get('type'), "risk": G.nodes[n].get('risk'), "color": G.nodes[n].get('color')} for n in G.nodes()],
                "links": [{"source": u, "target": v, "label": d['label']} for u, v, d in G.edges(data=True)]
            },
            "predictive_analysis": {
                "top_risks": prioritized_risks[:3],
                "threat_scenario": scenario,
                "remediation_priority": prioritized_risks[:5]
            }
        }

attack_path_service = AttackPathService()
