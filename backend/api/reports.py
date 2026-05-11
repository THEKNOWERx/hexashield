from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session
from services.report_generator import ReportGenerator
from services.report_service import ReportService
from authentication.auth import get_current_user
from database.db import get_db
from models import Scan, Finding
from datetime import datetime
import json

router = APIRouter(prefix="/reports", tags=["reports"])

def get_report_payload(scan_id: int, db: Session) -> dict:
    """Helper to assemble report data for multiple formats."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Report not found")
    
    findings = [
        {
            "name": f.name,
            "severity": f.severity,
            "cvss": f.cvss,
            "description": f.description,
            "remediation": f.remediation,
            "owasp": getattr(f, 'owasp_category', 'A03:2021'),
            "mitre": getattr(f, 'mitre_id', 'T1190')
        } for f in scan.findings
    ]
    
    saved_results = scan.results_json
    if isinstance(saved_results, str):
        try:
            saved_results = json.loads(saved_results)
        except:
            saved_results = {}
    elif saved_results is None:
        saved_results = {}

    return {
        "scan_id": scan.id,
        "target": scan.target,
        "timestamp": scan.timestamp.isoformat() if scan.timestamp else datetime.now().isoformat(),
        "findings": findings,
        "risk_score": getattr(scan, 'risk_score', 0),
        "recon": saved_results.get("recon", {}),
        "ports": saved_results.get("ports", []),
        "exploits": saved_results.get("exploits", [])
    }

@router.get("/download/{scan_id}")
async def download_report(scan_id: int, format: str = "pdf", current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate and download a report in various formats."""
    if format == "pdf":
        pdf_buffer = ReportService.generate_scan_report(scan_id, db)
        if not pdf_buffer:
            raise HTTPException(status_code=500, detail="Failed to generate PDF")
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=HexaReport_{scan_id}.pdf"}
        )

    scan_data = get_report_payload(scan_id, db)

    if format == "html":
        html_content = ReportGenerator.generate_html_report(scan_data)
        return HTMLResponse(content=html_content)
    elif format == "json":
        return JSONResponse(content=scan_data)
    else:
        raise HTTPException(status_code=400, detail="Invalid format")

@router.get("/details/{scan_id}")
async def get_report_details(scan_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch structured data for the frontend dashboard."""
    return get_report_payload(scan_id, db)

    return {"status": "success"}

@router.delete("/{scan_id}")
async def delete_report(scan_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan: raise HTTPException(status_code=404, detail="Not found")
    db.delete(scan); db.commit()
    return {"status": "success"}

@router.patch("/{scan_id}")
async def update_report(scan_id: int, data: dict, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update report metadata such as custom remarks or remediation notes."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # We can update remarks or other metadata stored in results_json
    try:
        results = json.loads(scan.results_json) if scan.results_json else {}
    except:
        results = {}
        
    if "remarks" in data:
        results["remarks"] = data["remarks"]
        scan.results_json = json.dumps(results)
    
    # Optionally update individual findings if provided
    if "findings" in data:
        for f_update in data["findings"]:
            finding = db.query(Finding).filter(Finding.scan_id == scan_id, Finding.name == f_update.get("name")).first()
            if finding:
                if "remediation" in f_update:
                    finding.remediation = f_update["remediation"]
                if "description" in f_update:
                    finding.description = f_update["description"]

    db.commit()
    return {"status": "success", "message": "Report intelligence updated"}

@router.delete("/purge/all")
async def purge_all_reports(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Wipe all scan results and findings from the database."""
    try:
        db.query(Finding).delete()
        db.query(Scan).delete()
        db.commit()
        return {"status": "success", "message": "All database records purged"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

