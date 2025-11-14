# 🎺 Open Fanfare

Application web moderne pour la gestion des présences des musiciens lors des concerts et événements.

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [API](#-api)
- [Développement](#-développement)

## 🎯 À propos

**Open Fanfare** est une application web complète permettant de :
- Gérer les musiciens, leurs instruments et leurs informations de contact
- Créer et organiser des événements/concerts
- Enregistrer les présences des musiciens via une interface publique
- Visualiser les statistiques de participation par instrument
- Importer des musiciens en masse via CSV

L'application se compose de deux parties :
- **Interface publique** : Consultation des événements et enregistrement des présences
- **Interface d'administration** : Gestion complète des données (musiciens, instruments, événements)

## ✨ Fonctionnalités

### Interface publique
- 📅 **Vue Présences** : Affichage de la liste des événements à venir avec enregistrement des présences
- 📆 **Vue Agenda** : Calendrier mensuel des concerts avec statistiques de participation
- ✅ Enregistrement de présence via un pop-up modal (Présent/Absent/Peut-être)
- 📊 **Graphiques doubles** : Visualisation par pupitre ET par instrument (camemberts côte à côte)
- � Affichage des commentaires des musiciens sous les graphiques
- 👥 Liste des musiciens ayant répondu (masquage des "en attente")
- 📥 **Export iCal** : Téléchargement des concerts au format .ics pour intégration dans Google Calendar, Outlook, etc.
- 🎨 Interface moderne et responsive

### Interface d'administration
- � **Connexion sécurisée** : Authentification avec mot de passe
- 🎵 **Gestion des pupitres** : CRUD complet (Bois, Cuivres aigus, Cuivres graves, Basses, Percu, etc.)
- 🎷 **Gestion des instruments** : CRUD complet avec assignation à un pupitre et couleurs personnalisées
- 👤 **Gestion des musiciens** : CRUD complet (nom, prénom, instrument, email, téléphone, couleur)
- 🎪 **Gestion des événements** : CRUD complet avec date, lieu, organisateur, tarif, description
- 📥 **Import CSV** : Import en masse de musiciens depuis un fichier CSV
- 🔄 **Assignation automatique** : Tous les musiciens sont automatiquement assignés lors de la création d'un événement
- 👁️ **Listes masquables** : Instruments et musiciens masqués par défaut pour une interface épurée
- 📅 **Export iCal** : Bouton d'export également disponible dans l'interface admin

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 20.5.0 ou supérieure)
- **npm** (généralement inclus avec Node.js)
- **Git** (pour cloner le dépôt)

### Vérification de l'installation

```bash
node --version  # Doit afficher v20.5.0 ou supérieur
npm --version   # Doit afficher 10.x.x ou supérieur
```

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd open_fanfare
```

### 2. Installation du backend

```bash
cd backend
npm install
```

### 3. Installation du frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Configuration du backend

1. Créez un fichier `.env` dans le dossier `backend/` :

```bash
cd backend
cp .env.example .env  # Si un fichier exemple existe
# Sinon, créez le fichier .env manuellement
```

2. Configurez les variables d'environnement dans `backend/.env` :

```env
DATABASE_URL="file:./prisma/dev.db"
ADMIN_SECRET="cornichon"
PORT=4000
CORS_ORIGIN=http://localhost:5174
```

**Variables d'environnement :**
- `DATABASE_URL` : Chemin vers la base de données SQLite (par défaut : `file:./prisma/dev.db`)
- `ADMIN_SECRET` : Mot de passe pour l'authentification admin (par défaut : "cornichon" - changez-le en production !)
- `PORT` : Port du serveur backend (par défaut : 4000)
- `CORS_ORIGIN` : Origine autorisée pour les requêtes CORS (ajuster selon le port du frontend)

### Initialisation de la base de données

```bash
cd backend
npm run prisma:migrate
```

Cette commande va :
- Créer la base de données SQLite
- Appliquer toutes les migrations
- Générer le client Prisma
- Exécuter le script de seed (données de test)

## 🎬 Lancement

### Développement

#### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Le serveur backend sera accessible sur `http://localhost:4000`

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

L'application frontend sera accessible sur `http://localhost:5173`

### Production

#### Build du backend

```bash
cd backend
npm run build
npm start
```

#### Build du frontend

```bash
cd frontend
npm run build
npm run preview
```

Les fichiers de production seront générés dans `frontend/dist/`

## 📁 Structure du projet

```
open_fanfare/
├── backend/                 # Application backend (Node.js/Express)
│   ├── prisma/             # Schéma et migrations Prisma
│   │   ├── schema.prisma   # Schéma de la base de données
│   │   ├── migrations/     # Migrations de la base de données
│   │   └── seed.ts        # Script de seed
│   ├── src/
│   │   ├── routes/        # Routes API
│   │   ├── middleware/     # Middlewares Express
│   │   ├── app.ts         # Configuration Express
│   │   └── server.ts      # Point d'entrée du serveur
│   ├── .env               # Variables d'environnement
│   └── package.json
│
├── frontend/               # Application frontend (React/Vite)
│   ├── src/
│   │   ├── api/          # Client API et hooks React Query
│   │   ├── components/   # Composants réutilisables
│   │   ├── pages/        # Pages de l'application
│   │   └── App.tsx       # Composant racine
│   └── package.json
│
└── README.md              # Ce fichier
```

## 🛠️ Technologies utilisées

### Backend
- **Node.js** : Runtime JavaScript
- **Express** : Framework web
- **TypeScript** : Langage de programmation
- **Prisma** : ORM pour la base de données
- **SQLite** : Base de données (peut être remplacée par PostgreSQL/MySQL)
- **Zod** : Validation de schémas
- **ts-node-dev** : Développement avec rechargement automatique

### Frontend
- **React** : Bibliothèque UI
- **TypeScript** : Langage de programmation
- **Vite** : Build tool et serveur de développement
- **React Router** : Routage
- **React Query** : Gestion des données et cache
- **Recharts** : Graphiques et visualisations
- **date-fns** : Manipulation de dates

## 🔌 API

### Endpoints publics

- `GET /api/events` - Liste de tous les événements
- `GET /api/events/:id` - Détails d'un événement
- `POST /api/events/:id/presences` - Enregistrer une présence

### Endpoints admin (nécessitent l'en-tête `x-admin-secret`)

#### Pupitres/Sections
- `GET /api/sections` - Liste des pupitres
- `POST /api/sections` - Créer un pupitre
- `PUT /api/sections/:id` - Modifier un pupitre
- `DELETE /api/sections/:id` - Supprimer un pupitre

#### Instruments
- `GET /api/instruments` - Liste des instruments (avec relation section)
- `POST /api/instruments` - Créer un instrument
- `PUT /api/instruments/:id` - Modifier un instrument
- `DELETE /api/instruments/:id` - Supprimer un instrument

#### Musiciens
- `GET /api/musicians` - Liste des musiciens
- `POST /api/musicians` - Créer un musicien
- `PUT /api/musicians/:id` - Modifier un musicien
- `DELETE /api/musicians/:id` - Supprimer un musicien
- `POST /api/musicians/import` - Importer des musiciens (CSV)

#### Événements
- `POST /api/events` - Créer un événement
- `PUT /api/events/:id` - Modifier un événement
- `DELETE /api/events/:id` - Supprimer un événement

### Exemple de requête admin

```bash
curl -X POST http://localhost:4000/api/musicians \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: votre-secret-admin" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "instrumentId": 1,
    "email": "jean.dupont@example.com",
    "phone": "+33601020304"
  }'
```

## 💻 Développement

### Commandes utiles

#### Backend

```bash
# Développement avec rechargement automatique
npm run dev

# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate

# Ouvrir Prisma Studio (interface graphique pour la BDD)
npm run prisma:studio

# Build pour la production
npm run build

# Lancer en production
npm start
```

#### Frontend

```bash
# Développement avec HMR
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview

# Linter
npm run lint
```

### Import CSV des musiciens

Le format CSV attendu est le suivant :

```csv
Nom;Prénom;Instrument;Email;Téléphone
Dupont;Jean;Trompette;jean.dupont@example.com;+33601020304
Martin;Marie;Saxophone;marie.martin@example.com;+33605060708
```

**Note :** Les instruments non existants seront automatiquement créés avec une couleur aléatoire.

### Base de données

La base de données SQLite est stockée dans `backend/prisma/dev.db`.

Pour utiliser PostgreSQL ou MySQL en production :

1. Modifiez `DATABASE_URL` dans `.env` :
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fanfare"
   ```

2. Modifiez le provider dans `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"  # ou "mysql"
     url      = env("DATABASE_URL")
   }
   ```

3. Réappliquez les migrations :
   ```bash
   npm run prisma:migrate
   ```

## � Déploiement en production

### Prérequis serveur

- Serveur Linux (Ubuntu/Debian recommandé)
- Node.js 20+ installé
- Nginx installé
- Certificat SSL (Let's Encrypt recommandé)
- Nom de domaine configuré (ex: concert.ligugesocial.club)
- Accès SSH au serveur

### Étape 1 : Préparation du serveur

#### 1.1 Connexion au serveur

```bash
ssh user@concert.ligugesocial.club
```

#### 1.2 Installation de Node.js (si nécessaire)

```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

