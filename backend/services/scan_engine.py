import subprocess
import re
import logging
import time
from typing import List, Dict, Any

# Configure Engine Logging
logger = logging.getLogger("HexScanner")

class HexScanner:
    """
    HEAVY-DUTY SCANNING ENGINE (Zero-Silent-Failure Design)
    Features: Subprocess control, Stdout/Stderr capture, Tiered Fallback, Strictly Structured JSON.
    """

    @staticmethod
    def _parse_nmap_output(raw_output: str) -> List[Dict]:
        """
        Robust Regex Parser for Nmap Stdout.
        Extracts: Port, State, Service.
        """
        ports = []
        # Pattern matches: 80/tcp  open  http
        pattern = r"(\d+)/(tcp|udp)\s+(\w+)\s+(.+)"
        matches = re.finditer(pattern, raw_output)
        
        for match in matches:
            ports.append({
                "port": int(match.group(1)),
                "protocol": match.group(2),
                "state": match.group(3),
                "service": match.group(4).strip()
            })
        return ports

    @staticmethod
    def _execute_bin(cmd: List[str], timeout: int = 60) -> Dict[str, Any]:
        """
        Safe binary execution with strict timeout and channel capture.
        """
        start = time.time()
        try:
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "success": True,
                "stdout": process.stdout,
                "stderr": process.stderr,
                "exit_code": process.returncode,
                "duration": round(time.time() - start, 2)
            }
        except subprocess.TimeoutExpired as e:
            return {
                "success": False,
                "error": "Timeout Reached",
                "stdout": e.stdout or "",
                "stderr": e.stderr or "",
                "partial": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "stdout": "",
                "stderr": str(e),
                "partial": False
            }

    @classmethod
    def run_robust_scan(cls, target: str, intensity: str = "deep", timeout: int = 90) -> Dict[str, Any]:
        """
        Main Entrance via Intensity-Aware Tiered Fallback.
        Intensity Options: 
          - fast: Optimized for speed (Top 100 ports, T4)
          - ultra: Maximized speed (Top 100 ports, T5, high rate)
          - deep: Detailed (Top 1000 ports, T4)
        """
        logger.info(f"Starting {intensity.upper()} Robust Scan for {target}")
        
        # 1. Intensity Flag Mapping
        if intensity == "ultra":
            cmd1 = ["nmap", "-T5", "-F", "--min-rate", "1000", "-Pn", "-n", target]
            scan_timeout = 20 # Ultra should be extremely fast
        elif intensity == "fast":
            cmd1 = ["nmap", "-T4", "-F", "--min-rate", "500", "-Pn", "-n", target]
            scan_timeout = 30
        else: # Default: Deep
            cmd1 = ["nmap", "-T4", "--top-ports", "1000", "-Pn", "-n", target]
            scan_timeout = timeout

        # --- STAGE 1: PRIMARY SCAN ---
        res1 = cls._execute_bin(cmd1, timeout=scan_timeout)
        
        ports = cls._parse_nmap_output(res1["stdout"])
        
        if res1["success"] and ports:
            return {
                "status": "success",
                "target": target,
                "ports": ports,
                "message": f"{intensity.capitalize()} scan completed successfully in {res1['duration']}s.",
                "engine_log": res1["stderr"]
            }

        # --- STAGE 2: FALLBACK (FAST) ---
        # Triggered if timeout partial, or no ports found, or error
        logger.warning(f"Stage 1 failed or returned 0 ports. Engaging Fast Fallback for {target}")
        cmd2 = ["nmap", "-F", "-Pn", "-n", target]
        res2 = cls._execute_bin(cmd2, timeout=30) # Fast scan has shorter timeout
        
        fallback_ports = cls._parse_nmap_output(res2["stdout"])
        
        if fallback_ports:
            status = "partial" if not res1["success"] else "success"
            return {
                "status": status,
                "target": target,
                "ports": fallback_ports,
                "message": "Primary scan failed/timed-out. Results retrieved via Fast Fallback.",
                "engine_log": res2["stderr"]
            }

        # --- FINAL FAIL: NO OUTPUT ---
        msg = "No open ports found or target unreachable."
        if not res1["success"] and not res2["success"]:
            msg = f"Scan failed: {res1.get('error')} / {res2.get('error')}"
            
        return {
            "status": "error" if not res1["success"] and not res2["success"] else "success",
            "target": target,
            "ports": [],
            "message": msg,
            "engine_log": f"S1: {res1.get('stderr')} | S2: {res2.get('stderr')}"
        }

# Singleton instance
hex_scanner = HexScanner()
