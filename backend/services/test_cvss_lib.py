from cvss import CVSS3, CVSS2

v = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
try:
    c3 = CVSS3(v)
    print(f"Base Score: {c3.base_score}")
except Exception as e:
    print(f"Error with full vector: {e}")

try:
    v2 = v.split("/", 1)[1] if "/" in v else v
    c3_v2 = CVSS3(v2)
    print(f"Base Score (no prefix): {c3_v2.base_score}")
except Exception as e:
    print(f"Error without prefix: {e}")
