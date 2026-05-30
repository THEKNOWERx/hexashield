import os
import pytest

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only")
os.environ.setdefault("ADMIN_PASSWORD", "test-admin-password")
