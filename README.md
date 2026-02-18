# Droit Guinéen

Plateforme juridique open source pour la consultation, la recherche et la gestion des textes de loi de la République de Guinée.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, TanStack React Query |
| **Backend** | Express.js, TypeScript, Prisma ORM, Zod |
| **Base de données** | PostgreSQL 16 |
| **Recherche** | Meilisearch |
| **Authentification** | JWT (jsonwebtoken + bcrypt) |
| **OCR** | Google Cloud Vision + Tesseract.js (pipeline hybride) |
| **Export** | PDF, DOCX, JSON, HTML |
| **Documentation API** | Swagger / OpenAPI 3.0 |

## Fonctionnalités

- **Consultation publique** des textes juridiques (lois, décrets, ordonnances, arrêtés, codes, etc.)
- **Recherche full-text** avec filtres par nature, état et pagination
- **Relations entre textes** (abrogation, modification, citation, codification...)
- **Graphe de relations** pour visualiser les liens entre textes
- **Upload de PDF** avec extraction automatique du contenu par OCR
- **Export multi-format** (PDF, DOCX, JSON, HTML)
- **Authentification JWT** avec rôles (ADMIN, EDITOR, USER)
- **Administration protégée** pour la gestion des documents
- **API REST documentée** avec Swagger UI

## Structure du projet

```
.
├── backend/            # API Express.js + TypeScript
│   ├── prisma/         # Schéma Prisma (PostgreSQL)
│   ├── src/
│   │   ├── config/     # Configuration, Swagger
│   │   ├── controllers/
│   │   ├── lib/        # OCR, Meilisearch, export, Prisma
│   │   ├── middlewares/ # Auth JWT, rate limiting, validation
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── scripts/    # Seed admin, utilitaires
│   │   ├── services/
│   │   └── validators/ # Schémas Zod
│   └── tests/
├── frontend/           # Next.js 16 (App Router)
│   ├── app/
│   │   ├── admin/      # Page d'administration (protégée)
│   │   ├── login/      # Page de connexion
│   │   ├── lois/       # Consultation des textes
│   │   └── recherche/  # Recherche full-text
│   ├── components/ui/  # Composants réutilisables
│   └── lib/            # API client, auth, hooks, providers
├── ocr/                # Service OCR Python (optionnel)
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Démarrage rapide

### Prérequis

- Node.js 18+
- PostgreSQL 16
- Meilisearch (optionnel, pour la recherche)

### Installation

```bash
# Backend
cd backend
cp .env.example .env        # Configurer les variables d'environnement
npm install
npx prisma db push          # Créer les tables
npx tsx src/scripts/seed-admin.ts  # Créer l'admin par défaut

# Frontend
cd frontend
npm install
```

### Variables d'environnement

**Backend** (`backend/.env`) :

```env
DATABASE_URL=postgres://user:password@localhost:5432/droitguineen
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
SEARCH_URL=http://localhost:7700
MEILI_MASTER_KEY=your-master-key
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLOUD_VISION_ENABLED=false
```

**Frontend** (`frontend/.env.local`) :

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Lancement en développement

```bash
# Terminal 1 - Backend
cd backend && npm run dev    # http://localhost:4000

# Terminal 2 - Frontend
cd frontend && npm run dev   # http://localhost:3001
```

### Lancement avec Docker

```bash
# Copier et configurer les variables
cp .env.docker.example .env

# Lancer tous les services
docker-compose up -d

# Avec le service OCR (optionnel)
docker-compose --profile ocr up -d
```

## API

La documentation Swagger est accessible sur `http://localhost:4000/docs` une fois le backend lancé.

### Routes principales

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/auth/login` | POST | - | Connexion |
| `/auth/me` | GET | JWT | Profil utilisateur |
| `/lois` | GET | - | Liste des textes |
| `/lois/:id` | GET | - | Détail d'un texte |
| `/lois` | POST | ADMIN/EDITOR | Créer un texte |
| `/recherche` | GET | - | Recherche full-text |
| `/upload/pdf` | POST | ADMIN/EDITOR | Upload PDF + OCR |
| `/relations/:texteId` | GET | - | Relations d'un texte |
| `/export/:format/:id` | GET | - | Export (pdf, docx, json, html) |

### Rôles

- **ADMIN** : Accès complet (CRUD textes, gestion utilisateurs)
- **EDITOR** : Création et modification de textes
- **USER** : Lecture seule (routes publiques)

### Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Auth | 10 req / 15 min |
| Général | 100 req / 15 min |
| Recherche | 30 req / min |
| Upload | 20 req / h |
| Export | 50 req / h |

## Modèle de données

Les principaux modèles Prisma :

- **Texte** : Texte juridique (loi, décret, ordonnance...) avec métadonnées complètes
- **Article** : Article individuel avec contenu et état
- **Section** : Sections hiérarchiques (titres, chapitres)
- **TexteRelation** : Relations entre textes (abroge, modifie, cite...)
- **User** : Utilisateurs avec rôles
- **VersionTexte** : Historique des versions

## Compte administrateur par défaut

```
Email    : admin@leguinee.gn
Password : Admin123!
```

> Changez le mot de passe en production.

## Scripts utiles

```bash
# Backend
npm run dev              # Développement avec hot-reload
npm run build            # Compilation TypeScript
npm run test             # Tests unitaires et intégration
npx tsx src/scripts/seed-admin.ts  # Créer l'admin

# Frontend
npm run dev              # Développement (port 3001)
npm run build            # Build de production
```

## Licence

MIT
