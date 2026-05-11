import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import CveIntelligence
from services.intel_service import intel_service

# High-Fidelity Seeding Data (The 'Real-World' Reality)
TOP_EXPLOITS = [
    {
        "cve_id": "CVE-2017-0144",
        "summary": "EternalBlue: SMB Remote Code Execution vulnerability in Windows. This was used in the WannaCry ransomware attack to spread across internal networks via port 445.",
        "cvss_score": 8.1,
        "severity": "CRITICAL",
        "exploit_available": 1,
        "remediation": "Apply Microsoft patch MS17-010 to all Windows machines. Disable SMBv1 across the domain.",
        "owasp_category": "A06:2021-Vulnerable and Outdated Components",
        "mitre_id": "T1210",
        "msf_module": "exploit/windows/smb/ms17_010_eternalblue",
        "edb_id": "41891"
    },
    {
        "cve_id": "CVE-2021-44228",
        "summary": "Log4Shell: Remote Code Execution in Apache Log4j 2. allows attackers to execute arbitrary code via JNDI lookup patterns in logs.",
        "cvss_score": 10.0,
        "severity": "CRITICAL",
        "exploit_available": 1,
        "remediation": "Upgrade Log4j to version 2.17.1 or higher. Set log4j2.formatMsgNoLookups=true if upgrading is impossible.",
        "owasp_category": "A03:2021-Injection",
        "mitre_id": "T1190",
        "msf_module": "exploit/multi/http/log4shell_header_injection",
        "edb_id": "50592"
    },
    {
        "cve_id": "CVE-2014-0160",
        "summary": "Heartbleed: Critical vulnerability in OpenSSL allowing sensitive data leakage (private keys, passwords) from memory via Heartbeat packets.",
        "cvss_score": 7.5,
        "severity": "HIGH",
        "exploit_available": 1,
        "remediation": "Update OpenSSL to version 1.0.1g or higher. Reissue all SSL/TLS certificates and rotate private keys.",
        "owasp_category": "A02:2021-Cryptographic Failures",
        "mitre_id": "T1557",
        "msf_module": "auxiliary/scanner/ssl/ssl_heartbleed",
        "edb_id": "32745"
    },
    {
        "cve_id": "CVE-2021-34473",
        "summary": "ProxyLogon: Microsoft Exchange Server RCE allowing an attacker to bypass authentication and execute code as SYSTEM.",
        "cvss_score": 9.8,
        "severity": "CRITICAL",
        "exploit_available": 1,
        "remediation": "Apply Microsoft cumulative security updates immediately. Investigate for web shells and unauthorized mail exports.",
        "owasp_category": "A01:2021-Broken Access Control",
        "mitre_id": "T1190",
        "msf_module": "exploit/windows/http/exchange_proxylogon_rce",
        "edb_id": "50088"
    },
    {
        "cve_id": "CVE-2020-0796",
        "summary": "SMBGhost: Remote Code Execution vulnerability in Microsoft Server Message Block 3.1.1 (SMBv3) compression logic.",
        "cvss_score": 10.0,
        "severity": "CRITICAL",
        "exploit_available": 1,
        "remediation": "Disable SMBv3 compression and apply latest Windows updates. Restrict port 445.",
        "owasp_category": "A06:2021-Vulnerable and Outdated Components",
        "mitre_id": "T1210",
        "msf_module": "exploit/windows/smb/smb_ghost_rce",
        "edb_id": "48216"
    }
]

def seed():
    db = SessionLocal()
    print("[INTEL_CORE] Seeding High-Fidelity exploits to 'Real Database'...")
    try:
        for intel in TOP_EXPLOITS:
            intel_service.upsert_intel(db, intel)
            print(f"  [+] Seeding {intel['cve_id']} - {intel['severity']}")
        print("[INTEL_CORE] Seeding complete. Intelligence Core is ONLINE.")
    except Exception as e:
        print(f"[INTEL_CORE] Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
