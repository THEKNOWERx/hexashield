from cvss import CVSS3
import json

v = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
c3 = CVSS3(v)
print(f"Attributes: {dir(c3)}")
print(f"Base Score: {c3.base_score}")
