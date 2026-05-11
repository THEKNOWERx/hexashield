import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Any
from jinja2 import Environment, FileSystemLoader
from hexascan.db.models import PortResult, Scan

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')

def export_json(scan: Scan, results: List[PortResult], filepath: str):
    data = {
        "scan_id": scan.id,
        "target": scan.target_ip,
        "hostname": scan.target_hostname,
        "type": scan.scan_type,
        "os_hint": scan.host.os_hint,
        "status": scan.status,
        "started": scan.started_at.isoformat(),
        "completed": scan.completed_at.isoformat() if scan.completed_at else None,
        "results": [
            {
                "port": p.port_number,
                "protocol": p.protocol,
                "state": p.state,
                "service": p.service_name,
                "version": p.service_version,
                "banner": p.banner,
                "risk": p.risk_level,
                "latency_ms": round(p.response_time_ms, 2) if p.response_time_ms else None
            } for p in results
        ]
    }
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

def export_csv(scan: Scan, results: List[PortResult], filepath: str):
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Scan ID", "Target", "Hostname", "Port", "Protocol", "State", "Service", "Version", "Risk", "Latency (ms)", "OS Hint"])
        for p in results:
            writer.writerow([
                scan.id, scan.target_ip, scan.target_hostname or "N/A",
                p.port_number, p.protocol, p.state, p.service_name, 
                p.service_version or "", p.risk_level, 
                round(p.response_time_ms, 2) if p.response_time_ms else "",
                scan.host.os_hint or "Unknown"
            ])

def export_html(scan: Scan, results: List[PortResult], filepath: str):
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template('report.html')
    
    html_out = template.render(
        scan=scan,
        results=[p for p in results if p.state in ["open", "open|filtered"]],
        now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_out)
