# 1. Se connecter à votre cluster AKS
az aks get-credentials --resource-group rg-shopfer-aks --name aks-shopfer

# 2. Modifier l'image dans deployment.yaml avec votre nom d'utilisateur Docker Hub
# Remplacez "votre-username" par votre vrai nom d'utilisateur

# 3. Appliquer les fichiers de déploiement
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f configmap.yaml

# 4. Vérifier le statut du déploiement
kubectl rollout status deployment/shopfer-app

# 5. Obtenir l'IP externe
kubectl get service shopfer-service

# 6. Surveiller les pods
kubectl get pods -l app=shopfer

# 7. Voir les logs
kubectl logs -f deployment/shopfer-app
