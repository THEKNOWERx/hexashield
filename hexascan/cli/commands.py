import asyncio
import time
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from hexascan.db.session import SessionLocal, init_db
from hexascan.db import crud
from hexascan.cli.ui import console, print_banner, display_results, display_history
from hexascan.reports.generator import export_json, export_csv, export_html
from hexascan.engine.orchestrator import ScanOrchestrator
from hexascan.reports.high_accuracy_formatter import format_validation_json

# Scan Profiles for legacy support
PROFILES = {
    "quick": [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5432, 5900, 8080, 8443],
    "standard": list(range(1, 1025)),
    "full": list(range(1, 65536))
}

async def run_validation_scan(target: str, save: bool = True):
    """The High-Accuracy Multi-Tool Scan Orchestration with Beautiful CLI Dashboards"""
    init_db()
    db = SessionLocal()
    orchestrator = ScanOrchestrator(target)
    
    from rich.panel import Panel
    from rich.table import Table
    from rich.live import Live
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
    
    console.print(Panel.fit(
        f"[bold cyan]HEXASHIELD // VALIDATION ENGINE v2.0[/bold cyan]\n"
        f"[dim]Initiating cross-tool security audit for:[/dim] [bold white]{target}[/bold white]",
        border_style="blue",
        padding=(1, 4)
    ))
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(bar_width=40),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        TimeElapsedColumn(),
        console=console
    ) as progress:
        scan_task = progress.add_task("[cyan]Orchestrating Multi-Stage Validation...", total=100)
        
        # Phase 1: Nmap Deep Interrogation
        progress.update(scan_task, description="[yellow]Phase 1: Nmap Deep Interrogation...", completed=10)
        # In reality, we'd hook into orchestrator callbacks, but here we simulate the feel
        results = await orchestrator.run_full_validation_scan()
        progress.update(scan_task, description="[green]Phase 4: Synthesizing Final Report...", completed=100)

    if results["scan_status"] == "failed":
        console.print(f"[bold red]SCAN ERROR:[/] {results.get('error')}")
        db.close()
        return

    # Beautiful Dashboard Table
    table = Table(title=f"\n[bold]Validation Results: {target}[/bold]", title_justify="left", show_header=True, header_style="bold magenta", border_style="dim")
    table.add_column("PORT", style="cyan", justify="right")
    table.add_column("SERVICE", style="white")
    table.add_column("CONFIDENCE", justify="center")
    table.add_column("VALIDATED BY", style="dim")
    table.add_column("RISK", justify="center")

    for r in results["results"]:
        conf = float(r["confidence"])
        conf_color = "green" if conf > 0.8 else ("yellow" if conf > 0.5 else "red")
        risk = r["risk_level"]
        risk_color = "red" if risk == "Critical" else ("orange1" if risk == "High" else ("yellow" if risk == "Medium" else "green"))
        
        # Format tools list
        tools = ", ".join(r["validated_by"])
        
        table.add_row(
            f"{r['port']}/tcp",
            f"{r['service']} [dim]{r['version']}[/dim]",
            f"[{conf_color}]{int(conf*100)}%[/{conf_color}]",
            tools,
            f"[bold {risk_color}]{risk}[/bold {risk_color}]"
        )

    console.print(table)
    
    # Save to DB logic
    if save and results["scan_status"] == "success":
        # ... logic as before but with polished feedback ...
        from hexascan.db import crud
        hostname = results.get("ip", target)
        host = crud.get_or_create_host(db, target, hostname)
        scan = crud.create_scan(db, host.id, target, hostname, "high-accuracy")
        
        for r in results["results"]:
            db_data = {
                "port_number": r["port"],
                "protocol": "tcp",
                "state": r["state"],
                "service_name": r["service"],
                "service_version": r["version"],
                "banner": r["banner"],
                "confidence": r["confidence"],
                "validated_by": r["validated_by"],
                "risk_level": r["risk_level"]
            }
            crud.add_port_result(db, scan.id, db_data)
        
        crud.update_scan_status(db, scan.id, "completed")
        console.print(f"\n[bold green]✔[/bold green] [dim]Persistent Storage Sync Complete (Report ID:[/dim] [bold blue]{scan.id}[/bold blue][dim])[/dim]")
    
    db.close()

def perform_comparison(db: Session, host_id: int, current_scan_id: int):
    # Fetch previous scans
    prev_scans = db.query(crud.Scan).filter(crud.Scan.host_id == host_id, crud.Scan.id != current_scan_id).order_by(crud.Scan.started_at.desc()).all()
    
    if not prev_scans:
        return
        
    prev_scan = prev_scans[0]
    from hexascan.db.models import PortResult
    curr_results = {p.port_number: p for p in db.query(PortResult).filter(PortResult.scan_id == current_scan_id).all()}
    prev_results = {p.port_number: p for p in db.query(PortResult).filter(PortResult.scan_id == prev_scan.id).all()}
    
    new_ports = set(curr_results.keys()) - set(prev_results.keys())
    closed_ports = set(prev_results.keys()) - set(curr_results.keys())
    
    if new_ports or closed_ports:
        console.print("\n[bold cyan]Historical Comparison Check:[/bold cyan]")
        if new_ports: console.print(f"[bold red]NEW OPEN PORTS:[/] {sorted(list(new_ports))}")
        if closed_ports: console.print(f"[bold yellow]NOW CLOSED PORTS:[/] {sorted(list(closed_ports))}")

async def run_scan(target: str, port_range: str, scan_type: str, scan_engine: str, workers: int, save: bool, compare: bool):
    """Entry point for the CLI 'scan' command - defaults to High-Accuracy mode"""
    await run_validation_scan(target, save=save)

def show_history(ip: str):
    db = SessionLocal()
    history = crud.get_host_history(db, ip)
    if not history:
        console.print(f"[red]No history found for {ip}[/red]")
    else:
        display_history(ip, history)
    db.close()

def generate_report(scan_id: int, format: str):
    db = SessionLocal()
    scan = db.query(crud.Scan).get(scan_id)
    if not scan:
        console.print(f"[red]Scan ID {scan_id} not found.[/red]")
        return
    
    filename = f"report_{scan_id}.{format}"
    from hexascan.db.models import PortResult
    ports = db.query(PortResult).filter(PortResult.scan_id == scan_id).all()
    
    if format == "json":
        export_json(scan, ports, filename)
    elif format == "csv":
        export_csv(scan, ports, filename)
    elif format == "html":
        export_html(scan, ports, filename)
        
    console.print(f"[bold green]Report saved to {filename}[/bold green]")
    db.close()
