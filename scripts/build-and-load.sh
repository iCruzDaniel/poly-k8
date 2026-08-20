#!/usr/bin/env bash
set -e

echo "🔨 Construyendo imágenes Docker..."
docker build -t poly-k8/frontend:v1 ./microservices/01-frontend
docker build -t poly-k8/api-gateway:v1 ./microservices/02-api-gateway
docker build -t poly-k8/auth-svc:v1 ./microservices/03-auth-service
docker build -t poly-k8/analytics-svc:v1 ./microservices/04-analytics-service
docker build -t poly-k8/processor-svc:v1 ./microservices/05-data-processor

# Si estás usando Minikube
if command -v minikube &> /dev/null && minikube status | grep -q "Running"; then
    echo "📦 Cargando imágenes a Minikube..."
    minikube image load poly-k8/frontend:v1
    minikube image load poly-k8/api-gateway:v1
    minikube image load poly-k8/auth-svc:v1
    minikube image load poly-k8/analytics-svc:v1
    minikube image load poly-k8/processor-svc:v1
fi

# Si estás usando Kind
if command -v kind &> /dev/null; then
    echo "📦 Cargando imágenes a Kind..."
    kind load docker-image poly-k8/frontend:v1
    kind load docker-image poly-k8/api-gateway:v1
    kind load docker-image poly-k8/auth-svc:v1
    kind load docker-image poly-k8/analytics-svc:v1
    kind load docker-image poly-k8/processor-svc:v1
fi

echo "🚀 Desplegando en Kubernetes..."
kubectl apply -f k8s/

echo "✅ Despliegue finalizado. Verifica con: kubectl get pods -n poly-k8"
