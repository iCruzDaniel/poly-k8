Este es el **System Design Document (SDD)** estructurado y listo para que lo lea tu agente de AI (como OpenCode, Devin, Cursor, etc.). Está diseñado con instrucciones claras, especificaciones de archivos, código base ligero y los manifiestos exactos de Kubernetes.

Puedes copiar el bloque de texto en un archivo `SDD.md` en la raíz de tu repositorio y pedirle a tu agente:

> *"Lee el archivo SDD.md e impleméntalo paso a paso."*

---

# System Design Document (SDD): Polyglot Microservices Mesh on Kubernetes

**Versión:** 1.0.0

**Target Execution:** Agentes de Code Generation (OpenCode, Cursor, Windsurf)

**Objetivo:** Crear un monorepo funcional con 5 microservicios ultraligeros y manifiestos declarativos de Kubernetes (K8s) listos para despliegue en entornos locales (`Kind` / `Minikube`).

---

## 1. Visión General de la Arquitectura

El proyecto consta de una arquitectura de microservicios políglotas (Python, Node.js/TypeScript, Nginx) que interactúan entre sí. La entrada de tráfico externo es administrada por un **Nginx Ingress Controller**, y la comunicación entre servicios utiliza el **DNS interno de Kubernetes**.

```text
[ Cliente / Navegador ]
          │
          ▼ (Puerto 80)
   [ Nginx Ingress ]
      │          │
      │          └─ / ──────────────────────► [frontend-svc] ────► [01-frontend] (Nginx Static)
      │
      └─ /api/ ─────────────────────────────► [api-gateway-svc] ─► [02-api-gateway] (TS/Express)
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        ▼                          ▼                          ▼
               [auth-svc:8080]            [analytics-svc:8080]       [processor-svc:8080]
              [03-auth-service]          [04-analytics-service]     [05-data-processor]
               (Python/FastAPI)             (Node.js/Express)          (Python/Flask)

```

---

## 2. ESTRUCTURA DEL MONOREPO

El agente de AI debe generar la siguiente estructura de carpetas y archivos:

```text
polyglot-k8s/
├── microservices/
│   ├── 01-frontend/
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── index.html
│   ├── 02-api-gateway/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── 03-auth-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── main.py
│   ├── 04-analytics-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── index.js
│   └── 05-data-processor/
│       ├── Dockerfile
│       ├── requirements.txt
│       └── app.py
├── k8s/
│   ├── 00-namespace.yaml
│   ├── 01-configmap-secrets.yaml
│   ├── 02-deployments.yaml
│   ├── 03-services.yaml
│   └── 04-ingress.yaml
├── scripts/
│   └── build-and-load.sh
├── SDD.md
└── README.md

```

---

## 3. ESPECIFICACIÓN DE MICROSERVICIOS

### 3.1. `01-frontend` (Nginx HTML/JS Static)

