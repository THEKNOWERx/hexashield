import socket
import re
import ssl
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Optional, Callable

logger = logging.getLogger("HexScanner")

# ---------------------------------------------------------------------------
# Service knowledge base: common TCP ports -> service name
# ---------------------------------------------------------------------------
COMMON_SERVICES: Dict[int, str] = {
    21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "domain",
    80: "http", 110: "pop3", 111: "rpcbind", 135: "msrpc", 139: "netbios-ssn",
    143: "imap", 161: "snmp", 389: "ldap", 443: "https", 445: "microsoft-ds",
    465: "smtps", 587: "submission", 631: "ipp", 993: "imaps", 995: "pop3s",
    1433: "ms-sql-s", 1521: "oracle", 1723: "pptp", 2049: "nfs",
    2375: "docker", 2376: "docker-tls", 27017: "mongodb", 3000: "http-dev",
    3306: "mysql", 3389: "ms-wbt-server", 5432: "postgresql", 5601: "kibana",
    5672: "amqp", 5900: "vnc", 5985: "winrm", 6379: "redis", 8000: "http-alt",
    8008: "http-alt", 8080: "http-proxy", 8443: "https-alt", 8888: "http-alt",
    9000: "http-alt", 9200: "elasticsearch", 9300: "elasticsearch",
    11211: "memcached", 50000: "ibm-db2",
}

# Curated high-signal port list used for fast/ultra profiles.
TOP_PORTS = sorted(set(list(COMMON_SERVICES.keys()) + [
    7, 9, 13, 37, 79, 88, 113, 119, 179, 199, 427, 513, 514, 515, 543, 544,
    548, 554, 873, 990, 1080, 1194, 2000, 2121, 3260, 3690, 4444, 5000, 5060,
    5555, 6000, 6667, 7001, 7070, 8081, 8088, 8181, 9090, 9999, 10000, 32768,
    49152,
]))

# Deep profile adds the full well-known port range.
DEEP_EXTRA = list(range(1, 1025))


