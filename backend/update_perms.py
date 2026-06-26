import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(__file__), "database", "hexa.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

full_perms = ["/dashboard", "/recon", "/scan", "/vulnerabilities", "/exploitation", "/reports", "/attack-path", "/scientific-lab", "/ai-assistant"]

full_perms_json = json.dumps(full_perms)

c.execute("UPDATE users SET permissions = ? WHERE role IN ('student', 'analyst', 'security_analyst')", (full_perms_json,))

conn.commit()
conn.close()

print(f"Updated permissions for student and analyst to include all sections: {full_perms}")
