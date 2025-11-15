FROM node:20-alpine

# Install git (required for simple-git package)
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code and examples
COPY src/ ./src/
COPY examples/ ./examples/

# Build TypeScript
RUN npm install -D typescript @types/node && \
    npm run build && \
    npm prune --production

# Create workspace directory and set permissions
RUN mkdir -p /agent-workspace && \
    chown -R node:node /agent-workspace && \
    chown -R node:node /app/examples

# Switch to non-root user
USER node

# Environment variables will be set by docker-compose
ENV NODE_ENV=production

# Default command
CMD ["node", "dist/index.js"]
