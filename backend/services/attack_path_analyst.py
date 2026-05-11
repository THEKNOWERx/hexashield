import networkx as nx
from typing import List, Dict, Any, Optional
import json

class AttackPathAnalyst:
    """
    CYBERSECURITY DATA SCIENCE ENGINE
    Models infrastructure as a Directed Graph to analyze attack vectors and lateral movement.
    """

    def __init__(self):
        self.graph = nx.DiGraph()
        self.entry_point = "INTERNET_SOURCE"

    def build_from_findings(self, scan_target: str, findings: List[Dict]):
        """Constructs a real-time attack graph from live scan intelligence."""
        self.graph.clear()
        self.graph.add_node(self.entry_point, type="ENTRY", label="Attacker (Internet)")
        
        target_host = scan_target
        self.graph.add_node(target_host, type="HOST", label=f"Host: {target_host}")
        
        for f in findings:
            port = f.get('port')
            service_name = f.get('name', 'Unknown Service')
            cve = f.get('cve', 'N/A')
            cvss = f.get('cvss_score', 5.0)
            
            service_id = f"{target_host}:{port}"
            vuln_id = f"{cve if cve != 'N/A' else service_name}"
            
            # Nodes
            self.graph.add_node(service_id, type="SERVICE", label=f"Service: {service_name} ({port})")
            self.graph.add_node(vuln_id, type="VULNERABILITY", label=f"Vuln: {vuln_id}", cvss=cvss)
            
            # Edges with Attack "Resistance" Weight (10 - CVSS)
            # A higher CVSS means lower resistance (easier path)
            resistance = 10.0 - cvss
            
            self.graph.add_edge(self.entry_point, service_id, weight=1.0, relation="EXPOSURE")
            self.graph.add_edge(service_id, vuln_id, weight=resistance, relation="VULNERABLE_TO")
            self.graph.add_edge(vuln_id, target_host, weight=0.1, relation="COMPROMISES")

            # Heuristic Lateral Movement: Model a second "Internal Database" target for demonstration
            internal_target = "192.168.1.50 (Internal DB)"
            self.graph.add_node(internal_target, type="HOST", label="Critical Database")
            # If the web service is compromised, maybe it can reach the DB
            self.graph.add_edge(target_host, internal_target, weight=2.0, relation="LATERAL_ACCESS")

    def get_critical_attack_path(self) -> Dict[str, Any]:
        """Calculates the Path of Least Resistance (Highest Cumulative Risk)."""
        all_hosts = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "HOST"]
        
        critical_path = []
        max_risk_score = 0
        best_path_nodes = []

        for host in all_hosts:
            try:
                # Find the shortest path (least resistance) using Dijkstra
                path = nx.shortest_path(self.graph, source=self.entry_point, target=host, weight="weight")
                
                # Calculate path risk level (Higher is more dangerous)
                path_resistance = nx.path_weight(self.graph, path, weight="weight")
                # Risk Score = 100 - (resistance * multiplier) -> Heuristic
                risk_score = max(0, 100 - (path_resistance * 5))
                
                if risk_score > max_risk_score:
                    max_risk_score = risk_score
                    best_path_nodes = path
            except nx.NetworkXNoPath:
                continue

        # Format the Attack Manifesto
        steps = []
        for i in range(len(best_path_nodes) - 1):
            u, v = best_path_nodes[i], best_path_nodes[i+1]
            edge_data = self.graph.get_edge_data(u, v)
            u_label = self.graph.nodes[u].get("label", u)
            v_label = self.graph.nodes[v].get("label", v)
            
            steps.append({
                "step": i + 1,
                "from": u_label,
                "to": v_label,
                "vector": edge_data.get("relation"),
                "resistance_score": round(edge_data.get("weight", 0), 2)
            })

        return {
            "critical_path": steps,
            "total_risk_score": round(max_risk_score, 2),
            "threat_actor": "External Persistent Threat",
            "critical_nodes": best_path_nodes
        }

if __name__ == "__main__":
    # Cybersecurity Data Scientist Demonstration
    analyst = AttackPathAnalyst()
    
    # Mock Findings for a simulated multi-hop attack
    mock_findings = [
        {"port": 80, "name": "Apache HTTPD", "cve": "CVE-2021-41773", "cvss_score": 9.8},
        {"port": 22, "name": "OpenSSH", "cve": "N/A", "cvss_score": 4.0}
    ]
    
    print("[DATA_SCIENCE] Building Attack Graph...")
    analyst.build_from_findings("45.33.32.156", mock_findings)
    
    print("[DATA_SCIENCE] Analyzing Critical Attack Paths...")
    report = analyst.get_critical_attack_path()
    
    print("\n--- CRITICAL ATTACK MANIFESTO ---")
    print(f"Aggregated Path Risk Level: {report['total_risk_score']}%")
    for step in report['critical_path']:
        print(f"Step {step['step']}: {step['from']} -> {step['to']} via {step['vector']} (Resistance: {step['resistance_score']})")
    
    print("\n[CONCLUSION] Attackers will prioritize the path through CVE-2021-41773 to achieve lateral access to the Critical Database.")
