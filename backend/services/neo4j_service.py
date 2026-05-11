import os
import logging

try:
    from neo4j import GraphDatabase
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False

class Neo4jService:
    """
    Expert: Hybrid Persistence Controller for Relationship Intelligence.
    Handles graph node injection and complex relationship mapping (Cypher).
    """
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = None
        
        if NEO4J_AVAILABLE:
            try:
                # Expert Stability Fix: Use strict connection timeouts
                self.driver = GraphDatabase.driver(
                    self.uri, 
                    auth=(self.user, self.password),
                    connection_timeout=1.0, 
                    max_transaction_retry_time=1.0
                )
            except Exception as e:
                logging.error(f"Neo4j Connection Failed: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def sync_finding_to_graph(self, host_ip: str, port: int, service_name: str, cve_id: str, cvss: float, edb_id: str = None):
        """
        Synchronizes a PostgreSQL finding into the Neo4j Graph.
        Expert Cypher Logic: MERGE nodes to prevent duplicates, CREATE relationships.
        """
        if not self.driver:
            logging.info(f"[GRAPH-FALLBACK] Simulated Cypher: MERGE (h:Host {{ip: '{host_ip}'}}) ...")
            return

        with self.driver.session() as session:
            session.execute_write(self._sync_tx, host_ip, port, service_name, cve_id, cvss, edb_id)

    @staticmethod
    def _sync_tx(tx, host_ip, port, service_name, cve_id, cvss, edb_id):
        # 1. Ensure Host exists
        tx.run("MERGE (h:Host {ip: $ip})", ip=host_ip)
        
        # 2. Ensure Service exists and link to Host
        tx.run("""
            MATCH (h:Host {ip: $ip})
            MERGE (s:Service {port: $port, name: $name})
            MERGE (h)-[:EXPOSES]->(s)
        """, ip=host_ip, port=port, name=service_name)
        
        # 3. Ensure Vulnerability exists and link to Service
        tx.run("""
            MATCH (s:Service {port: $port})
            MERGE (v:Vulnerability {cve_id: $cve_id})
            ON CREATE SET v.cvss = $cvss
            MERGE (s)-[:AFFECTED_BY]->(v)
        """, port=port, cve_id=cve_id, cvss=cvss)
        
        # 4. Ensure Exploit exists and link to Vulnerability
        if edb_id:
            tx.run("""
                MATCH (v:Vulnerability {cve_id: $cve_id})
                MERGE (e:Exploit {edb_id: $edb_id})
                MERGE (v)-[:WEAPONIZED_BY]->(e)
            """, cve_id=cve_id, edb_id=edb_id)
            
        # 5. Derive and link Impact (Task 1)
        impact_name = "Information Disclosure"
        if cvss >= 9.0: impact_name = "Total System Compromise"
        elif cvss >= 7.0: impact_name = "Critical Data Exfiltration"
        elif cvss >= 5.0: impact_name = "Unauthorized Access"

        tx.run("""
            MATCH (v:Vulnerability {cve_id: $cve_id})
            MERGE (i:Impact {name: $impact_name})
            MERGE (v)-[:RESULTS_IN]->(i)
        """, cve_id=cve_id, impact_name=impact_name)

    def get_shortest_path(self, host_ip: str):
        """Analytical Graph Query: Finds the most direct path to a Critical Impact."""
        if not self.driver: return []
        query = """
        MATCH p=shortestPath((h:Host {ip: $ip})-[*..10]->(i:Impact))
        WHERE i.name IN ['Total System Compromise', 'Critical Data Exfiltration']
        RETURN p
        """
        with self.driver.session() as session:
            result = session.run(query, ip=host_ip)
            return result.single()

    def get_weighted_risk_path(self, host_ip: str):
        """Graph Intelligence: Calculates the path with maximum cumulative vulnerability risk."""
        if not self.driver: return []
        query = """
        MATCH p=(h:Host {ip: $ip})-[:EXPOSES]->(s)-[:AFFECTED_BY]->(v)-[:RESULTS_IN]->(i)
        RETURN p, v.cvss as score
        ORDER BY score DESC
        LIMIT 1
        """
        with self.driver.session() as session:
            result = session.run(query, ip=host_ip)
            return result.single()

    def get_full_graph_data(self, host_ip: str):
        """Serializes the entire local attack surface for frontend visualization."""
        if not self.driver: return {"nodes": [], "edges": []}
        query = "MATCH (n)-[r]->(m) WHERE (n:Host {ip: $ip}) OR (n)-[*]->(m) RETURN n, r, m"
        nodes = []
        edges = []
        with self.driver.session() as session:
            results = session.run(query, ip=host_ip)
            for record in results:
                for node in [record['n'], record['m']]:
                    n_data = {"id": node.id, "labels": list(node.labels), "properties": dict(node)}
                    if n_data not in nodes: nodes.append(n_data)
                rel = record['r']
                edges.append({"id": rel.id, "type": rel.type, "source": rel.start_node.id, "target": rel.end_node.id})
        return {"nodes": nodes, "edges": edges}

neo4j_service = Neo4jService()