#### 1.3 Installation de Nginx (si nécessaire)

```bash
sudo apt update
sudo apt install nginx -y
```

#### 1.4 Installation de PM2 (gestionnaire de processus)

```bash
sudo npm install -g pm2
```

### Étape 2 : Déploiement du backend

#### 2.1 Créer le dossier de l'application

```bash
sudo mkdir -p /var/www/open_fanfare
sudo chown -R $USER:$USER /var/www/open_fanfare
cd /var/www/open_fanfare
```

#### 2.2 Cloner le dépôt

```bash
git clone https://github.com/julienrat/open_fanfare.git .
```

#### 2.3 Installer les dépendances du backend

```bash
cd backend
npm install --production
```

#### 2.4 Configurer les variables d'environnement

```bash
nano .env
```

Contenu du fichier `.env` :

```env
NODE_ENV=production
DATABASE_URL="file:./prisma/prod.db"
ADMIN_SECRET="CHANGEZ_MOI_PAR_UN_SECRET_FORT"
PORT=4000
CORS_ORIGIN=https://concert.ligugesocial.club
```

**⚠️ Important** : Changez `ADMIN_SECRET` par un mot de passe fort et sécurisé !

#### 2.5 Initialiser la base de données

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

#### 2.6 Builder le backend (TypeScript → JavaScript)