* **Tecnología:** Nginx Alpine.
* **Función:** Interfaz web sencilla con 3 botones que consumen los endpoints de la API Central (`/api/auth/validate`, `/api/analytics`, `/api/process`).
* **Código `index.html`:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Polyglot K8s Mesh</title>
    <style>
        body { font-family: monospace; background: #0f172a; color: #f8fafc; padding: 2rem; }
        .card { background: #1e293b; border: 1px solid #334155; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        button { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        pre { background: #020617; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Polyglot Microservices Dashboard (K8s)</h1>
    <div class="card">
        <button onclick="testApi('/api/auth/validate')">Probar Auth</button>
        <button onclick="testApi('/api/analytics')">Probar Analytics</button>
        <button onclick="testApi('/api/process')">Probar Data Processor</button>
    </div>
    <div class="card">
        <h3>Respuesta:</h3>
        <pre id="output">Haz clic en un botón para ejecutar llamada inter-servicio...</pre>
    </div>
    <script>
        async function testApi(endpoint) {
            const out = document.getElementById('output');
            out.textContent = "Cargando...";
            try {
                const res = await fetch(endpoint);
                const data = await res.json();
                out.textContent = JSON.stringify(data, null, 2);
            } catch (err) {
                out.textContent = "Error: " + err.message;
            }
        }
    </script>
</body>
</html>

```

* **Dockerfile:**

```dockerfile
FROM nginx:alpine
COPY src/index.html /usr/share/nginx/html/index.html
EXPOSE 80

```

---

### 3.2. `02-api-gateway` (TypeScript / Node.js)

* **Tecnología:** Express + Axios.
* **Variables de entorno:**
* `AUTH_SERVICE_URL` (Default: `http://auth-svc:8080`)
* `ANALYTICS_SERVICE_URL` (Default: `http://analytics-svc:8080`)
* `PROCESSOR_SERVICE_URL` (Default: `http://processor-svc:8080`)


* **Código `src/index.ts`:**

```typescript
import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-svc:8080';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://analytics-svc:8080';
const PROCESSOR_URL = process.env.PROCESSOR_SERVICE_URL || 'http://processor-svc:8080';

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', gateway: 'TypeScript Express' }));

app.get('/api/auth/validate', async (req, res) => {
    try {
        const response = await axios.get(`${AUTH_URL}/validate`);
        res.json({ gateway: 'API Gateway', upstream: response.data });
    } catch (err: any) {
        res.status(500).json({ error: 'Auth service unreachable', details: err.message });
    }
});

app.get('/api/analytics', async (req, res) => {
    try {
        const response = await axios.get(`${ANALYTICS_URL}/metrics`);
        res.json({ gateway: 'API Gateway', upstream: response.data });
    } catch (err: any) {
        res.status(500).json({ error: 'Analytics service unreachable', details: err.message });
    }
});

app.get('/api/process', async (req, res) => {
    try {
        const response = await axios.post(`${PROCESSOR_URL}/process`, { payload: "k8s-mesh-data" });
        res.json({ gateway: 'API Gateway', upstream: response.data });
    } catch (err: any) {
        res.status(500).json({ error: 'Processor service unreachable', details: err.message });
    }
});

app.listen(PORT, () => console.log(`API Gateway escuchando en puerto ${PORT}`));

```

* **Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]

```

---

### 3.3. `03-auth-service` (Python / FastAPI)

* **Tecnología:** FastAPI + Uvicorn.
* **Código `main.py`:**

```python
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

```

* **Dockerfile:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

```

* **`requirements.txt`:** `fastapi`, `uvicorn`

---

### 3.4. `04-analytics-service` (JavaScript / Node.js Express)

* **Tecnología:** Express JS.
* **Código `index.js`:**

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Node.js Analytics' }));

app.get('/metrics', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        metrics: {
            active_pods: 5,
            requests_processed: Math.floor(Math.random() * 1000),
            cluster_status: "HEALTHY"
        }
    });
});

app.listen(PORT, () => console.log(`Analytics Service corriendo en puerto ${PORT}`));

```

* **Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.js .
EXPOSE 8080
CMD ["node", "index.js"]

```

---

### 3.5. `05-data-processor` (Python / Flask)

* **Tecnología:** Flask.
* **Código `app.py`:**

```python
from flask import Flask, request, jsonify
import datetime

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Python Flask Processor"})

@app.route('/process', methods=['POST'])
def process():
    data = request.json or {}
    payload = data.get("payload", "empty")
    
    return jsonify({
        "processed": True,
        "original_payload": payload,
        "transformed": payload.upper() + "_PROCESSED_BY_FLASK",
        "processed_at": str(datetime.datetime.utcnow())
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

```

* **Dockerfile:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8080
CMD ["python", "app.py"]

```

* **`requirements.txt`:** `flask`

---

## 4. MANIFIESTOS DE KUBERNETES (`/k8s`)

### `k8s/00-namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: polyglot-app

```

### `k8s/01-configmap-secrets.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gateway-config
  namespace: polyglot-app
data:
  AUTH_SERVICE_URL: "http://auth-svc.polyglot-app.svc.cluster.local:8080"
  ANALYTICS_SERVICE_URL: "http://analytics-svc.polyglot-app.svc.cluster.local:8080"
  PROCESSOR_SERVICE_URL: "http://processor-svc.polyglot-app.svc.cluster.local:8080"
---
apiVersion: v1
kind: Secret
metadata:
  name: auth-secrets
  namespace: polyglot-app
type: Opaque
stringData:
  INTERNAL_API_KEY: "super-secret-k8s-mesh-token"

