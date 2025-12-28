# Todo App - StatefulSet Lab

A simple Node.js Todo application with PostgreSQL StatefulSet for Kubernetes hands-on practice.

## Features
- ✅ Add, delete, and toggle todos
- 🗄️ PostgreSQL StatefulSet with persistent storage
- 🚀 Simple deployment with 2 app replicas
- 📦 Clean, minimal code

## Prerequisites
- Kubernetes cluster with storage class `ebs-sc`
- Docker
- kubectl configured

## Quick Start

### 1. Build Docker Image
```bash
cd todo-app
docker build -t <your-dockerhub-username>/todo-app:1.0 .
docker push <your-dockerhub-username>/todo-app:1.0
```

### 2. Update kubernetes.yaml
Replace `<your-dockerhub-username>` with your Docker Hub username in `kubernetes.yaml`

### 3. Deploy to Kubernetes
```bash
kubectl apply -f kubernetes.yaml
```

### 4. Check Deployment
```bash
# Check all pods
kubectl get pods

# Check StatefulSet
kubectl get statefulset

# Check PVCs
kubectl get pvc

# Check services
kubectl get svc
```

### 5. Access Application
```bash
# Get node IP
kubectl get nodes -o wide

# Access app at: http://<node-ip>:30080
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   todo-app-1    │────▶│  postgres-svc   │
└─────────────────┘     └─────────────────┘
                               │
┌─────────────────┐            │
│   todo-app-2    │────────────┤
└─────────────────┘            │
                               ▼
                        ┌──────────────┐
                        │  postgres-0  │
                        │ (StatefulSet)│
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │     PVC      │
                        │  (1Gi EBS)   │
                        └──────────────┘
```

## StatefulSet Features Demonstrated

1. **Persistent Storage**: Data survives pod restarts
2. **Stable Network Identity**: postgres-0.postgres-headless
3. **Ordered Deployment**: Pods created sequentially
4. **Volume Claim Templates**: Automatic PVC creation

## Testing StatefulSet

### Test 1: Data Persistence
```bash
# Add some todos via web UI
# Delete the postgres pod
kubectl delete pod postgres-0

# Wait for pod to restart
kubectl get pods -w

# Check web UI - data should still be there!
```

### Test 2: Scaling (Optional)
```bash
# Scale to 2 replicas (for read replicas)
kubectl scale statefulset postgres --replicas=2

# Check pods
kubectl get pods
```

### Test 3: Check PVC
```bash
# View PVC details
kubectl get pvc

# Describe PVC
kubectl describe pvc postgres-data-postgres-0
```

## Cleanup
```bash
kubectl delete -f kubernetes.yaml
kubectl delete pvc --all
```

## Troubleshooting

### Check Postgres Logs
```bash
kubectl logs postgres-0
```

### Check App Logs
```bash
kubectl logs -l app=todo-app
```

### Connect to Postgres Pod
```bash
kubectl exec -it postgres-0 -- psql -U postgres -d tododb
# Then run: SELECT * FROM todos;
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | postgres-svc | PostgreSQL service name |
| DB_NAME | tododb | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | postgres123 | Database password |

## What You'll Learn

- ✅ How StatefulSets work
- ✅ Persistent Volume Claims (PVC)
- ✅ Headless Services
- ✅ ConfigMaps for initialization
- ✅ Multi-tier application deployment
- ✅ Database connection from apps
