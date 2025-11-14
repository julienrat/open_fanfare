#!/bin/bash

# Script de déploiement pour Open Fanfare
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Début du déploiement..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Répertoire de l'application
APP_DIR="/var/www/open_fanfare"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Erreur: Le répertoire $APP_DIR n'existe pas${NC}"
    exit 1
fi

cd "$APP_DIR"

echo -e "${BLUE}📥 Récupération des dernières modifications...${NC}"
git pull origin main

echo -e "${BLUE}🔧 Mise à jour du backend...${NC}"
cd backend

# Installer les dépendances
npm install --production

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Build
npm run build

# Redémarrer avec PM2
pm2 restart open-fanfare-backend

echo -e "${GREEN}✅ Backend mis à jour et redémarré${NC}"

echo -e "${BLUE}🎨 Mise à jour du frontend...${NC}"
cd ../frontend

# Installer les dépendances
npm install

# Build
npm run build

echo -e "${GREEN}✅ Frontend mis à jour${NC}"

echo -e "${GREEN}🎉 Déploiement terminé avec succès !${NC}"
echo -e "${BLUE}📊 Statut des services:${NC}"
pm2 status

echo -e "${BLUE}📝 Pour voir les logs du backend:${NC}"
echo -e "   pm2 logs open-fanfare-backend"
