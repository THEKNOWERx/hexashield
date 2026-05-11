import os
import io
import datetime
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from sqlalchemy.orm import Session
from models import Scan, Finding
from services.ai_risk_engine import ai_risk_engine

class ReportService:
    @staticmethod
    def generate_scan_report(scan_id: int, db: Session):
        """
        Main entry point for generating the professional PDF report from the API.
        """
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return None

        # Gather data
        findings = [
            {
                "name": f.name,
                "severity": f.severity,
                "cvss": f.cvss,
                "description": f.description,
                "remediation": f.remediation,
                "cve_id": getattr(f, 'cve_id', 'N/A'),
                "exploit_available": 'Yes' if getattr(f, 'exploit_available', False) else 'No'
            } for f in scan.findings
        ]

        # Extract remarks and performance metrics from results_json
        import json
        remarks = ""
        reputation_score = 72
        integrity_hash = "GEN-HASH-0000"
        web_intel = {}
        try:
            results = json.loads(scan.results_json) if scan.results_json else {}
            remarks = results.get("remarks", "")
            reputation_score = results.get("reputation_score", 72)
            integrity_hash = results.get("integrity_hash", "HEXA-UNK-0000")
            web_intel = results.get("web_intelligence", {})
        except:
            pass

        # Get AI Insights
        top_vuln_data = ai_risk_engine.get_top_vulnerability(findings)
        top_vuln = {
            "name": top_vuln_data.get("cve_id", "Multiple Vectors"),
            "reason": top_vuln_data.get("reason", "Aggregated risk profile requires attention."),
            "score": top_vuln_data.get("risk_score", "High"),
            "recommendation": "Perform immediate segmentation and patch validation."
        }

        # Setup Templates
        template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("audit_report.html")

        # Mock recommendations logic
        recommendations = [
            {"title": "Critical Patching", "action": f"Apply mitigation for {top_vuln['name']} within 24 hours."},
            {"title": "Access Control", "action": "Enforce MFA on all administrative endpoints discovered."},
            {"title": "Log Monitoring", "action": "Enable verbose logging for affected services to detect lateral movement."}
        ]

        # ML Assets Paths (Request: Task 12)
        ml_assets = {
            "confusion_matrix": r"C:\Users\user\.gemini\antigravity\brain\220f21c5-4c77-45ee-9bed-4ddd57762c5c\confusion_matrix.png",
            "training_curve": r"C:\Users\user\.gemini\antigravity\brain\220f21c5-4c77-45ee-9bed-4ddd57762c5c\training_curve.png",
            "validation_curve": r"C:\Users\user\.gemini\antigravity\brain\220f21c5-4c77-45ee-9bed-4ddd57762c5c\validation_curve.png"
        }

        # Render HTML
        html_content = template.render(
            target=scan.target,
            date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            scan_id=f"AUDIT-{scan_id}",
            total_vulns=len(findings),
            critical_vulns=len([f for f in findings if f.get('severity') in ['Critical', 'High']]),
            risk_score=getattr(scan, 'risk_score', 8.5),
            reputation_score=reputation_score,
            integrity_hash=integrity_hash,
            web_intel=web_intel,
            findings=findings,
            top_vuln=top_vuln,
            recommendations=recommendations,
            remarks=remarks,
            ml_assets=ml_assets
        )

        # Generate PDF as binary buffer
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)
        
        if pisa_status.err:
            print(f"[REPORT ERROR] PDF generation failed: {pisa_status.err}")
            return None

        pdf_buffer.seek(0)
        return pdf_buffer
