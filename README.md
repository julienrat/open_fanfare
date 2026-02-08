# 🎺 Open Fanfare

Application web pour gérer les concerts, les présences, les musiciens et les instruments d’une fanfare.  
Interface simple, moderne et efficace avec agenda, statistiques et exports.

---

## ✨ Fonctionnalités

- ✅ Présences aux concerts (Présent / Absent / Peut-être)
- 📅 Agenda mensuel + popup détails
- 📊 Statistiques par instrument
- 🎷 Gestion des pupitres, instruments, musiciens
- 🎪 Gestion des concerts (markdown dans description & setlist)
- 📥 Import CSV (musiciens / instruments / concerts)
- 📤 Export CSV + JSON
- 📅 Export iCal

---

## 🧰 Pré-requis

- **Node.js 18+** (avec npm)
- **Nginx** (recommandé en production)
- **SQLite** (fichier local, rien à installer côté serveur)

---

## 🚀 Installation rapide

```bash
git clone <url-du-depot>
cd open_fanfare
npm install
```

---

## ⚙️ Configuration (.env)

Créer un fichier `.env` à la racine :

```env
PORT=8000
BASE_URL="/sondages"
DB_PATH="/var/www/open_fanfare/data.sqlite"
```

- `PORT` : port local Node (par défaut 8000)
- `BASE_URL` : sous-dossier si déployé dans `/sondages` (vide si racine)
- `DB_PATH` : chemin vers la base SQLite

---

## 📥 Import des données (JSON export)

```bash
node scripts/import_json.js /chemin/vers/openfanfare-export.json
```

---

## ▶️ Lancer en local

```bash
npm start
```
Puis :
```
http://localhost:8000
```

---

## 🌍 Installation serveur (Nginx + Node)

### 1) Lancer Node (avec un process manager recommandé)

Exemple PM2 :

```bash
npm install -g pm2
pm2 start server.js --name openfanfare
pm2 save
```

### 2) Config Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name ton-domaine.fr;

    root /var/www/open_fanfare;

    location /sondages/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /sondages;
    }
}
```

Si ton site est à la racine (`/`), supprime `/sondages` partout :

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Puis :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

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
