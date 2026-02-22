#!/usr/bin/env bash
# ==========================================
# Droitguineen - Deploiement Google Cloud Run
# ==========================================
# Usage: bash deploy.sh
#
# Prerequis:
#   - gcloud CLI installe et configure
#   - Docker installe
#   - Projet GCP "droitguineen" cree

set -euo pipefail

# ----------------------------------------
# Configuration
# ----------------------------------------
PROJECT_ID="droitguineen"
REGION="europe-west1"
REPO_NAME="droitguineen"

# Cloud SQL
SQL_INSTANCE_NAME="droitguineen-db"
SQL_TIER="db-f1-micro"
SQL_DB_NAME="droitguineen"
SQL_USER="droitguineen"

# Cloud Run services
BACKEND_SERVICE="droitguineen-backend"
FRONTEND_SERVICE="droitguineen-frontend"
MEILI_SERVICE="droitguineen-meili"

# Image paths
BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest"

# URLs (will be updated after deployment)
API_URL=""
FRONTEND_URL=""
MEILI_URL=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}========================================${NC}"; echo -e "${BLUE} $1${NC}"; echo -e "${BLUE}========================================${NC}"; }

# ----------------------------------------
# Prerequis
# ----------------------------------------
header "Verification des prerequis"

command -v gcloud >/dev/null 2>&1 || error "gcloud CLI non installe. Voir: https://cloud.google.com/sdk/docs/install"
command -v docker >/dev/null 2>&1 || error "Docker non installe."

log "Configuration du projet GCP: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

# Enable required APIs
log "Activation des APIs necessaires..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    --quiet

# ----------------------------------------
# Artifact Registry
# ----------------------------------------
header "Configuration d'Artifact Registry"

if gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" >/dev/null 2>&1; then
    log "Repository ${REPO_NAME} existe deja"
else
    log "Creation du repository Docker..."
    gcloud artifacts repositories create "${REPO_NAME}" \
        --repository-format=docker \
        --location="${REGION}" \
        --description="Images Docker Droitguineen"
fi

# Configure Docker auth
log "Configuration de l'authentification Docker..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ----------------------------------------
# Cloud SQL
# ----------------------------------------
header "Configuration de Cloud SQL"

if gcloud sql instances describe "${SQL_INSTANCE_NAME}" >/dev/null 2>&1; then
    log "Instance Cloud SQL ${SQL_INSTANCE_NAME} existe deja"
else
    log "Creation de l'instance Cloud SQL (PostgreSQL 16)..."
    warn "Cela peut prendre quelques minutes..."
    gcloud sql instances create "${SQL_INSTANCE_NAME}" \
        --database-version=POSTGRES_16 \
        --tier="${SQL_TIER}" \
        --region="${REGION}" \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --availability-type=zonal \
        --quiet
fi

# Generate password
SQL_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')
log "Mot de passe genere pour l'utilisateur ${SQL_USER}"

# Create user
if gcloud sql users list --instance="${SQL_INSTANCE_NAME}" --format="value(name)" | grep -q "^${SQL_USER}$"; then
    log "Utilisateur ${SQL_USER} existe deja, mise a jour du mot de passe..."
    gcloud sql users set-password "${SQL_USER}" \
        --instance="${SQL_INSTANCE_NAME}" \
        --password="${SQL_PASSWORD}" \
        --quiet
else
    log "Creation de l'utilisateur ${SQL_USER}..."
    gcloud sql users create "${SQL_USER}" \
        --instance="${SQL_INSTANCE_NAME}" \
        --password="${SQL_PASSWORD}" \
        --quiet
fi

# Create database
if gcloud sql databases list --instance="${SQL_INSTANCE_NAME}" --format="value(name)" | grep -q "^${SQL_DB_NAME}$"; then
    log "Base de donnees ${SQL_DB_NAME} existe deja"
else
    log "Creation de la base de donnees ${SQL_DB_NAME}..."
    gcloud sql databases create "${SQL_DB_NAME}" \
        --instance="${SQL_INSTANCE_NAME}" \
        --quiet
fi

# Build DATABASE_URL
CLOUD_SQL_CONNECTION="${PROJECT_ID}:${REGION}:${SQL_INSTANCE_NAME}"
DATABASE_URL="postgresql://${SQL_USER}:${SQL_PASSWORD}@localhost/${SQL_DB_NAME}?host=/cloudsql/${CLOUD_SQL_CONNECTION}"

# ----------------------------------------
# Secret Manager
# ----------------------------------------
header "Configuration de Secret Manager"

create_or_update_secret() {
    local name=$1
    local value=$2
    if gcloud secrets describe "${name}" >/dev/null 2>&1; then
        echo -n "${value}" | gcloud secrets versions add "${name}" --data-file=- --quiet
        log "Secret ${name} mis a jour"
    else
        echo -n "${value}" | gcloud secrets create "${name}" --data-file=- --replication-policy=automatic --quiet
        log "Secret ${name} cree"
    fi
}

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
MEILI_MASTER_KEY=$(openssl rand -base64 32)

create_or_update_secret "DATABASE_URL" "${DATABASE_URL}"
create_or_update_secret "JWT_SECRET" "${JWT_SECRET}"
create_or_update_secret "MEILI_MASTER_KEY" "${MEILI_MASTER_KEY}"

# Google Client ID - prompt user
echo ""
read -rp "$(echo -e "${YELLOW}Entrez votre GOOGLE_CLIENT_ID (ou appuyez sur Entree pour ignorer):${NC} ")" GOOGLE_CLIENT_ID
if [ -n "${GOOGLE_CLIENT_ID}" ]; then
    create_or_update_secret "GOOGLE_CLIENT_ID" "${GOOGLE_CLIENT_ID}"
