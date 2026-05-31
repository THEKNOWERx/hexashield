"""
HexaShield — Realistic intelligence seed.

Populates the database with a professional, believable penetration-testing
dataset: multiple authorized engagements, real CVE-backed findings with CVSS,
OWASP and MITRE ATT&CK mappings, remediation guidance, CVE intelligence,
audit logs and operator notifications.

This is deterministic and idempotent: it (re)builds the engagement dataset
whenever the database has no findings, so the UI always has real content.
"""
from datetime import datetime, timedelta
import json

from database.db import SessionLocal
from models import (
    User, Scan, Finding, CveIntelligence, Notification, AuditLog, AuthorizedScope
)

# --- Engagement catalog -----------------------------------------------------
# Each engagement is an authorized assessment with realistic findings.
# Severities are UPPERCASE to match API counters and frontend filters.

ENGAGEMENTS = [
    {
        "target": "10.10.14.21",
        "scan_type": "FULL_INFRASTRUCTURE",
        "exposure": "Internal",
        "asset_importance": 5,
        "age_days": 1,
        "recon": {"os": "Ubuntu 20.04.6 LTS", "hostname": "app-prod-01",
                   "open_ports": [22, 80, 443, 8080], "geo": "Internal / DC-East"},
        "findings": [
            {
                "name": "Apache Log4j2 Remote Code Execution (Log4Shell)",
                "severity": "CRITICAL", "cvss": 10.0, "cve_id": "CVE-2021-44228",
                "owasp_category": "A06:2021 - Vulnerable and Outdated Components",
                "mitre_id": "T1190", "port": 8080,
                "description": "The application embeds a vulnerable Log4j2 version that evaluates "
                               "attacker-controlled JNDI lookup strings, allowing unauthenticated "
                               "remote code execution via a crafted request header.",
                "remediation": "Upgrade Log4j2 to 2.17.1 or later. As an interim control set "
                               "log4j2.formatMsgNoLookups=true and remove the JndiLookup class.",
                "exploit_db_id": "50592",
                "reference_url": "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
            },
            {
                "name": "SQL Injection in Authentication Endpoint",
                "severity": "CRITICAL", "cvss": 9.8, "cve_id": "N/A",
                "owasp_category": "A03:2021 - Injection",
                "mitre_id": "T1190", "port": 443,
                "description": "The /api/login parameter 'username' is concatenated directly into a "
                               "SQL statement, permitting authentication bypass and full database "
                               "extraction via UNION-based injection.",
                "remediation": "Use parameterized queries / prepared statements and an ORM. "
                               "Apply least-privilege database accounts and input allow-listing.",
                "exploit_db_id": None,
                "reference_url": "https://owasp.org/Top10/A03_2021-Injection/",
            },
            {
                "name": "Outdated OpenSSH Version Disclosure",
                "severity": "MEDIUM", "cvss": 5.3, "cve_id": "CVE-2020-15778",
                "owasp_category": "A06:2021 - Vulnerable and Outdated Components",
                "mitre_id": "T1592", "port": 22,
                "description": "SSH service banner discloses OpenSSH 8.2p1, which contains a known "
                               "scp command-injection issue and aids version-specific targeting.",
                "remediation": "Upgrade OpenSSH to the current release and suppress version banners "
                               "where operationally feasible.",
                "exploit_db_id": None,
                "reference_url": "https://nvd.nist.gov/vuln/detail/CVE-2020-15778",
            },
            {
                "name": "Missing HTTP Security Headers",
                "severity": "LOW", "cvss": 3.1, "cve_id": "N/A",
                "owasp_category": "A05:2021 - Security Misconfiguration",
                "mitre_id": "T1190", "port": 443,
                "description": "Responses omit Content-Security-Policy, X-Frame-Options and "
                               "Strict-Transport-Security, increasing exposure to clickjacking and "
                               "protocol-downgrade attacks.",
                "remediation": "Add CSP, X-Frame-Options: DENY, HSTS and X-Content-Type-Options "
                               "headers at the reverse proxy.",
                "exploit_db_id": None,
                "reference_url": "https://owasp.org/www-project-secure-headers/",
            },
        ],
    },
    {
        "target": "192.168.1.50",
        "scan_type": "DMZ_WEB_AUDIT",
        "exposure": "Public",
        "asset_importance": 4,
        "age_days": 2,
        "recon": {"os": "Windows Server 2016", "hostname": "web-dmz-02",
                   "open_ports": [80, 443, 445, 3389], "geo": "DMZ / Edge"},
        "findings": [
            {
                "name": "SMBv1 Remote Code Execution (EternalBlue)",
                "severity": "CRITICAL", "cvss": 9.3, "cve_id": "CVE-2017-0144",
                "owasp_category": "A06:2021 - Vulnerable and Outdated Components",
                "mitre_id": "T1210", "port": 445,
                "description": "The host exposes SMBv1 and is vulnerable to the MS17-010 EternalBlue "
                               "exploit, enabling unauthenticated remote code execution at SYSTEM.",
                "remediation": "Disable SMBv1, apply MS17-010 patches and restrict SMB to internal "
                               "management VLANs only.",
                "exploit_db_id": "42315",
                "reference_url": "https://nvd.nist.gov/vuln/detail/CVE-2017-0144",
            },
            {
                "name": "BlueKeep RDP Pre-Auth RCE",
                "severity": "CRITICAL", "cvss": 9.8, "cve_id": "CVE-2019-0708",
                "owasp_category": "A06:2021 - Vulnerable and Outdated Components",
                "mitre_id": "T1210", "port": 3389,
                "description": "Remote Desktop Services is vulnerable to a pre-authentication "
                               "use-after-free permitting wormable remote code execution.",
                "remediation": "Apply the BlueKeep patch, enable Network Level Authentication and "
                               "place RDP behind a VPN / bastion host.",
                "exploit_db_id": "47416",
                "reference_url": "https://nvd.nist.gov/vuln/detail/CVE-2019-0708",
            },
            {
                "name": "Exposed Remote Desktop on Public Interface",
                "severity": "HIGH", "cvss": 7.4, "cve_id": "N/A",
                "owasp_category": "A05:2021 - Security Misconfiguration",
                "mitre_id": "T1133", "port": 3389,
                "description": "RDP (3389) is reachable from untrusted networks, exposing the host to "
                               "brute-force and credential-stuffing campaigns.",
                "remediation": "Remove direct RDP exposure; require VPN, MFA and account lockout "
                               "policies.",
                "exploit_db_id": None,
                "reference_url": "https://attack.mitre.org/techniques/T1133/",
            },
            {
                "name": "TLS POODLE / SSLv3 Fallback Supported",
                "severity": "MEDIUM", "cvss": 5.0, "cve_id": "CVE-2014-3566",
                "owasp_category": "A02:2021 - Cryptographic Failures",
                "mitre_id": "T1040", "port": 443,
                "description": "The TLS endpoint negotiates legacy SSLv3, permitting a POODLE "
                               "padding-oracle attack against session data.",
                "remediation": "Disable SSLv3 and TLS 1.0/1.1; enforce TLS 1.2+ with modern ciphers.",
                "exploit_db_id": None,
                "reference_url": "https://nvd.nist.gov/vuln/detail/CVE-2014-3566",
            },
        ],
    },
    {
        "target": "demo.hexa-shield.io",
        "scan_type": "WEB_APPLICATION",
        "exposure": "Public",
        "asset_importance": 3,
        "age_days": 4,
        "recon": {"os": "nginx / Debian 11", "hostname": "demo.hexa-shield.io",
                   "open_ports": [80, 443], "geo": "EU-West / CDN"},
        "findings": [
            {
                "name": "Reflected Cross-Site Scripting (XSS)",
                "severity": "HIGH", "cvss": 7.1, "cve_id": "N/A",
                "owasp_category": "A03:2021 - Injection",
                "mitre_id": "T1059", "port": 443,
                "description": "The 'q' search parameter reflects unsanitized input into the DOM, "
                               "allowing arbitrary JavaScript execution in a victim's session.",
                "remediation": "Context-aware output encoding, a strict CSP and framework "
                               "auto-escaping. Validate and sanitize all user input.",
                "exploit_db_id": None,
                "reference_url": "https://owasp.org/www-community/attacks/xss/",
            },
            {
                "name": "Sensitive Data Exposure via Open .git Directory",
                "severity": "MEDIUM", "cvss": 6.5, "cve_id": "N/A",
                "owasp_category": "A01:2021 - Broken Access Control",
                "mitre_id": "T1083", "port": 443,
                "description": "The web root exposes a downloadable .git directory, leaking source "
                               "code, history and potentially hard-coded secrets.",
                "remediation": "Block access to dot-directories at the web server and remove VCS "
                               "metadata from production builds.",
                "exploit_db_id": None,
                "reference_url": "https://owasp.org/www-project-web-security-testing-guide/",
            },
            {
                "name": "Clickjacking — X-Frame-Options Not Set",
                "severity": "LOW", "cvss": 3.5, "cve_id": "N/A",
                "owasp_category": "A05:2021 - Security Misconfiguration",
                "mitre_id": "T1185", "port": 443,
                "description": "Pages can be embedded in third-party frames, enabling UI-redress "
                               "(clickjacking) attacks against authenticated users.",
                "remediation": "Set X-Frame-Options: DENY and a frame-ancestors CSP directive.",
                "exploit_db_id": None,
                "reference_url": "https://owasp.org/www-community/attacks/Clickjacking",
            },
        ],
    },
    {
        "target": "testphp.vulnweb.com",
        "scan_type": "WEB_APPLICATION",
        "exposure": "Public",
        "asset_importance": 2,
        "age_days": 6,
        "recon": {"os": "nginx", "hostname": "testphp.vulnweb.com",
                   "open_ports": [80], "geo": "Authorized test range"},
        "findings": [
            {
                "name": "Apache Struts2 OGNL Remote Code Execution",
                "severity": "CRITICAL", "cvss": 10.0, "cve_id": "CVE-2017-5638",
                "owasp_category": "A03:2021 - Injection",
                "mitre_id": "T1190", "port": 80,
                "description": "A crafted Content-Type header triggers OGNL evaluation in the Jakarta "
                               "multipart parser, yielding unauthenticated remote code execution.",
                "remediation": "Upgrade Struts to a fixed release and add a WAF rule blocking OGNL "
                               "payloads in Content-Type.",
                "exploit_db_id": "41570",
                "reference_url": "https://nvd.nist.gov/vuln/detail/CVE-2017-5638",
            },
            {
                "name": "Bash Shellshock Command Injection",
                "severity": "CRITICAL", "cvss": 9.8, "cve_id": "CVE-2014-6271",
                "owasp_category": "A03:2021 - Injection",
                "mitre_id": "T1190", "port": 80,
                "description": "A CGI endpoint passes attacker-controlled headers into Bash, allowing "
                               "trailing function definitions to execute arbitrary commands.",
                "remediation": "Patch Bash, retire CGI where possible and isolate legacy services.",
                "exploit_db_id": "34900",
                "reference_url": "https://nvd.nist.gov/vuln/detail/CVE-2014-6271",
            },
            {
                "name": "Anonymous Directory Listing Enabled",
                "severity": "LOW", "cvss": 2.7, "cve_id": "N/A",
                "owasp_category": "A05:2021 - Security Misconfiguration",
                "mitre_id": "T1083", "port": 80,
                "description": "Directory indexing reveals file and folder structure, assisting "
                               "attackers in mapping the application surface.",
                "remediation": "Disable autoindex and serve explicit index files only.",
                "exploit_db_id": None,
                "reference_url": "https://owasp.org/www-project-web-security-testing-guide/",
            },
        ],
    },
    {
        "target": "127.0.0.1",
        "scan_type": "LOCALHOST_BASELINE",
        "exposure": "Internal",
        "asset_importance": 3,
        "age_days": 8,
        "recon": {"os": "Windows 11", "hostname": "localhost",
                   "open_ports": [135, 445, 3306, 8000], "geo": "Loopback"},
        "findings": [
            {
                "name": "MySQL Service Bound to All Interfaces",
                "severity": "HIGH", "cvss": 7.5, "cve_id": "N/A",
                "owasp_category": "A05:2021 - Security Misconfiguration",
                "mitre_id": "T1210", "port": 3306,
                "description": "MySQL listens on 0.0.0.0:3306, exposing the database to the local "
                               "network and increasing the attack surface for credential attacks.",
                "remediation": "Bind MySQL to 127.0.0.1, require TLS and enforce strong, rotated "
                               "credentials.",
                "exploit_db_id": None,
                "reference_url": "https://owasp.org/www-project-top-ten/",
            },
            {
                "name": "Default Credentials on Admin Console",
                "severity": "HIGH", "cvss": 8.0, "cve_id": "N/A",
                "owasp_category": "A07:2021 - Identification and Authentication Failures",
                "mitre_id": "T1078", "port": 8000,
                "description": "The administrative console accepts the vendor default credential pair, "
                               "granting privileged access without effort.",
                "remediation": "Force a credential change on first login, enforce MFA and disable "
                               "default accounts.",
                "exploit_db_id": None,
                "reference_url": "https://attack.mitre.org/techniques/T1078/",
            },
        ],
    },
]

