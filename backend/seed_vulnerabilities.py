import sys
import os
from sqlalchemy.orm import Session

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import SessionLocal
from models import Scan, Finding

def seed_vulns():
    db = SessionLocal()
    try:
        # 1. Create a dummy scan if none exists
        scan = Scan(
            target="192.168.1.100",
            scan_type="Full Reconnaissance",
            status="Completed",
            findings_count=4
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # 2. Add the 4 specific vulnerabilities
        findings = [
            # SQL Injection
            Finding(
                scan_id=scan.id,
                name="SQL Injection Vulnerability",
                severity="Critical",
                cvss=9.8,
                owasp_category="A03:2021-Injection",
                description="Target application is susceptible to error-based SQL injection via the 'id' parameter. Attackers can extract the entire database schema and records.",
                remediation="Use parameterized queries (Prepared Statements) and sanitize all user input before processing.",
                port=80,
                cve_id="CVE-2022-XXXX"
            ),
            # XSS
            Finding(
                scan_id=scan.id,
                name="Cross-Site Scripting (XSS) Found",
                severity="High",
                cvss=8.1,
                owasp_category="A03:2021-Injection",
                description="Reflected XSS discovered in the search results page. Malicious scripts can be executed in the context of the user's browser, leading to session hijacking.",
                remediation="Implement Content Security Policy (CSP) and use context-aware output encoding.",
                port=443,
                cve_id="CVE-2023-YYYY"
            ),
            # Broken Access Control
            Finding(
                scan_id=scan.id,
                name="Broken Access Control Alert",
                severity="High",
                cvss=8.8,
                owasp_category="A01:2021-Broken Access Control",
                description="Unauthorized access to administrative endpoints identified. Standard users can access /api/admin/config without proper authentication tokens.",
                remediation="Enforce server-side access control checks for every sensitive endpoint.",
                port=8080,
                cve_id="CVE-2024-ZZZZ"
            ),
            # Cryptographic Failure
            Finding(
                scan_id=scan.id,
                name="Critical Cryptographic Failure",
                severity="Medium",
                cvss=6.5,
                owasp_category="A02:2021-Cryptographic Failures",
                description="Target is using outdated TLS 1.0 protocol and weak MD5 hashing for password storage.",
                remediation="Upgrade to TLS 1.2/1.3 and migrate to Argon2 or Bcrypt for password hashing.",
                port=443,
                cve_id="CVE-2021-WWWW"
            )
        ]
        
        db.bulk_save_objects(findings)
        db.commit()
        print(f"Successfully seeded {len(findings)} vulnerabilities for scan ID {scan.id}")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_vulns()
