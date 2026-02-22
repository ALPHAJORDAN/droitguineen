# ==========================================
# Multi-stage Dockerfile for Backend
# ==========================================

# Stage 1: Dependencies
FROM node:20-alpine3.20 AS deps
WORKDIR /app

# Install system dependencies for native modules (canvas)
RUN apk add --no-cache python3 make g++ pkgconf pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev

COPY package*.json ./
RUN npm ci --only=production && \
    cp -R node_modules /prod_modules && \
    npm ci

# Stage 2: Builder
FROM node:20-alpine3.20 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Stage 3: Production
FROM node:20-alpine3.20 AS production
WORKDIR /app

# Install runtime dependencies for native modules (canvas)
RUN apk add --no-cache pixman cairo pango libjpeg-turbo giflib

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy production dependencies and built code
COPY --from=deps /prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p /app/uploads

# Set ownership
RUN chown -R expressjs:nodejs /app

USER expressjs

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]

# Stage 4: Development
FROM node:20-alpine3.20 AS development
WORKDIR /app

# Install system dependencies for native modules (canvas)
RUN apk add --no-cache python3 make g++ pkgconf pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=development
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "run", "dev"]
