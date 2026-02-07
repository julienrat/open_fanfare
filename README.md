# 🎺 Open Fanfare

Application web pour piloter la vie d’une fanfare : concerts, présences, musiciens, instruments et statistiques.  
Pensée pour être simple, rapide et agréable à utiliser, l’interface combine planning, réponses en un clic et visualisations claires.

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation serveur](#-installation-serveur-php--postgresql)
- [Configuration](#-configuration)
- [Initialiser la base (manuel)](#-initialiser-la-base-manuel)
- [Migration SQLite → PostgreSQL](#-migration-sqlite--postgresql)
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

L’application est un **monolithe PHP** avec **PostgreSQL**, conçu pour une installation simple sur un serveur classique (Nginx/Apache + PHP-FPM).

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

- **PHP 8.1+** avec `pdo_pgsql` (et `intl` recommandé)
- **PostgreSQL 14+**
- **Nginx + PHP-FPM** (production)
- **SQLite + pdo_sqlite** (optionnel, migration)

## 🚀 Installation

```bash
git clone <url-du-depot>
cd open_fanfare
```

## 🧰 Installation serveur (PHP + PostgreSQL)

### 1) Installer les dépendances

Exemple Ubuntu/Debian :

```bash
sudo apt update
sudo apt install -y nginx php-fpm php-pgsql php-intl postgresql
```

### 2) Configurer l’application

Créez un fichier `.env` à la racine du projet :

```env
APP_PASSWORD="mot-de-passe-app"
ADMIN_SECRET="mot-de-passe-admin"

DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="openfanfare"
DB_USER="openfanfare"
DB_PASS="changeme"
DB_SSLMODE="prefer"
```

### 3) Initialiser la base de données

Utilisez le script fourni (gère les droits et les séquences) :

```bash
sudo -u postgres bash scripts/deploy_db.sh
```

### 4) Configurer le serveur web

Exemple Nginx (racine sur `public/`) :

```nginx
server {
  listen 80;
  server_name ton-domaine.fr;

  root /var/www/open_fanfare/public;
  index index.php;

  location / {
    try_files $uri /index.php?$query_string;
  }

  location ~ \\.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.1-fpm.sock;
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
APP_PASSWORD="mot-de-passe-app"
ADMIN_SECRET="mot-de-passe-admin"

DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="openfanfare"
DB_USER="openfanfare"
DB_PASS="changeme"
DB_SSLMODE="prefer"
```

## 🗄️ Initialiser la base (manuel)

```bash
psql -d openfanfare -f database/schema.sql
psql -d openfanfare -f database/seed.sql
```

## 🔁 Migration SQLite → PostgreSQL

```bash
export SQLITE_PATH=/chemin/vers/dev.db
php scripts/migrate_sqlite_to_postgres.php
```

## 🎬 Lancement

Configurez Nginx pour servir `public/` et router toutes les requêtes vers `public/index.php` :

```nginx
location / {
  try_files $uri /index.php?$query_string;
}
```

## 📁 Structure du projet

```
open_fanfare/
├── app/                 # Logique serveur (config, auth, vues)
├── database/            # Schéma SQL + seed Postgres
├── public/              # Front controller + assets
├── scripts/             # Utilitaires (migration SQLite → Postgres)
└── README.md
```

---

🤝 Ce projet a été réalisé en partenariat avec une IA.
