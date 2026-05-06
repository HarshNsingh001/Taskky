import httpx
import time

c = httpx.Client(timeout=30)
r = c.post("http://127.0.0.1:8000/api/v1/auth/login", json={"email": "admin@taskky.com", "password": "Admin@123"})
token = r.json()["data"]["tokens"]["access_token"]
h = {"Authorization": f"Bearer {token}"}

endpoints = ["/api/v1/projects", "/api/v1/tasks", "/api/v1/analytics/dashboard"]

print("=== First call (cold) ===")
for ep in endpoints:
    t = time.time()
    r = c.get(f"http://127.0.0.1:8000{ep}", headers=h)
    ms = round((time.time() - t) * 1000)
    print(f"  {ep}: {ms}ms ({r.status_code})")

print("\n=== Second call (warm pool) ===")
for ep in endpoints:
    t = time.time()
    r = c.get(f"http://127.0.0.1:8000{ep}", headers=h)
    ms = round((time.time() - t) * 1000)
    print(f"  {ep}: {ms}ms ({r.status_code})")
