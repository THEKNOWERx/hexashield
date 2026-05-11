import socket
import platform

def get_os_hint_from_ttl(ttl: int) -> str:
    """Basic OS fingerprinting based on IP TTL values."""
    if ttl <= 64:
        return "Linux/Unix"
    elif ttl <= 128:
        return "Windows"
    elif ttl <= 255:
        return "Cisco/Network Device"
    return "Unknown"

def get_hostname(ip: str) -> str:
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, Exception):
        return ip
