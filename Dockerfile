# Zerpha Backend Dockerfile (for Railway deployment from monorepo root)
# Last updated: 2025-12-12

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from backend directory
COPY backend/package.json backend/package-lock.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci --legacy-peer-deps

# Copy backend source files
COPY backend/. .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package.json backend/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Railway sets PORT automatically
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the server
CMD ["npm", "start"]
