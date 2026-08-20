<p align="center">
  <img src=".github/img/poly-k8-banner.jpg" alt="poly-k8 Banner" width="100%">
</p>

<h1 align="center">poly-k8</h1>

<p align="center">
  <strong>Polyglot Microservices Mesh on Kubernetes</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/kubernetes-%3E%3D1.25-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes">
  <img src="https://img.shields.io/badge/docker-%3E%3D20.10-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/node.js-18-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/typescript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/nginx-alpine-009639?style=flat-square&logo=nginx&logoColor=white" alt="Nginx">
  <img src="https://img.shields.io/badge/fastapi-0.104-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/flask-3.0-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/express-4.18-000000?style=flat-square&logo=express&logoColor=white" alt="Express">
</p>

<p align="center">
  <img src=".github/img/poly-k8.jpg" alt="poly-k8 Logo" width="150">
</p>

---

Arquitectura de microservicios políglotas (Python, Node.js/TypeScript, Nginx) que interactúan entre sí en un clúster de Kubernetes.

## Arquitectura

```
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

## Microservicios

| Servicio | Tecnología | Puerto | Descripción |
|----------|------------|--------|-------------|
| `01-frontend` | Nginx Alpine | 80 | Interfaz web estática |
| `02-api-gateway` | TypeScript/Express | 3000 | Gateway central de API |
| `03-auth-service` | Python/FastAPI | 8080 | Servicio de autenticación |
| `04-analytics-service` | Node.js/Express | 8080 | Métricas y analytics |
| `05-data-processor` | Python/Flask | 8080 | Procesamiento de datos |

## Requisitos Previos

- Docker instalado y ejecutándose
- Kubernetes local (Minikube o Kind)
- kubectl configurado

## Inicio Rápido

### 1. Iniciar Minikube/Kind con Ingress habilitado

**Para Minikube:**
```bash
minikube start
minikube addons enable ingress
```

**Para Kind:**
```bash
kind create cluster --config kind-config.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

### 2. Construir y desplegar

```bash
chmod +x scripts/build-and-load.sh
./scripts/build-and-load.sh
```

### 3. Verificar el despliegue

```bash
# Ver pods
kubectl get pods -n poly-k8

# Ver servicios
kubectl get svc -n poly-k8

# Ver ingress
kubectl get ingress -n poly-k8
```

### 4. Acceder a la aplicación

```bash
# Obtener la URL del Ingress
minikube service list -n poly-k8

# O usar port-forward para pruebas
kubectl port-forward -n poly-k8 svc/frontend-svc 8080:80
kubectl port-forward -n poly-k8 svc/api-gateway-svc 3000:3000
```

## Endpoints Disponibles

- `GET /` → Frontend (dashboard web)
- `GET /api/health` → Health check del API Gateway
- `GET /api/auth/validate` → Validación de autenticación
- `GET /api/analytics` → Métricas del clúster
- `POST /api/process` → Procesamiento de datos

## Estructura del Proyecto

```
poly-k8/
├── microservices/
│   ├── 01-frontend/
│   ├── 02-api-gateway/
│   ├── 03-auth-service/
│   ├── 04-analytics-service/
│   └── 05-data-processor/
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

## Limpieza

```bash
kubectl delete namespace poly-k8
docker rmi poly-k8/frontend:v1 poly-k8/api-gateway:v1 poly-k8/auth-svc:v1 poly-k8/analytics-svc:v1 poly-k8/processor-svc:v1
```

---

<p align="center">
  <img src="https://img.shields.io/badge/01--frontend-nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Frontend">
  <img src="https://img.shields.io/badge/02--api--gateway-typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="API Gateway">
  <img src="https://img.shields.io/badge/03--auth--service-fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="Auth Service">
  <img src="https://img.shields.io/badge/04--analytics--service-node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Analytics Service">
  <img src="https://img.shields.io/badge/05--data--processor-flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Data Processor">
</p>

<p align="center">
  Built with ❤️ for Kubernetes
</p>
