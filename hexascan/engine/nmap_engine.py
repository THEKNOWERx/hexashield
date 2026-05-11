import asyncio
import subprocess
import json
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional

class NmapEngine:
    def __init__(self, target: str):
        self.target = target

    async def _run_nmap(self, args: List[str]) -> str:
        cmd = ["nmap"] + args + [self.target, "-oX", "-"]
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            if process.returncode != 0:
                return f"Error: {stderr.decode()}"
            return stdout.decode()
        except Exception as e:
            return f"Error: {str(e)}"

    async def fast_scan(self) -> List[int]:
        """Stage 1: Fast scan (top ports)"""
        output = await self._run_nmap(["-F", "--open"])
        return self._parse_ports(output)

    async def deep_scan(self, ports: List[int]) -> List[Dict[str, Any]]:
        """Stage 2: Deep scan (-sV, -O) on specific ports"""
        if not ports:
            return []
        port_str = ",".join(map(str, ports))
        output = await self._run_nmap(["-sV", "-O", "-p", port_str])
        return self._parse_full_results(output)

    def _parse_ports(self, xml_output: str) -> List[int]:
        try:
            root = ET.fromstring(xml_output)
            ports = []
            for port in root.findall(".//port"):
                ports.append(int(port.get("portid")))
            return ports
        except Exception:
            return []

    def _parse_full_results(self, xml_output: str) -> List[Dict[str, Any]]:
        try:
            root = ET.fromstring(xml_output)
            results = []
            for port in root.findall(".//port"):
                p_id = int(port.get("portid"))
                proto = port.get("protocol")
                state = port.find("state").get("state")
                
                service = port.find("service")
                s_name = service.get("name") if service is not None else "unknown"
                s_version = service.get("version") if service is not None else ""
                s_product = service.get("product") if service is not None else ""
                
                results.append({
                    "port_number": p_id,
                    "protocol": proto,
                    "state": state,
                    "service_name": s_name,
                    "service_version": f"{s_product} {s_version}".strip(),
                    "banner": None # Nmap doesn't give raw banners easily in XML, we'll probe later
                })
            return results
        except Exception:
            return []

    async def is_reachable(self) -> bool:
        """Task 1: Resolve and check if reachable"""
        output = await self._run_nmap(["-sn"])
        return "Host is up" in output or "1 host up" in output
