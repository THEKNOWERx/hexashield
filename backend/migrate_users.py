import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(__file__), "database", "hexa.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.execute("PRAGMA table_info(users)")
existing = [row[1] for row in c.fetchall()]

ROLE_ROUTES = {
  "admin": ["/dashboard", "/recon", "/scan", "/vulnerabilities", "/exploitation", "/reports", "/about", "/admin", "/settings", "/attack-path", "/scientific-lab", "/ai-assistant"],
  "security_analyst": ["/dashboard", "/recon", "/scan", "/vulnerabilities", "/exploitation", "/reports", "/attack-path", "/about", "/ai-assistant"],
  "analyst": ["/dashboard", "/recon", "/scan", "/vulnerabilities", "/exploitation", "/reports", "/attack-path", "/about", "/ai-assistant"],
  "student": ["/scientific-lab", "/attack-path", "/about", "/ai-assistant"]
}

if "is_active" not in existing:
    c.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")
    print("[FIXED] Added is_active to users")

if "permissions" not in existing:
    c.execute("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]'")
    print("[FIXED] Added permissions to users")
    
    # Initialize permissions based on role
    c.execute("SELECT id, role FROM users")
    users = c.fetchall()
    for uid, role in users:
        perms = ROLE_ROUTES.get(role, ROLE_ROUTES["analyst"])
        perms_json = json.dumps(perms)
        c.execute("UPDATE users SET permissions = ? WHERE id = ?", (perms_json, uid))
    
    print("[FIXED] Seeded permissions for existing users")

conn.commit()
conn.close()
print("User migration complete!")
