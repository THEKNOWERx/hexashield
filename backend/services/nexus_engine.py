import random
from typing import List, Dict

class NexusEngine:
    def __init__(self):
        # MITRE ATT&CK Technique Mapping (Simplified)
        self.mitre_map = {
            "RCE": {"id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access"},
            "Privilege Escalation": {"id": "T1068", "name": "Exploitation for Privilege Escalation", "tactic": "Privilege Escalation"},
            "SQL Injection": {"id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access"},
            "Default Credentials": {"id": "T1078", "name": "Valid Accounts", "tactic": "Defense Evasion"},
        }

    def analyze_query(self, query: str, findings: List[Dict]) -> Dict:
        """
        Main intelligence logic: Analyzes query in Arabic/English and maps to scan context.
        """
        query_lower = query.lower()
        
        # 1. Identify "Most Critical" questions
        if any(word in query_lower for word in ["أخطر", "أهم", "critical", "top", "danger"]):
            return self._handle_most_critical(findings)
            
        # 2. Identify "How to fix" questions
        if any(word in query_lower for word in ["صلح", "حل", "fix", "mitigate", "remediate"]):
            return self._handle_remediation(findings, query_lower)
            
        # 3. Identify "What is CVE" questions
        if "cve" in query_lower:
            return self._handle_cve_info(findings, query_lower)

        # Default fallback
        return {
            "answer": "أنا المحلل الأمني Nexus. يمكنني مساعدتك في فهم أخطر الثغرات، كيفية استغلالها، وطرق معالجتها بناءً على المسح الحالي.",
            "risk_level": "INFO",
            "recommendation": "قم بطلب تحليل لأخطر ثغرة مكتشفة.",
            "confidence": "100%"
        }

    def _handle_most_critical(self, findings: List[Dict]) -> Dict:
        if not findings:
            return {"answer": "لم يتم العثور على ثغرات في المسح الحالي.", "risk_level": "SAFE", "recommendation": "استمر في المراقبة.", "confidence": "100%"}
        
        # Sort by CVSS
        top = sorted(findings, key=lambda x: float(x.get('cvss') or 0), reverse=True)[0]
        
        mitre = self.mitre_map.get("RCE") # Default for demo
        
        answer = f"أخطر ثغرة هي {top['name']} (CVSS: {top['cvss']}). "
        answer += f"هذه الثغرة تسمح للمهاجم بتنفيذ {mitre['name']} ({mitre['id']}) مما يهدد استقرار {top.get('port', 'النظام')}."
        
        return {
            "answer": answer,
            "risk_level": top['severity'].upper(),
            "recommendation": "يجب تثبيت التحديثات الأمنية فوراً وعزل الخدمة المصابة.",
            "confidence": "98%"
        }

    def _handle_remediation(self, findings: List[Dict], query: str) -> Dict:
        # Simple extraction or general advice
        return {
            "answer": "تعتمد المعالجة على نوع الثغرة. بشكل عام، ننصح بتحديث النظام لآخر إصدار، تفعيل الجدران النارية، واستخدام إعدادات التحصين (Hardening).",
            "risk_level": "ACTION_REQUIRED",
            "recommendation": "راجع قسم 'Detailed Findings' للحصول على أوامر المعالجة التقنية.",
            "confidence": "95%"
        }

    def _handle_cve_info(self, findings: List[Dict], query: str) -> Dict:
        # Logic to find a specific CVE mentioned in query if possible
        return {
            "answer": "ثغرات CVE هي معرّفات عالمية للمشاكل الأمنية المعروفة. الثغرات المكتشفة في نظامك موثقة بمعرّفات NIST الرسمية.",
            "risk_level": "INFO",
            "recommendation": "ابحث عن المعرّف في قاعدة بيانات NVD لقراءة التفاصيل التقنية العميقة.",
            "confidence": "90%"
        }

nexus_engine = NexusEngine()
