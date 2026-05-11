from typing import List, Dict, Any

class Analyzer:
    def __init__(self):
        pass

    def calculate_confidence(self, nmap_result: Dict[str, Any], probe_result: Dict[str, Any]) -> float:
        """Task 8: Confidence Scoring"""
        methods = 0
        matches = 0
        
        # Method 1: Nmap Service Detection
        if nmap_result.get("service_name") != "unknown":
            methods += 1
            
        # Method 2: Banner Grabbing
        if probe_result.get("banner") and probe_result["banner"] != "No banner available":
            methods += 1
            # Does it match Nmap?
            if nmap_result.get("service_name").lower() in probe_result["banner"].lower():
                matches += 1
                
        # Method 3: Web Validation
        if probe_result.get("web_info") and probe_result["web_info"].get("is_web"):
            methods += 1
            server_header = probe_result["web_info"].get("server", "").lower()
            if nmap_result.get("service_version").lower() in server_header or nmap_result.get("service_name").lower() in server_header:
                matches += 1

        if methods >= 2 and matches >= 1:
            return 1.0  # High
        if methods >= 1:
            return 0.5  # Medium
        return 0.2  # Low

    def ai_verify(self, port: int, service: str, version: str, banner: str) -> Dict[str, Any]:
        """Task 9: AI Verification Layer (Heuristic Intelligence)"""
        # Simulated AI logic based on common vulnerability patterns and service consistency
        score = 0.5
        risk = "Informational"
        
        # Consistency Check
        if service.lower() in ["http", "https"] and port not in [80, 443, 8080, 8443]:
            score -= 0.1 # Unusual port for web service
            
        if version:
            score += 0.2
            # Vulnerability Prediction (Simulated)
            if any(v in version.lower() for v in ["apache/2.2", "openssh/7.2", "iis/7.5"]):
                risk = "High"
                score += 0.2
        
        if banner and len(banner) > 10:
            score += 0.1

        return {
            "validation_score": min(round(score, 2), 1.0),
            "predicted_risk": risk
        }

    def synthesize(self, nmap_results: List[Dict[str, Any]], probe_results: Dict[int, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Combine all data and validate"""
        final_results = []
        for n in nmap_results:
            port = n["port_number"]
            probe = probe_results.get(port, {})
            
            confidence = self.calculate_confidence(n, probe)
            ai_data = self.ai_verify(port, n["service_name"], n["service_version"], probe.get("banner", ""))
            
            validated_by = ["nmap"]
            if probe.get("banner"): validated_by.append("banner")
            if probe.get("web_info") and probe["web_info"].get("is_web"): validated_by.append("http")
            
            final_results.append({
                "port": port,
                "service": n["service_name"],
                "version": n["service_version"],
                "state": n["state"],
                "confidence": confidence,
                "validated_by": validated_by,
                "ai_score": ai_data["validation_score"],
                "risk_level": ai_data["predicted_risk"],
                "banner": probe.get("banner"),
                "web_details": probe.get("web_info")
            })
        return final_results
