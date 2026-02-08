# 🎺 Open Fanfare

Application web pour piloter la vie d’une fanfare : concerts, présences, musiciens, instruments et statistiques.  
Pensée pour être simple, rapide et agréable à utiliser, l’interface combine planning, réponses en un clic et visualisations claires.

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation serveur](#-installation-serveur-nodejs--sqlite)
- [Configuration](#-configuration)
- [Initialiser la base (manuel)](#-initialiser-la-base-manuel)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)

## 🎯 À propos

**Open Fanfare** centralise tout ce dont une fanfare a besoin pour organiser ses concerts :
- 🗓️ planifier les événements et garder un agenda à jour
- 🙋 recueillir les présences des musiciens en quelques secondes
- 🎺 suivre la répartition des instruments (camemberts + stats)
- 👥 gérer le fichier des musiciens (contacts, instruments, couleurs)
- 🎼 documenter les concerts (description, setlist en Markdown)
- 📥 importer/exporter les données (CSV / JSON)

L’application est désormais un **monolithe Node.js** avec **SQLite**, conçu pour une installation simple sur un serveur classique (Nginx en reverse proxy).

## ✨ Fonctionnalités

### Interface publique
- 📅 **Vue Présences** : Liste des événements avec enregistrement des présences
- 📆 **Vue Agenda** : Calendrier mensuel des concerts + statistiques
- ✅ Enregistrement de présence via un pop-up modal (Présent/Absent/Peut-être)
- 📊 **Graphiques** : Visualisation par instrument
- 📥 **Export iCal**
- 🎨 Interface moderne et responsive

### Interface d'administration
- 🔐 **Connexion sécurisée** (serveur)
- 🎵 **Gestion des pupitres** : CRUD complet
- 🎷 **Gestion des instruments** : CRUD complet avec couleurs
- 👤 **Gestion des musiciens** : CRUD complet
- 🎪 **Gestion des événements** : CRUD complet
- 📥 **Import CSV** : musiciens, instruments, concerts
- 📤 **Export CSV** : musiciens, instruments, concerts
- 🔄 **Assignation automatique** : tous les musiciens assignés à la création d’un événement

## 📦 Prérequis

- **Node.js 18+** (npm inclus)
- **Nginx** (recommandé pour la prod)
- **SQLite** (fichier local, aucune installation serveur nécessaire)

## 🚀 Installation

```bash
git clone <url-du-depot>
cd open_fanfare
```

## 🧰 Installation serveur (Node.js + SQLite)

### 1) Installer les dépendances

Exemple Ubuntu/Debian :

```bash
sudo apt update
sudo apt install -y nginx nodejs npm
```

### 2) Configurer l’application

Créez un fichier `.env` à la racine du projet :

```env
PORT=8000
BASE_URL=""
DB_PATH="/var/www/open_fanfare/data.sqlite"
```

### 3) Installer les dépendances Node

```bash
npm install
```

### 4) Importer les données (optionnel)

```bash
node scripts/import_json.js /chemin/vers/openfanfare-export.json
```

### 5) Configurer le serveur web

Exemple Nginx (racine sur `public/`) :

```nginx
server {
  listen 80;
  server_name ton-domaine.fr;

  root /var/www/open_fanfare;

  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Redémarrez Nginx :

```bash
sudo systemctl restart nginx
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet :

```env
PORT=8000
BASE_URL=""
DB_PATH="./data.sqlite"
```

## 🎬 Lancement

En local :

```bash
npm start
```

En production, utilise un process manager (ex: systemd, PM2).

## 📁 Structure du projet

```
open_fanfare/
├── database/            # Schéma SQLite
├── public/              # Assets statiques
├── scripts/             # Import JSON
├── views/               # Templates EJS
├── server.js            # Serveur Express
├── db.js                # Connexion SQLite
└── README.md
```

---

🤝 Ce projet a été réalisé en partenariat avec une IA.
