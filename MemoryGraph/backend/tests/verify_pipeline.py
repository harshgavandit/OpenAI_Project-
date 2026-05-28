import requests
import time
import subprocess
import os
import threading

def start_server():
    os.chdir("G:/OpenAI_Project/MemoryGraph/backend")
    subprocess.run(["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"])

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(5) 

try:
    with open("G:/OpenAI_Project/MemoryGraph/backend/data/uploads/test_memory.txt", "rb") as f:
        files = {"file": ("test_memory.txt", f)}
        resp = requests.post("http://localhost:8000/upload", files=files)
        print(f"Upload Resp: {resp.status_code} - {resp.json()}")
        memory_id = resp.json().get("memory_id")
        file_path = resp.json().get("file_path")

    resp = requests.post(f"http://localhost:8000/process/{memory_id}?file_path={file_path}")
    print(f"Process Resp: {resp.status_code} - {resp.json()}")

    resp = requests.get("http://localhost:8000/memories/search?query=grandfather")
    print(f"Search Resp: {resp.status_code} - {resp.json()}")

except Exception as e:
    print(f"Verification failed: {e}")