class HexScanner:
    """
    Native Python TCP scanner — zero external binary dependencies.

    Performs a real TCP connect scan with concurrent workers, grabs service
    banners, and derives product/version fingerprints. Returns a strictly
    structured result consumed by the orchestrator and the UI.
    """

    # ------------------------------------------------------------------ #
    # Target resolution
    # ------------------------------------------------------------------ #
    @staticmethod
    def _resolve_target(target: str) -> Optional[str]:
        """Resolve a hostname/URL to an IPv4 address. Returns None on failure."""
        host = re.sub(r"^[a-zA-Z]+://", "", target.strip())
        host = host.split("/")[0].split(":")[0]
        if not host:
            return None
        try:
            return socket.gethostbyname(host)
        except (socket.gaierror, UnicodeError, OSError):
            return None

    # ------------------------------------------------------------------ #
    # Banner grabbing & fingerprinting
    # ------------------------------------------------------------------ #
    @staticmethod
    def _grab_banner(ip: str, port: int, service: str, timeout: float = 1.5) -> str:
        """Attempt to read a service banner from an open port."""
        banner = ""
        try:
            with socket.create_connection((ip, port), timeout=timeout) as sock:
                sock.settimeout(timeout)

                if service in ("https", "https-alt", "smtps", "imaps", "pop3s"):
                    try:
                        ctx = ssl.create_default_context()
                        ctx.check_hostname = False
                        ctx.verify_mode = ssl.CERT_NONE
                        with ctx.wrap_socket(sock, server_hostname=ip) as tls:
                            cipher = tls.cipher()
                            ver = tls.version() or ""
                            return f"TLS {ver} {cipher[0] if cipher else ''}".strip()
                    except Exception:
                        return "TLS service"

                if service in ("http", "http-alt", "http-proxy", "http-dev", "kibana"):
                    try:
                        sock.sendall(
                            f"HEAD / HTTP/1.0\r\nHost: {ip}\r\n"
                            f"User-Agent: HexaShield-Scanner\r\n\r\n".encode()
                        )
                    except OSError:
                        pass

                data = sock.recv(256)
                banner = data.decode("utf-8", errors="ignore").strip()
        except Exception:
            banner = ""
        return banner

    @staticmethod
    def _fingerprint(service: str, banner: str) -> Dict[str, str]:
        """Derive product/version from a raw banner string."""
        product, version = "", ""
        b = banner or ""

        m = re.search(r"[Ss]erver:\s*([^\r\n]+)", b)
        if m:
            server = m.group(1).strip()
            pm = re.match(r"([A-Za-z0-9_\-]+)[/ ]?([\d.]+)?", server)
            if pm:
                product = pm.group(1)
                version = pm.group(2) or ""

        if not product and b.startswith("SSH-"):
            sm = re.search(r"SSH-[\d.]+-([A-Za-z0-9_\-]+)[_ ]?([\d.][\w.]*)?", b)
            if sm:
                product = sm.group(1)
                version = (sm.group(2) or "").rstrip("_")

        if not product and service == "ftp":
            fm = re.search(r"([A-Za-z]+FTPd?|FileZilla)\s*([\d.]+)?", b)
            if fm:
                product = fm.group(1)
                version = fm.group(2) or ""

        if not version:
            vm = re.search(r"\b(\d+\.\d+(?:\.\d+)?)\b", b)
            if vm:
                version = vm.group(1)

        return {"product": product.strip(), "version": version.strip()}

    # ------------------------------------------------------------------ #
    # Port probing
    # ------------------------------------------------------------------ #
    @classmethod
    def _probe_port(cls, ip: str, port: int, connect_timeout: float) -> Optional[Dict[str, Any]]:
        """Return a structured record if the TCP port is open, else None."""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(connect_timeout)
                if sock.connect_ex((ip, port)) != 0:
                    return None
        except OSError:
            return None

        service = COMMON_SERVICES.get(port, "unknown")
        banner = cls._grab_banner(ip, port, service)
        fp = cls._fingerprint(service, banner)

        return {
            "port": port,
            "protocol": "tcp",
            "state": "open",
            "service": service,
            "product": fp["product"],
            "version": fp["version"],
            "banner": banner[:200],
        }

    # ------------------------------------------------------------------ #
    # Public entry point
    # ------------------------------------------------------------------ #
    @classmethod
    def run_robust_scan(
        cls,
        target: str,
        intensity: str = "deep",
        timeout: int = 90,
        progress_cb: Optional[Callable[[Dict[str, Any]], None]] = None,
    ) -> Dict[str, Any]:
        """
        Run a native TCP connect scan.

        intensity:
          - fast / ultra : curated top-port list, short per-port timeout
          - deep         : curated list + well-known 1-1024 range

        progress_cb (optional): called with {"phase", "ports", "scanned",
        "total"} as ports are discovered, enabling live UI streaming.
        """
        start = time.time()
        logger.info(f"Starting {intensity.upper()} native scan for {target}")

        ip = cls._resolve_target(target)
        if not ip:
            return {
                "status": "error",
                "target": target,
                "ports": [],
                "message": f"Could not resolve target '{target}'. Check the host or address.",
                "engine_log": "DNS resolution failed",
            }

        if intensity in ("fast", "ultra"):
            ports_to_scan = TOP_PORTS
            connect_timeout = 0.4
            workers = 200
        else:  # deep
            ports_to_scan = sorted(set(TOP_PORTS + DEEP_EXTRA))
            connect_timeout = 0.6
            workers = 250

        deadline = start + max(15, min(timeout, 180))
        total = len(ports_to_scan)
        open_ports: List[Dict[str, Any]] = []
        scanned = 0

        try:
            with ThreadPoolExecutor(max_workers=workers) as executor:
                futures = {
                    executor.submit(cls._probe_port, ip, p, connect_timeout): p
                    for p in ports_to_scan
                }
                for future in as_completed(futures):
                    scanned += 1
                    if time.time() > deadline:
                        break
                    try:
                        result = future.result()
                    except Exception:
                        continue
                    if result:
                        open_ports.append(result)
                        if progress_cb:
                            try:
                                progress_cb({
                                    "phase": "Port discovery",
                                    "ports": sorted(open_ports, key=lambda x: x["port"]),
                                    "scanned": scanned,
                                    "total": total,
                                    "resolved_ip": ip,
                                })
                            except Exception:
                                pass
        except Exception as e:
            logger.error(f"Scan executor failure: {e}")
            return {
                "status": "error",
                "target": target,
                "ports": [],
                "message": f"Scan engine error: {e}",
                "engine_log": str(e),
            }

        open_ports.sort(key=lambda x: x["port"])
        duration = round(time.time() - start, 2)

        if open_ports:
            message = (f"{intensity.capitalize()} scan completed in {duration}s — "
                       f"{len(open_ports)} open port(s) on {ip}.")
        else:
            message = (f"No open ports detected on {ip} ({duration}s). Host may be "
                       f"firewalled or offline.")

        return {
            "status": "success",
            "target": target,
            "resolved_ip": ip,
            "ports": open_ports,
            "message": message,
            "engine_log": f"Scanned {total} ports in {duration}s, {len(open_ports)} open",
        }


# Singleton instance
hex_scanner = HexScanner()
