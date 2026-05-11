from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from hexascan.db.models import Host, Scan, PortResult

def get_or_create_host(db: Session, ip_address: str, hostname: Optional[str] = None) -> Host:
    host = db.query(Host).filter(Host.ip_address == ip_address).first()
    if not host:
        host = Host(ip_address=ip_address, hostname=hostname)
        db.add(host)
    else:
        if hostname and not host.hostname:
            host.hostname = hostname
    db.commit()
    db.refresh(host)
    return host

def create_scan(db: Session, host_id: int, target_ip: str, target_hostname: Optional[str], scan_type: str) -> Scan:
    scan = Scan(
        host_id=host_id, 
        target_ip=target_ip, 
        target_hostname=target_hostname, 
        scan_type=scan_type, 
        status="running"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan

def update_scan_status(db: Session, scan_id: int, status: str):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if scan:
        scan.status = status
        if status == "completed":
            scan.completed_at = datetime.utcnow()
            # Increment host total scans
            host = db.query(Host).filter(Host.id == scan.host_id).first()
            if host:
                host.total_scans += 1
        db.commit()

def add_port_result(db: Session, scan_id: int, port_data: dict):
    # Convert validated_by list to comma-separated string if present
    if "validated_by" in port_data and isinstance(port_data["validated_by"], list):
        port_data["validated_by"] = ",".join(port_data["validated_by"])
        
    port = PortResult(scan_id=scan_id, **port_data)
    db.add(port)
    db.commit()

def get_host_history(db: Session, ip_address: str) -> List[Scan]:
    return db.query(Scan).join(Host).filter(Host.ip_address == ip_address).order_by(Scan.started_at.desc()).all()