# CVE intelligence rows derived from the engagement catalog (real metadata).
CVE_INTEL = [
    ("CVE-2021-44228", "Apache Log4j2 JNDI RCE (Log4Shell).", 10.0, "CRITICAL", 1,
     "Upgrade to Log4j2 2.17.1+.", "A06:2021", "T1190", "exploit/multi/http/log4shell_header_injection", "50592"),
    ("CVE-2017-0144", "Microsoft SMBv1 RCE (EternalBlue / MS17-010).", 9.3, "CRITICAL", 1,
     "Apply MS17-010, disable SMBv1.", "A06:2021", "T1210", "exploit/windows/smb/ms17_010_eternalblue", "42315"),
    ("CVE-2019-0708", "RDP pre-auth use-after-free (BlueKeep).", 9.8, "CRITICAL", 1,
     "Patch RDP, enable NLA.", "A06:2021", "T1210", "exploit/windows/rdp/cve_2019_0708_bluekeep_rce", "47416"),
    ("CVE-2017-5638", "Apache Struts2 OGNL RCE.", 10.0, "CRITICAL", 1,
     "Upgrade Struts, deploy WAF.", "A03:2021", "T1190", "exploit/multi/http/struts2_content_type_ognl", "41570"),
    ("CVE-2014-6271", "GNU Bash environment RCE (Shellshock).", 9.8, "CRITICAL", 1,
     "Patch Bash, retire CGI.", "A03:2021", "T1190", "exploit/multi/http/apache_mod_cgi_bash_env_exec", "34900"),
    ("CVE-2014-3566", "SSLv3 POODLE padding-oracle.", 5.0, "MEDIUM", 0,
     "Disable SSLv3 / legacy TLS.", "A02:2021", "T1040", None, None),
    ("CVE-2020-15778", "OpenSSH scp command injection.", 5.3, "MEDIUM", 0,
     "Upgrade OpenSSH.", "A06:2021", "T1592", None, None),
]