```bash
npm run build
```

#### 2.7 Démarrer le backend avec PM2

```bash
pm2 start dist/server.js --name "open-fanfare-backend"
pm2 save
pm2 startup
```

Copiez et exécutez la commande fournie par `pm2 startup` pour que PM2 démarre automatiquement au démarrage du serveur.

#### 2.8 Vérifier que le backend fonctionne

```bash
curl http://localhost:4000/health
# Devrait retourner: {"status":"ok"}
```

### Étape 3 : Déploiement du frontend

#### 3.1 Configurer les variables d'environnement du frontend

```bash
cd /var/www/open_fanfare/frontend
nano .env.production
```

Contenu du fichier `.env.production` :

```env
VITE_API_URL=https://concert.ligugesocial.club/api
```

#### 3.2 Installer les dépendances

```bash
npm install
```

#### 3.3 Builder le frontend

```bash
npm run build
```

Cela va créer un dossier `dist/` avec les fichiers statiques optimisés.

### Étape 4 : Configuration de Nginx

#### 4.1 Créer la configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/open-fanfare
```

Contenu du fichier :

```nginx
# Redirection HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name concert.ligugesocial.club;
    
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name concert.ligugesocial.club;

    # Certificats SSL (à adapter selon votre configuration)
    ssl_certificate /etc/letsencrypt/live/concert.ligugesocial.club/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/concert.ligugesocial.club/privkey.pem;
    
    # Configuration SSL recommandée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/open-fanfare-access.log;
    error_log /var/log/nginx/open-fanfare-error.log;

    # Frontend - Servir les fichiers statiques
    root /var/www/open_fanfare/frontend/dist;
    index index.html;

    # Gestion du routing React (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Proxy vers Node.js
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4.2 Activer la configuration

