import asyncio
import socket
import time
from datetime import datetime
from typing import List, Dict, Any, Callable, Optional
from hexascan.scanner.services import get_service_info, get_risk_level
from hexascan.scanner.banners import get_os_hint_from_ttl

class AsyncScanner:
    def __init__(self, target: str, worker_count: int = 500, timeout: float = 1.0):
        self.target = target
        self.worker_count = worker_count
        self.timeout = timeout
        self.semaphore = asyncio.Semaphore(worker_count)
        self.results = []
        self.start_time = None
        self.end_time = None
        self.os_hint = "Unknown"
        self.ports_scanned = 0

    async def scan_port(self, port: int, protocol: str = "tcp", progress_callback: Callable = None):
        async with self.semaphore:
            result = {
                "port_number": port,
                "protocol": protocol,
                "state": "closed",
                "service_name": "unknown",
                "service_version": None,
                "banner": None,
                "response_time_ms": None
            }
            
            start_ts = time.perf_counter()
            try:
                if protocol == "tcp":
                    # Attempt connection
                    conn = asyncio.open_connection(self.target, port)
                    reader, writer = await asyncio.wait_for(conn, timeout=self.timeout)
                    
                    result["state"] = "open"
                    result["response_time_ms"] = (time.perf_counter() - start_ts) * 1000
                    
                    # OS Hinting via TTL (only works if we can get the underlying socket)
                    try:
                        # This is a bit tricky with asyncio, usually requires raw socket or scapy
                        # For now, we use a basic socket connection to get TTL if possible
                        sock = writer.get_extra_info('socket')
                        if sock:
                            ttl = sock.getsockopt(socket.IPPROTO_IP, socket.IP_TTL)
                            self.os_hint = get_os_hint_from_ttl(ttl)
                    except:
                        pass

                    # Try banner grabbing
                    try:
                        # Some services need a probe to return a banner
                        if port in [80, 8080]:
                            writer.write(b"HEAD / HTTP/1.0\r\n\r\n")
                            await writer.drain()
                        
                        banner_data = await asyncio.wait_for(reader.read(1024), timeout=1.0)
                        if banner_data:
                            result["banner"] = banner_data.decode('utf-8', errors='ignore').strip()
                            # Basic version extraction from banner (e.g. Apache/2.4.41)
                            if "/" in result["banner"]:
                                parts = result["banner"].split()
                                for p in parts:
                                    if "/" in p:
                                        result["service_version"] = p
                                        break
                    except:
                        pass
                    
                    writer.close()
                    await writer.wait_closed()
                    
                elif protocol == "udp":
                    # UDP logic: Send empty packet, if no ICMP unreachable comes back, it MIGHT be open/filtered
                    # This is highly unreliable without raw sockets/Scapy, but here's a basic async version
                    class UDPScannerProtocol(asyncio.DatagramProtocol):
                        def __init__(self, on_con_lost):
                            self.on_con_lost = on_con_lost
                        def datagram_received(self, data, addr):
                            result["state"] = "open"
                            result["banner"] = data.decode('utf-8', errors='ignore')
                            self.on_con_lost.set_result(True)
                        def error_received(self, exc):
                            result["state"] = "closed"
                            self.on_con_lost.set_result(True)

                    loop = asyncio.get_running_loop()
                    on_con_lost = loop.create_future()
                    transport, protocol_obj = await loop.create_datagram_endpoint(
                        lambda: UDPScannerProtocol(on_con_lost),
                        remote_addr=(self.target, port)
                    )
                    try:
                        transport.sendto(b"\x00") # Tiny probe
                        await asyncio.wait_for(on_con_lost, timeout=self.timeout)
                    except asyncio.TimeoutError:
                        # Many open UDP ports don't respond to empty packets
                        result["state"] = "open|filtered" 
                    finally:
                        transport.close()

            except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
                result["state"] = "closed"
            
            if result["state"] in ["open", "open|filtered"]:
                srv_info = get_service_info(port, protocol)
                result["service_name"] = srv_info["name"]
                result["risk_level"] = get_risk_level(result["service_name"], port)
                self.results.append(result)
            
            self.ports_scanned += 1
            if progress_callback:
                progress_callback(port)
            
            return result

    async def run(self, ports: List[int], protocol: str = "tcp", progress_callback: Callable = None):
        self.start_time = datetime.utcnow()
        self.results = []
        self.ports_scanned = 0
        
        # Batch size for processing to prevent event loop over-saturation
        BATCH_SIZE = 2000
        
        port_list = []
        if protocol == "both":
            for p in ports:
                port_list.append((p, "tcp"))
                port_list.append((p, "udp"))
        else:
            for p in ports:
                port_list.append((p, protocol))
        
        # Process in batches
        for i in range(0, len(port_list), BATCH_SIZE):
            batch = port_list[i : i + BATCH_SIZE]
            tasks = [self.scan_port(p, proto, progress_callback=progress_callback) for p, proto in batch]
            await asyncio.gather(*tasks)
            
        self.end_time = datetime.utcnow()
        return self.results

    @property
    def duration(self):
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0

    @property
    def scan_speed(self):
        d = self.duration
        if d > 0:
            return self.ports_scanned / d
        return 0
