# Multi-stage Dockerfile for ACP Agent with Node.js and Bun support

# Stage 1: Base image with both Node.js and Bun
FROM oven/bun:1.2.13-alpine AS base

# Install Node.js for dual runtime support
RUN apk add --no-cache nodejs npm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript project
RUN bun run build

# Stage 2: Production image
FROM oven/bun:1.2.13-alpine AS production

# Install Node.js for dual runtime support
RUN apk add --no-cache nodejs npm

# Create non-root user for security
RUN addgroup -g 1001 -S acp && \
    adduser -S acp -u 1001

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=base --chown=acp:acp /app/dist ./dist
COPY --from=base --chown=acp:acp /app/config ./config
COPY --from=base --chown=acp:acp /app/node_modules ./node_modules
COPY --from=base --chown=acp:acp /app/package.json ./

# Create logs directory
RUN mkdir -p logs && chown -R acp:acp logs

# Switch to non-root user
USER acp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV ACP_HOST=0.0.0.0
ENV ACP_PORT=3000

# Default to Node.js runtime, but can be overridden
ENV RUNTIME=node

# Start command with runtime selection
CMD if [ "$RUNTIME" = "bun" ]; then \
      bun dist/index.js; \
    else \
      node dist/index.js; \
    fi