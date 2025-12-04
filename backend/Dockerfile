# Stage 1: Builder
FROM node:20.18.0-slim AS builder

WORKDIR /app

# Copy only package files first for better caching
COPY backend/package*.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm install

# Copy source files AFTER installing dependencies (preserves node_modules)
COPY backend/. .

# Build TypeScript
RUN npm run build

# Stage 2: Runner
FROM node:20.18.0-slim AS runner

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will override with PORT env var)
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
