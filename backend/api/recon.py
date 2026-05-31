from fastapi import APIRouter, Depends
from services.recon_service import ReconService
from services.osint_service import OsintService
from authentication.auth import get_current_user, check_role

router = APIRouter(prefix="/recon", tags=["recon"], dependencies=[Depends(check_role(["admin", "security_analyst", "analyst"]))])

@router.get("/full/{target}")
async def run_full_recon(target: str, current_user: dict = Depends(get_current_user)):
    """Run full reconnaissance: IP intel + geolocation + DNS + HTTP fingerprinting."""
    return ReconService.run_full_recon(target)

@router.get("/ip/{target}")
async def get_ip_info(target: str, current_user: dict = Depends(get_current_user)):
    """Get IP intelligence and geolocation for a target."""
    return ReconService.get_ip_intelligence(target)

@router.get("/dns/{domain}")
async def get_dns_info(domain: str, current_user: dict = Depends(get_current_user)):
    """Get DNS enumeration for a domain."""
    return ReconService.enumerate_dns(domain)

@router.get("/headers/{target}")
async def get_headers(target: str, current_user: dict = Depends(get_current_user)):
    """Fingerprint technology stack via HTTP headers."""
    return ReconService.fingerprint_headers(target)

@router.get("/osint")
async def gather_osint(target: str, category: str = "all", current_user: dict = Depends(get_current_user)):
    """Aggregate open-source intelligence about a target across public indexes."""
    return OsintService.run(target, category)