else
    warn "GOOGLE_CLIENT_ID non configure. La connexion Google ne fonctionnera pas."
    # Create empty secret to avoid deployment error
    create_or_update_secret "GOOGLE_CLIENT_ID" "not-configured"
fi

# Grant Cloud Run access to secrets
log "Configuration des permissions pour Cloud Run..."
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for secret in DATABASE_URL JWT_SECRET MEILI_MASTER_KEY GOOGLE_CLIENT_ID; do
    gcloud secrets add-iam-policy-binding "${secret}" \
        --member="serviceAccount:${COMPUTE_SA}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet >/dev/null 2>&1
done
log "Permissions configurees"

# ----------------------------------------
# Build & Push Images
# ----------------------------------------
header "Build et push des images Docker"

log "Build de l'image backend..."
docker build -t "${BACKEND_IMAGE}" ./backend

log "Build de l'image frontend..."
# API_URL will be set after backend deployment, using placeholder for now
docker build -t "${FRONTEND_IMAGE}" \
    --build-arg NEXT_PUBLIC_API_URL="https://api.droitguineen.gn" \
    ./frontend

log "Push des images..."
docker push "${BACKEND_IMAGE}"
docker push "${FRONTEND_IMAGE}"

# ----------------------------------------
# Deploy Meilisearch
# ----------------------------------------
header "Deploiement de Meilisearch sur Cloud Run"

gcloud run deploy "${MEILI_SERVICE}" \
    --image="getmeili/meilisearch:v1.6" \
    --region="${REGION}" \
    --platform=managed \
    --no-allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=2 \
    --port=7700 \
    --set-secrets="MEILI_MASTER_KEY=MEILI_MASTER_KEY:latest" \
    --set-env-vars="MEILI_ENV=production,MEILI_NO_ANALYTICS=true" \
    --quiet

MEILI_URL=$(gcloud run services describe "${MEILI_SERVICE}" --region="${REGION}" --format="value(status.url)")
log "Meilisearch deploye: ${MEILI_URL}"

# ----------------------------------------
# Deploy Backend
# ----------------------------------------
header "Deploiement du Backend sur Cloud Run"

gcloud run deploy "${BACKEND_SERVICE}" \
    --image="${BACKEND_IMAGE}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --port=4000 \
    --add-cloudsql-instances="${CLOUD_SQL_CONNECTION}" \
    --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,MEILI_MASTER_KEY=MEILI_MASTER_KEY:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest" \
    --set-env-vars="NODE_ENV=production,SEARCH_URL=${MEILI_URL},CORS_ORIGIN=https://droitguineen.gn,GOOGLE_CLOUD_VISION_ENABLED=true,GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}" \
    --quiet

API_URL=$(gcloud run services describe "${BACKEND_SERVICE}" --region="${REGION}" --format="value(status.url)")
log "Backend deploye: ${API_URL}"

# ----------------------------------------
# Deploy Frontend
# ----------------------------------------
header "Deploiement du Frontend sur Cloud Run"

# Rebuild frontend with correct API URL
log "Rebuild du frontend avec l'URL du backend..."
docker build -t "${FRONTEND_IMAGE}" \
    --build-arg NEXT_PUBLIC_API_URL="${API_URL}" \
    ./frontend
docker push "${FRONTEND_IMAGE}"

gcloud run deploy "${FRONTEND_SERVICE}" \
    --image="${FRONTEND_IMAGE}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=256Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5 \
    --port=3000 \
    --quiet

FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" --region="${REGION}" --format="value(status.url)")
log "Frontend deploye: ${FRONTEND_URL}"

# Update CORS origin with actual frontend URL
log "Mise a jour du CORS origin..."
gcloud run services update "${BACKEND_SERVICE}" \
    --region="${REGION}" \
    --update-env-vars="CORS_ORIGIN=${FRONTEND_URL}" \
    --quiet

# ----------------------------------------
# Run Prisma Migrations
# ----------------------------------------
header "Execution des migrations Prisma"

log "Execution de prisma db push via Cloud Run Jobs..."
gcloud run jobs create droitguineen-migrate \
    --image="${BACKEND_IMAGE}" \
    --region="${REGION}" \
    --add-cloudsql-instances="${CLOUD_SQL_CONNECTION}" \
    --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
    --command="npx" \
    --args="prisma,db,push,--skip-generate" \
    --max-retries=1 \
    --quiet 2>/dev/null || true

gcloud run jobs execute droitguineen-migrate \
    --region="${REGION}" \
    --wait \
    --quiet

log "Migrations executees"

# ----------------------------------------
# Resume
# ----------------------------------------
header "Deploiement termine !"

echo ""
echo -e "${GREEN}Services deployes:${NC}"
echo -e "  Frontend:    ${FRONTEND_URL}"
echo -e "  Backend:     ${API_URL}"
echo -e "  Meilisearch: ${MEILI_URL}"
echo -e "  Cloud SQL:   ${CLOUD_SQL_CONNECTION}"
echo ""
echo -e "${YELLOW}Actions suivantes:${NC}"
echo -e "  1. Configurer un domaine custom: gcloud run domain-mappings create --service=${FRONTEND_SERVICE} --domain=droitguineen.gn --region=${REGION}"
echo -e "  2. Configurer Google OAuth: ajouter ${FRONTEND_URL} aux origines autorisees dans Google Cloud Console"
echo -e "  3. Creer un admin: connectez-vous a la base et creez un utilisateur admin"
echo ""
echo -e "${BLUE}Pour les prochains deployements, utilisez:${NC}"
echo -e "  gcloud builds submit --config cloudbuild.yaml --substitutions=_API_URL=${API_URL},_FRONTEND_URL=${FRONTEND_URL},_MEILI_URL=${MEILI_URL}"
echo ""