```bash
sudo ln -s /etc/nginx/sites-available/open-fanfare /etc/nginx/sites-enabled/
```

#### 4.3 Tester la configuration Nginx

```bash
sudo nginx -t
```

Si tout est OK, vous devriez voir : `syntax is ok` et `test is successful`.

#### 4.4 Redémarrer Nginx

```bash
sudo systemctl restart nginx
```

### Étape 5 : Configuration SSL avec Let's Encrypt (si nécessaire)

Si vous n'avez pas encore de certificat SSL :

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir un certificat SSL
sudo certbot --nginx -d concert.ligugesocial.club

# Renouvellement automatique (tester)
sudo certbot renew --dry-run
```

### Étape 6 : Configuration du pare-feu

```bash
# Autoriser HTTP et HTTPS
sudo ufw allow 'Nginx Full'

# Si vous utilisez SSH
sudo ufw allow OpenSSH

# Activer le pare-feu
sudo ufw enable
```

### Étape 7 : Vérification finale

#### 7.1 Vérifier que le backend tourne

```bash
pm2 status
pm2 logs open-fanfare-backend --lines 50
```

#### 7.2 Tester l'application

Ouvrez votre navigateur et accédez à :
- `https://concert.ligugesocial.club` - Interface publique
- `https://concert.ligugesocial.club/admin` - Interface admin

### Mises à jour de l'application

Pour mettre à jour l'application après des modifications :

```bash
cd /var/www/open_fanfare

# Récupérer les dernières modifications
git pull origin main

# Backend
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart open-fanfare-backend

# Frontend
cd ../frontend
npm install
npm run build

# Pas besoin de redémarrer Nginx (fichiers statiques)
```

### Commandes utiles en production

```bash
# Voir les logs du backend
pm2 logs open-fanfare-backend

# Redémarrer le backend
pm2 restart open-fanfare-backend

# Arrêter le backend
pm2 stop open-fanfare-backend

# Voir l'utilisation des ressources
pm2 monit

# Voir les logs Nginx
sudo tail -f /var/log/nginx/open-fanfare-error.log
sudo tail -f /var/log/nginx/open-fanfare-access.log

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Sauvegarde de la base de données

```bash
# Créer une sauvegarde
cd /var/www/open_fanfare/backend
cp prisma/prod.db prisma/backup-$(date +%Y%m%d-%H%M%S).db

# Automatiser les sauvegardes quotidiennes (cron)
crontab -e
```

Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin :

```cron
0 2 * * * cd /var/www/open_fanfare/backend && cp prisma/prod.db prisma/backup-$(date +\%Y\%m\%d).db && find prisma/backup-*.db -mtime +7 -delete
```

### Dépannage

#### Le backend ne démarre pas

```bash
pm2 logs open-fanfare-backend --err --lines 100
```

#### Erreur 502 Bad Gateway

- Vérifier que le backend tourne : `pm2 status`
- Vérifier les logs Nginx : `sudo tail -f /var/log/nginx/open-fanfare-error.log`
- Vérifier que le port 4000 est bien accessible : `curl http://localhost:4000/health`

#### Problèmes CORS

Vérifier que `CORS_ORIGIN` dans le `.env` du backend correspond bien à votre domaine :
```env
CORS_ORIGIN=https://concert.ligugesocial.club
```

#### L'interface admin ne fonctionne pas

Vérifier que vous avez bien changé le mot de passe dans le `.env` :
```env
ADMIN_SECRET="votre-nouveau-mot-de-passe"
```

## �📝 Notes

- L'interface publique ne nécessite **aucune authentification**
- L'interface d'administration utilise une authentification par mot de passe (stocké dans localStorage)
- Le backend vérifie le secret via l'en-tête HTTP `x-admin-secret`
- **Mot de passe par défaut** : "cornichon" (à changer en production !)
- La base de données SQLite est adaptée au développement, mais PostgreSQL/MySQL sont recommandés pour la production
- Les graphiques de statistiques affichent la répartition par **pupitre** et par **instrument**
- Les fichiers iCal générés sont compatibles avec Google Calendar, Outlook, Apple Calendar, etc.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

ISC

---

**Développé avec ❤️ pour les fanfares**

