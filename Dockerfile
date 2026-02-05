# Dockerfile
FROM oven/bun:1.3.8-alpine AS builder

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.3.8-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create directories
RUN mkdir -p data uploads

EXPOSE 3000

CMD ["bun", "run", "start"]
