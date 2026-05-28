import requests
import json

try:
    print("--- Starting Pipeline Verification ---")
    # 1. Upload a dummy file
    with open("test_memory.txt", "w") as f:
        f.write("Grandfather and I visited Mumbai in 2015 during summer vacation.")
    
    with open("test_memory.txt", "rb") as f:
        files = {"file": ("test_memory.txt", f)}
        up_res = requests.post("http://localhost:8000/upload", files=files)
        print(f"Upload: {up_res.status_code}")
        data = up_res.json()
        m_id = data["memory_id"]
        f_path = data["file_path"]

    # 2. Process basic text
    pr_res = requests.post(f"http://localhost:8000/process/{m_id}?file_path={f_path}")
    print(f"Process: {pr_res.status_code}")

    # 3. AI Enrichment (The new layer)
    en_res = requests.post(f"http://localhost:8000/enrich/{m_id}?file_path={f_path}")
    print(f"Enrich: {en_res.status_code}")
    print(f"Enriched Data: {en_res.json()}")

except Exception as e:
    print(f"Pipeline Error: {e}")
