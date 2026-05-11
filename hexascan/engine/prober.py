import asyncio
import socket
import httpx
from typing import Dict, Any, Optional

class Prober:
    def __init__(self, target: str, timeout: float = 2.0):
        self.target = target
        self.timeout = timeout

    async def grab_banner(self, port: int) -> Optional[str]:
        """Confirm port status twice + Validate using banner grabbing"""
        try:
            # First confirmation
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.target, port), 
                timeout=self.timeout
            )
            
            # Banner grabbing
            if port in [21, 22, 25]: # Services that send banner on connect
                banner = await asyncio.wait_for(reader.read(1024), timeout=self.timeout)
                writer.close()
                await writer.wait_closed()
                return banner.decode('utf-8', errors='ignore').strip()
            
            # Services that need a probe
            probes = {
                80: b"HEAD / HTTP/1.0\r\n\r\n",
                8080: b"HEAD / HTTP/1.0\r\n\r\n",
                443: b"HEAD / HTTP/1.0\r\n\r\n",
            }
            
            if port in probes:
                writer.write(probes[port])
                await writer.drain()
                banner = await asyncio.wait_for(reader.read(1024), timeout=self.timeout)
                writer.close()
                await writer.wait_closed()
                return banner.decode('utf-8', errors='ignore').strip()
            
            writer.close()
            await writer.wait_closed()
            return "No banner available"
        except Exception:
            return None

    async def validate_web(self, port: int) -> Dict[str, Any]:
        """Task 5: Web Validation (HTTP/HTTPS)"""
        protocol = "https" if port == 443 else "http"
        url = f"{protocol}://{self.target}:{port}"
        
        async with httpx.AsyncClient(verify=False, timeout=self.timeout) as client:
            try:
                response = await client.get(url)
                return {
                    "status_code": response.status_code,
                    "server": response.headers.get("Server", "Unknown"),
                    "content_preview": response.text[:100].replace("\n", " "),
                    "is_web": True
                }
            except Exception as e:
                return {"is_web": False, "error": str(e)}

    async def cross_validate_port(self, port: int, protocol: str = "tcp") -> Dict[str, Any]:
        """Stage 3: Re-scan open ports only + Validation"""
        banner = await self.grab_banner(port)
        web_info = None
        if port in [80, 443, 8080, 8443]:
            web_info = await self.validate_web(port)
            
        return {
            "banner": banner,
            "web_info": web_info,
            "confirmed": banner is not None
        }
