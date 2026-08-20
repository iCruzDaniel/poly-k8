import os
from fastapi import FastAPI

app = FastAPI()
API_KEY = os.getenv("INTERNAL_API_KEY", "default-secret-key")

@app.get("/health")
def health():
    return {"status": "ok", "service": "Python FastAPI Auth"}

@app.get("/validate")
def validate():
    return {
        "authenticated": True,
        "user": "k8s-admin",
        "role": "cluster-operator",
        "secret_check": API_KEY[:4] + "****"
    }
