# Dockerfile
FROM oven/bun:1.3.8-alpine AS builder

WORKDIR /app

# Install build dependencies for sharp
RUN apk add --no-cache python3 make g++ vips-dev

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.3.8-alpine

WORKDIR /app

# Install runtime dependencies for sharp and bash for WEBHOOK_COMMAND
RUN apk add --no-cache vips bash

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create directories for persistent data
RUN mkdir -p data uploads

# Set production defaults
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start"]
