import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from models import CveIntelligence
import requests
import urllib.parse

class IntelligenceService:
    @staticmethod
    def get_local_intel(cve_id: str, db: Session) -> Optional[CveIntelligence]:
        """Provides high-speed intelligence from the 'Real Database' (Local Core)."""
        return db.query(CveIntelligence).filter(CveIntelligence.cve_id == cve_id).first()

    @staticmethod
    def search_intel(keyword: str, db: Session) -> List[CveIntelligence]:
        """Search the local intelligence repository."""
        return db.query(CveIntelligence).filter(
            CveIntelligence.summary.ilike(f"%{keyword}%")
        ).limit(10).all()

    @staticmethod
    def upsert_intel(db: Session, intel_data: Dict) -> CveIntelligence:
        """Ensures the local Intelligence Core stays updated with real-world reality."""
        existing = db.query(CveIntelligence).filter(
            CveIntelligence.cve_id == intel_data['cve_id']
        ).first()

        if existing:
            for key, value in intel_data.items():
                setattr(existing, key, value)
            existing.last_synced = datetime.datetime.utcnow()
        else:
            new_record = CveIntelligence(**intel_data)
            db.add(new_record)
        
        db.commit()
        return existing or new_record

    @staticmethod
    def sync_from_nvd(keyword: str, db: Session):
        """Dynamic sync from NIST NVD to keep the 'Real Database' connected to reality."""
        # Use existing VulnService logic but persist to CveIntelligence
        from services.vuln_service import VulnService
        nvd_results = VulnService._query_nvd(keyword)
        
        for res in nvd_results:
            intel_data = {
                "cve_id": res['cve'],
                "summary": res['description'],
                "cvss_score": res['cvss_score'],
                "severity": res['severity'],
                "exploit_available": 1 if res.get('exploit_available') else 0,
                "remediation": res['remediation'],
                "owasp_category": res.get('owasp_category'),
                "mitre_id": res.get('mitre_id'),
                "msf_module": res.get('msf_module'),
                "edb_id": res.get('exploit_db_id'),
                "last_synced": datetime.datetime.utcnow()
            }
            IntelligenceService.upsert_intel(db, intel_data)

intel_service = IntelligenceService()
