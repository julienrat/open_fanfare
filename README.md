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

## 📝 Notes

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

