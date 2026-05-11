import typer
import asyncio
from typing import Optional
from hexascan.cli import commands
from hexascan.cli.ui import print_banner, console

import platform

if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = typer.Typer(
    help="HexaScan: Professional Async Port Scanner & Reconnaissance Tool",
    add_completion=False,
    no_args_is_help=True
)

@app.command()
def scan(
    target: str = typer.Argument(..., help="Target IP or Hostname"),
    ports: str = typer.Option("quick", "--ports", "-p", help="Port range (e.g., 1-1024) or profile (quick/standard/full)"),
    type: str = typer.Option("tcp", "--type", "-t", help="Scan type (tcp/udp/both)"),
    workers: int = typer.Option(500, "--workers", "-w", help="Number of concurrent workers"),
    save: bool = typer.Option(True, "--save/--no-save", help="Save results to database"),
    compare_last: bool = typer.Option(False, "--compare-last", help="Compare with the last scan findings")
):
    """
    Perform a high-performance asynchronous port scan.
    
    Profiles:
    - quick: Top common ports
    - standard: 1-1024
    - full: 1-65535
    """
    print_banner()
    asyncio.run(commands.run_scan(target, ports, scan_type="custom" if "-" in ports else ports, scan_engine=type, workers=workers, save=save, compare=compare_last))

@app.command()
def history(ip: str = typer.Argument(..., help="IP address to show history for")):
    """Show detailed scan history and evolution for a specific IP."""
    commands.show_history(ip)

@app.command()
def report(
    scan_id: int = typer.Argument(..., help="ID of the scan to report"),
    format: str = typer.Option("html", "--format", "-f", help="Report format (html/json/csv)")
):
    """Generate a high-fidelity intelligence report for a previous scan."""
    commands.generate_report(scan_id, format)

@app.command()
def dashboard():
    """Visualize overall mission statistics and host tracking."""
    from hexascan.db.session import SessionLocal, init_db
    from hexascan.db.models import Host, Scan, PortResult
    from sqlalchemy import func
    from rich.panel import Panel
    from rich.columns import Columns
    
    init_db()
    db = SessionLocal()
    
    total_hosts = db.query(Host).count()
    total_scans = db.query(Scan).count()
    total_open_ports = db.query(PortResult).filter(PortResult.state == "open").count()
    
    console.print("\n[bold cyan]HexaScan Intelligence Dashboard[/bold cyan]\n")
    
    stats_panels = [
        Panel(f"[bold cyan]{total_hosts}[/]", title="Total Hosts", border_style="cyan"),
        Panel(f"[bold blue]{total_scans}[/]", title="Total Scans", border_style="blue"),
        Panel(f"[bold red]{total_open_ports}[/]", title="Total Vulnerabilities", border_style="red"),
    ]
    console.print(Columns(stats_panels))
    
    # Top targets
    top_hosts = db.query(Host.ip_address, Host.total_scans).order_by(Host.total_scans.desc()).limit(5).all()
    
    if top_hosts:
        console.print("\n[bold]High-Activity Targets:[/bold]")
        for h in top_hosts:
            console.print(f"  • [cyan]{h.ip_address}[/] - {h.total_scans} scans recorded")
    
    db.close()

if __name__ == "__main__":
    app()
