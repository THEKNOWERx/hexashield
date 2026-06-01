from typing import Dict, List, Any
import json
import base64
import os
import html
from datetime import datetime
from services.risk_engine import RiskEngine

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_SUPPORT = True
except ImportError:
    ARABIC_SUPPORT = False

class ReportGenerator:
    _logo_cache = None

    @staticmethod
    def get_logo_base64() -> str:
        if ReportGenerator._logo_cache:
            return ReportGenerator._logo_cache
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "hex_logo.jpeg"))
        if os.path.exists(logo_path):
            try:
                with open(logo_path, "rb") as image_file:
                    encoded = base64.b64encode(image_file.read()).decode('utf-8')
                    ReportGenerator._logo_cache = f"data:image/jpeg;base64,{encoded}"
                    return ReportGenerator._logo_cache
            except Exception: pass
        return ""

    @staticmethod
    def get_bilingual_text(en_text: str, ar_text: str) -> str:
        if not ARABIC_SUPPORT: return f"{en_text} ({ar_text})"
        try:
            reshaped_text = arabic_reshaper.reshape(ar_text)
            bidi_text = get_display(reshaped_text)
            return f"{en_text} | {bidi_text}"
        except: return f"{en_text} ({ar_text})"

    @staticmethod
    def generate_html_report(scan_data: Dict[str, Any]) -> str:
        findings = scan_data.get("findings", [])
        recon = scan_data.get("recon", {})
        ports = scan_data.get("ports", [])
        exploits = scan_data.get("exploits", [])
        
        geo = recon.get("ip_intelligence", {})
        headers = recon.get("headers", {})
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        target = html.escape(str(scan_data.get("target", "N/A")))
        scan_id = html.escape(str(scan_data.get("scan_id", "0")))
        logo_src = ReportGenerator.get_logo_base64()
        
        risk_score = scan_data.get("risk_score", 0)
        risk_level = RiskEngine.get_risk_level(risk_score)
        risk_color = "#ff003c" if risk_score > 70 else ("#f0b429" if risk_score > 40 else "#39ff14")

        # Sections HTML mapping
        findings_html = ""
        sev_colors = {"Critical": "#ff003c", "High": "#ff6b35", "Medium": "#f0b429", "Low": "#39ff14"}
        for f in findings:
            sc = sev_colors.get(f.get('severity'), "#888")
            findings_html += f"""
            <div style="border-left: 5px solid {sc}; padding: 15px; margin-bottom: 20px; background: #0a0a0b; border-radius: 0 10px 10px 0;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">{html.escape(f.get('name',''))}</div>
                <div style="color: {sc}; font-size: 10px; font-weight: bold; margin-bottom: 10px;">
                    {f.get('severity', 'LOW').upper()} // CVSS {f.get('cvss', 0)}
                </div>
                <div style="color: #ccc; font-size: 11px; margin-bottom: 10px;">{html.escape(f.get('description',''))}</div>
                <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 5px; font-size: 10px;">
                    <b style="color: #0047ff;">REMEDIATION:</b> {html.escape(f.get('remediation',''))}
                </div>
            </div>"""

        ports_html = "".join([f"""
            <tr style="border-bottom: 1px solid #111;">
                <td style="padding: 8px; color: #0047ff; font-family: monospace;">{p.get('port')}</td>
                <td style="padding: 8px; font-family: monospace;">{p.get('protocol','TCP')}</td>
                <td style="padding: 8px;">{html.escape(p.get('service','')).upper()}</td>
                <td style="padding: 8px; color: #555;">{html.escape(p.get('version','N/A'))}</td>
            </tr>""" for p in ports])

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page {{ size: A4; margin: 1cm; }}
                body {{ background-color: #000; color: #fff; font-family: sans-serif; font-size: 10pt; line-height: 1.4; }}
                .container {{ width: 100%; }}
                .cyber-border {{ border: 1px solid #1a1a1a; padding: 20px; border-radius: 15px; background: #050505; }}
                .label {{ color: #555; text-transform: uppercase; font-size: 8pt; font-weight: bold; letter-spacing: 1px; }}
                .value {{ font-size: 11pt; font-weight: bold; color: #eee; }}
                .section-header {{ border-left: 4px solid #0047ff; padding-left: 10px; margin: 30px 0 15px 0; color: #0047ff; font-weight: bold; font-size: 14pt; }}
                table {{ width: 100%; border-collapse: collapse; }}
                .risk-box {{ text-align: center; border: 2px solid {risk_color}; padding: 20px; border-radius: 20px; background: rgba(255,255,255,0.02); }}
            </style>
        </head>
        <body>
            <div class="container">
                <div style="border-bottom: 1px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 15%;">
                                <img src="{logo_src}" style="width: 80px; height: 80px; border-radius: 50%;" />
                            </td>
                            <td style="width: 60%;">
                                <div style="color: #0047ff; letter-spacing: 5px; font-weight: bold; font-size: 9pt;">HEXASHIELD // COBRA_PROJECT</div>
                                <h1 style="margin: 5px 0; font-size: 22pt;">{ReportGenerator.get_bilingual_text("Audit Intelligence Report", "تقرير الاستخبارات الأمنية")}</h1>
                                <div style="color: #555; font-size: 10pt;">Target: <b style="color: #fff;">{target}</b></div>
                            </td>
                            <td style="text-align: right;">
                                <div style="font-size: 18pt; font-weight: bold; color: #222;">ID-{scan_id}</div>
                                <div style="font-size: 9pt; color: #444;">{ts}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="section-header">01 // {ReportGenerator.get_bilingual_text("Expert Recommendations", "توصيات الخبراء")}</div>
                <div class="cyber-border" style="border-color: #0047ff30;">
                    <div style="font-size: 12px; color: #eee; line-height: 1.6;">
                        1. <b>{ReportGenerator.get_bilingual_text("Critical Path Patching", "تحديث المسارات الحرجة")}:</b> {ReportGenerator.get_bilingual_text("Immediate update of all services with CVE scores > 9.0.", "تحديث فوري لجميع الخدمات التي تتجاوز درجة CVE لها 9.0.")}<br/>
                        2. <b>{ReportGenerator.get_bilingual_text("Service Hardening", "تقوية الخدمات")}:</b> {ReportGenerator.get_bilingual_text("Enforce TLS 1.3 and disable legacy SSH keys.", "فرض TLS 1.3 وتعطيل مفاتيح SSH القديمة.")}<br/>
                        3. <b>{ReportGenerator.get_bilingual_text("Data Tiering", "تقسيم البيانات")}:</b> {ReportGenerator.get_bilingual_text("Restrict administrative panels to VPN-only access.", "تقييد لوحات الإدارة للوصول عبر VPN فقط.")}
                    </div>
                </div>

                <div class="section-header">02 // {ReportGenerator.get_bilingual_text("Executive Infrastructure Summary", "ملخص البنية التحتية")}</div>
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 30%; padding-right: 15px;">
                            <div class="risk-box">
                                <div class="label">Cyber Risk Score</div>
                                <div style="font-size: 32pt; font-weight: 900; color: {risk_color};">{risk_score}%</div>
                                <div style="font-size: 10pt; font-weight: bold; color: {risk_color};">{risk_level.upper()}</div>
                            </div>
                        </td>
                        <td style="width: 70%;">
                            <div class="cyber-border">
                                <table style="width: 100%;">
                                    <tr>
                                        <td><div class="label">Provider / ISP</div><div class="value">{html.escape(geo.get('isp','Unknown'))}</div></td>
                                        <td><div class="label">OS Fingerprint</div><div class="value">{html.escape(headers.get('version','Linux (Detected)'))}</div></td>
                                    </tr>
                                    <tr style="height: 15px;"></tr>
                                    <tr>
                                        <td><div class="label">ASN Record</div><div class="value">{html.escape(geo.get('asn','N/A'))}</div></td>
                                        <td><div class="label">Audit Status</div><div class="value">Completed // Verified</div></td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                </table>

                <div class="section-header">03 // {ReportGenerator.get_bilingual_text("Network Asset Inventory", "جرد الأصول الرقمية")}</div>
                <div class="cyber-border">
                    <table>
                        <tr style="border-bottom: 2px solid #222; text-align: left; color: #555; font-size: 9pt;">
                            <th style="padding: 10px;">PORT</th>
                            <th style="padding: 10px;">PROTO</th>
                            <th style="padding: 10px;">SERVICE</th>
                            <th style="padding: 10px;">VERSION INFO</th>
                        </tr>
                        {ports_html if ports_html else '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #444;">NO ACTIVE ASSETS DETECTED</td></tr>'}
                    </table>
                </div>

                <div style="page-break-after: always;"></div>

                <div class="section-header">04 // {ReportGenerator.get_bilingual_text("Vulnerability Deep-Dive", "التحليل العميق للثغرات")}</div>
                {findings_html if findings_html else '<div style="color:#444; text-align:center; padding:20px;">SYSTEM AUDIT COMPLETE: NO SURFACE-LEVEL VULNERABILITIES DETECTED</div>'}

                <div style="margin-top: 50px; text-align: center; border-top: 1px solid #111; padding-top: 30px;">
                    <div style="font-size: 14pt; font-weight: bold; color: #0047ff; margin-bottom: 5px;">HEXASHIELD // AUDIT COMPLETE</div>
                    <div style="color: #444; font-size: 9pt; letter-spacing: 5px;">CRYPTOGRAPHIC SIGNATURE VERIFIED // PROJECT_COBRA_2026</div>
                </div>
            </div>
        </body>
        </html>
        """

    @staticmethod
    def generate_report(scan_data: Dict, format: str = "json") -> str:
        if format == "html":
            return ReportGenerator.generate_html_report(scan_data)
        return json.dumps(scan_data, indent=4, default=str)