def _wipe_engagements(db):
    db.query(Finding).delete()
    db.query(Scan).delete()
    db.commit()


def seed_realistic(force: bool = False):
    """Build the realistic engagement dataset when the DB has no findings."""
    db = SessionLocal()
    try:
        has_findings = db.query(Finding).first() is not None
        if has_findings and not force:
            return

        _wipe_engagements(db)

        admin = db.query(User).filter(User.username == "admin").first()
        now = datetime.utcnow()
        created_scans = []

        for eng in ENGAGEMENTS:
            scan = Scan(
                target=eng["target"],
                scan_type=eng["scan_type"],
                status="completed",
                timestamp=now - timedelta(days=eng["age_days"], hours=eng["age_days"]),
                findings_count=len(eng["findings"]),
                asset_importance=eng["asset_importance"],
                exposure=eng["exposure"],
                user_id=admin.id if admin else None,
                results_json=json.dumps({
                    "recon": eng["recon"],
                    "ports": [{"port": p, "state": "open"} for p in eng["recon"]["open_ports"]],
                }),
            )
            db.add(scan)
            db.flush()
            for f in eng["findings"]:
                # Normalize severity to Title Case (Critical/High/Medium/Low) to
                # match the application-wide convention used by the scanner,
                # backend counters and the frontend components.
                fields = dict(f)
                sev = fields.get("severity")
                if sev:
                    fields["severity"] = str(sev).capitalize()
                db.add(Finding(scan_id=scan.id, **fields))
            created_scans.append(scan)

        db.commit()

        # CVE intelligence
        for row in CVE_INTEL:
            cid = row[0]
            if not db.query(CveIntelligence).filter(CveIntelligence.cve_id == cid).first():
                db.add(CveIntelligence(
                    cve_id=cid, summary=row[1], cvss_score=row[2], severity=str(row[3]).capitalize(),
                    exploit_available=row[4], remediation=row[5], owasp_category=row[6],
                    mitre_id=row[7], msf_module=row[8], edb_id=row[9],
                ))
        db.commit()

        # Operator notifications + audit trail
        if admin:
            if db.query(Notification).filter(Notification.user_id == admin.id).count() == 0:
                alerts = [
                    ("Critical finding on 10.10.14.21", "Log4Shell (CVE-2021-44228) confirmed exploitable.", "danger"),
                    ("EternalBlue exposure", "192.168.1.50 is vulnerable to MS17-010.", "danger"),
                    ("New engagement completed", "Web application audit of demo.hexa-shield.io finished.", "success"),
                    ("TLS hardening recommended", "POODLE/SSLv3 detected on 192.168.1.50.", "warning"),
                ]
                for i, (title, msg, typ) in enumerate(alerts):
                    db.add(Notification(user_id=admin.id, title=title, message=msg, type=typ,
                                        is_read=0, timestamp=now - timedelta(hours=i * 3)))
            if db.query(AuditLog).filter(AuditLog.user_id == admin.id).count() == 0:
                for s in created_scans:
                    db.add(AuditLog(user_id=admin.id, action="START_SCAN", target=s.target,
                                    status="SUCCESS", details=f"{s.scan_type} completed",
                                    timestamp=s.timestamp))
            db.commit()

        total = db.query(Finding).count()
        print(f"[SEED] Realistic intelligence seeded: {len(created_scans)} engagements, {total} findings.")
    except Exception as e:
        import traceback
        print(f"[SEED ERROR] Realistic seed failed: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_realistic(force=True)
