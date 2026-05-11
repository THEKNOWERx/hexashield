from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box
from typing import List, Any, Optional

console = Console()

def print_banner():
    banner = """
    [bold cyan]
    _    _ _______ _    _  _____   ______ _______ _______ _______ _    _ 
    |    | |______  \  /  |_____| |______ |       |_____| |  |  | | \  | 
    |____| |______   \/   |     | _______ |_____  |     | |  |  | |  \_|
    [/bold cyan]
    [bold white]Professional Network Security Intelligence Engine[/bold white]
    """
    console.print(Panel(banner, border_style="cyan", box=box.DOUBLE))

def display_results(target: str, results: List[Any], duration: float, os_hint: str = "Unknown"):
    console.print(f"\n[bold white]Target Statistics:[/] [cyan]{target}[/] | [dim]OS Hint:[/] [bold magenta]{os_hint}[/]")
    
    table = Table(box=box.MINIMAL_HEAVY_HEAD, header_style="bold cyan")
    table.add_column("Port", justify="right", style="bold white")
    table.add_column("Proto", justify="center", style="green")
    table.add_column("Service", style="white")
    table.add_column("Version", style="dim")
    table.add_column("Risk", justify="center")
    table.add_column("Latency")
    table.add_column("Banner/Snippet", style="italic gray50", overflow="fold")

    for p in results:
        if p.state not in ["open", "open|filtered"]:
            continue
            
        risk_color = "red" if p.risk_level == "Critical" else "orange3" if p.risk_level == "High" else "yellow" if p.risk_level == "Medium" else "green"
        
        table.add_row(
            str(p.port_number),
            p.protocol.upper(),
            p.service_name,
            p.service_version or "Unknown",
            f"[{risk_color}]{p.risk_level}[/]",
            f"{p.response_time_ms:.1f}ms" if p.response_time_ms else "N/A",
            (p.banner[:50] + "...") if p.banner and len(p.banner) > 50 else (p.banner or "")
        )
    
    console.print(table)
    console.print(f"\n[bold green]Scan completed in {duration:.2f} seconds. Found {len(results)} active entry points.[/bold green]\n")

def display_history(ip: str, history: List[Any]):
    table = Table(title=f"Evolutionary History for {ip}", box=box.DOUBLE_EDGE, header_style="bold magenta")
    table.add_column("ID", justify="center")
    table.add_column("Timestamp")
    table.add_column("Profile")
    table.add_column("Status")
    table.add_column("Hits", justify="right", style="bold green")

    for s in history:
        status_style = "green" if s.status == "completed" else "yellow" if s.status == "running" else "red"
        table.add_row(
            str(s.id),
            s.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            s.scan_type.upper(),
            f"[{status_style}]{s.status}[/]",
            str(len(s.ports))
        )
    console.print(table)
