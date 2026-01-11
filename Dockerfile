# Production Dockerfile for Self-Hosting
FROM node:20-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    fonts-dejavu-core \
    fonts-liberation \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and source code
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install ALL dependencies (including TypeScript)
RUN npm ci

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source files after build
RUN npm prune --production && rm -rf src/

# Create temp directory
RUN mkdir -p /tmp/tconvert && chmod 777 /tmp/tconvert

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ping || exit 1

# Run the application
CMD ["node", "dist/server.js"]


# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]
