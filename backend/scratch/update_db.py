import sqlite3
import os

db_path = r"c:\Users\user\Desktop\hex\backend\database\hexa.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(scans)")
    columns = [info[1] for info in cursor.fetchall()]
    print(f"Current columns in 'scans': {columns}")
    
    # Add missing columns
    if "asset_importance" not in columns:
        print("Adding 'asset_importance' to 'scans'...")
        cursor.execute("ALTER TABLE scans ADD COLUMN asset_importance INTEGER DEFAULT 3")
        
    if "exposure" not in columns:
        print("Adding 'exposure' to 'scans'...")
        cursor.execute("ALTER TABLE scans ADD COLUMN exposure VARCHAR(20) DEFAULT 'Public'")
    
    conn.commit()
    conn.close()
    print("Database maintenance complete.")
else:
    print(f"Database not found at {db_path}")
