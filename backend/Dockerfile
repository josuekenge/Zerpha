# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built JavaScript from builder
COPY --from=builder /app/dist ./dist

# Railway sets PORT automatically
ENV PORT=3001

EXPOSE 3001

# Start the application
CMD ["npm", "start"]
