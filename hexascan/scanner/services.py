from typing import Dict

# Common Port to Service mapping (Subset of nmap-services)
PORT_MAP = {
    21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "dns",
    80: "http", 110: "pop3", 111: "rpcbind", 135: "msrpc",
    139: "netbios-ssn", 143: "imap", 443: "https", 445: "microsoft-ds",
    993: "imaps", 995: "pop3s", 1723: "pptp", 3306: "mysql",
    3389: "ms-wbt-server", 5432: "postgresql", 5900: "vnc",
    8080: "http-proxy", 8443: "https-alt"
}

# Vulnerable/Insecure services for Risk Level calculation
RISK_VULN_SERVICES = {
    "telnet": "Critical",
    "ftp": "Medium",
    "msrpc": "High",
    "microsoft-ds": "High",
    "vnc": "Medium",
    "rlogin": "Critical"
}

def get_service_info(port: int, protocol: str = "tcp") -> Dict[str, str]:
    name = PORT_MAP.get(port, "unknown")
    return {"name": name, "port": port, "protocol": protocol}

def get_risk_level(service_name: str, port: int) -> str:
    # Logic to determine risk level
    if service_name in RISK_VULN_SERVICES:
        return RISK_VULN_SERVICES[service_name]
    
    # Specific port risks
    if port in [135, 139, 445]: return "High"
    if port in [23, 513]: return "Critical"
    
    return "Low" if port > 0 else "Informational"
