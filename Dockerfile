# Root-level Dockerfile for Railway (builds backend service)

# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies (including devDeps for build)
RUN npm install

# Copy backend source
COPY backend/. .

# Build TypeScript
RUN npm run build

# Stage 2: Runner
FROM node:20-slim AS runner
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Expose and run
ENV PORT=3001
EXPOSE 3001
CMD ["npm", "start"]
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
