from database.db import engine
from sqlalchemy import inspect
inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('scans')]
if 'user_id' in columns:
    print("SUCCESS: scans.user_id found")
else:
    print("FAILURE: scans.user_id MISSING")
