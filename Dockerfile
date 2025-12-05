# Zerpha Backend Dockerfile (for Railway deployment from monorepo root)
# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files from backend directory (including package-lock.json)
COPY backend/package.json backend/package-lock.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy backend source files
COPY backend/. .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY backend/package.json backend/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Railway sets PORT automatically
ENV PORT=3001

EXPOSE 3001

# Start the server
CMD ["npm", "start"]