```

### `k8s/02-deployments.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-dep
  namespace: polyglot-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: polyglot/frontend:v1
        imagePullPolicy: Never
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: "50m"
            memory: "32Mi"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway-dep
  namespace: polyglot-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: polyglot/api-gateway:v1
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: gateway-config
        resources:
          limits:
            cpu: "100m"
            memory: "128Mi"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-dep
  namespace: polyglot-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-svc
  template:
    metadata:
      labels:
        app: auth-svc
    spec:
      containers:
      - name: auth-svc
        image: polyglot/auth-svc:v1
        imagePullPolicy: Never
        ports:
        - containerPort: 8080
        envFrom:
        - secretRef:
            name: auth-secrets
        resources:
          limits:
            cpu: "100m"
            memory: "64Mi"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-dep
  namespace: polyglot-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: analytics-svc
  template:
    metadata:
      labels:
        app: analytics-svc
    spec:
      containers:
      - name: analytics-svc
        image: polyglot/analytics-svc:v1
        imagePullPolicy: Never
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "50m"
            memory: "64Mi"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: processor-dep
  namespace: polyglot-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: processor-svc
  template:
    metadata:
      labels:
        app: processor-svc
    spec:
      containers:
      - name: processor-svc
        image: polyglot/processor-svc:v1
        imagePullPolicy: Never
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "100m"
            memory: "64Mi"

```

### `k8s/03-services.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
  namespace: polyglot-app
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-svc
  namespace: polyglot-app
spec:
  type: ClusterIP
  selector:
    app: api-gateway
  ports:
  - port: 3000
    targetPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: auth-svc
  namespace: polyglot-app
spec:
  type: ClusterIP
  selector:
    app: auth-svc
  ports:
  - port: 8080
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: analytics-svc
  namespace: polyglot-app
spec:
  type: ClusterIP
  selector:
    app: analytics-svc
  ports:
  - port: 8080
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: processor-svc
  namespace: polyglot-app
spec:
  type: ClusterIP
  selector:
    app: processor-svc
  ports:
  - port: 8080
    targetPort: 8080

```

### `k8s/04-ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: polyglot-ingress
  namespace: polyglot-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-svc
            port:
              number: 80
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: api-gateway-svc
            port:
              number: 3000

```

---

## 5. SCRIPTS DE AUTOMATIZACIÓN

### `scripts/build-and-load.sh`

```bash
#!/usr/bin/env bash
set -e

echo "🔨 Construyendo imágenes Docker..."
docker build -t polyglot/frontend:v1 ./microservices/01-frontend
docker build -t polyglot/api-gateway:v1 ./microservices/02-api-gateway
docker build -t polyglot/auth-svc:v1 ./microservices/03-auth-service
docker build -t polyglot/analytics-svc:v1 ./microservices/04-analytics-service
docker build -t polyglot/processor-svc:v1 ./microservices/05-data-processor

# Si estás usando Minikube
if command -v minikube &> /dev/null && minikube status | grep -q "Running"; then
    echo "📦 Cargando imágenes a Minikube..."
    minikube image load polyglot/frontend:v1
    minikube image load polyglot/api-gateway:v1
    minikube image load polyglot/auth-svc:v1
    minikube image load polyglot/analytics-svc:v1
    minikube image load polyglot/processor-svc:v1
fi

# Si estás usando Kind
if command -v kind &> /dev/null; then
    echo "📦 Cargando imágenes a Kind..."
    kind load docker-image polyglot/frontend:v1
    kind load docker-image polyglot/api-gateway:v1
    kind load docker-image polyglot/auth-svc:v1
    kind load docker-image polyglot/analytics-svc:v1
    kind load docker-image polyglot/processor-svc:v1
fi

echo "🚀 Desplegando en Kubernetes..."
kubectl apply -f k8s/

echo "✅ Despliegue finalizado. Verifica con: kubectl get pods -n polyglot-app"

```

---

## 6. INSTRUCCIONES PARA EL AGENTE DE AI

1. Genera cada archivo tal como está especificado en los bloques de código.
2. Asegúrate de dar permisos de ejecución al script: `chmod +x scripts/build-and-load.sh`.
3. Crea un archivo `README.md` explicativo que incluya:
* Comandos para iniciar Minikube/Kind habilitando Ingress (`minikube addons enable ingress`).
* Comando para ejecutar `./scripts/build-and-load.sh`.
* Comandos de verificación (`kubectl get pods -n polyglot-app`, `kubectl get ingress -n polyglot-app`).
