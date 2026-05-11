import time
import functools
from typing import Dict, Any, Optional

class CacheService:
    """A high-performance in-memory caching system for external intelligence lookups."""
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        """Retrieve a value from the cache if it hasn't expired."""
        entry = cls._cache.get(key)
        if entry:
            if time.time() < entry['expiry']:
                return entry['data']
            else:
                # Cleanup expired entry
                del cls._cache[key]
        return None

    @classmethod
    def set(cls, key: str, data: Any, ttl: int = 3600):
        """Store data in the cache with a specified Time-to-Live in seconds."""
        cls._cache[key] = {
            'data': data,
            'expiry': time.time() + ttl
        }

    @classmethod
    def get_scan(cls, target: str, mode: str) -> Optional[Dict]:
        """Strategic cache lookup for full scan results."""
        key = f"scan:{target}:{mode}"
        return cls.get(key)

    @classmethod
    def set_scan(cls, target: str, mode: str, data: Dict, ttl: int = 14400):
        """Strategic cache storage for scan results (default 4 hours)."""
        key = f"scan:{target}:{mode}"
        cls.set(key, data, ttl)

    @staticmethod
    def lru_cache_wrapper(ttl: int = 600):
        """Decorator for ultra-fast LRU caching with internal TTL support."""
        def decorator(func):
            @functools.lru_cache(maxsize=1024)
            def cached_func(*args, **kwargs):
                return func(*args, **kwargs)
            return cached_func
        return decorator

# Global utility for simple key-value caching
def intelligence_cache(ttl: int = 3600):
    """Decorator to cache service methods (like CVE lookups)."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            cached = CacheService.get(key)
            if cached is not None:
                return cached
            result = func(*args, **kwargs)
            CacheService.set(key, result, ttl)
            return result
        return wrapper
    return decorator
