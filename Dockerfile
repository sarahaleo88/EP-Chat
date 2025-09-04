## EP (Enhanced Prompt) - Stable Dockerfile
## Debian slim + Next.js standalone + reproducible installs

# ---------- deps ----------
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# Optional registry/proxy for reliability in CI (set via build-args)
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV npm_config_registry=$NPM_REGISTRY \
    http_proxy=$HTTP_PROXY https_proxy=$HTTPS_PROXY no_proxy=$NO_PROXY \
    npm_config_fetch_timeout=600000 npm_config_fetch_retries=5 npm_config_progress=false

# Toolchain for native deps (e.g., sharp/next-swc fallback)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

# Copy lockfiles only for deterministic install
COPY package.json package-lock.json* ./
COPY .npmrc* ./

# Full install with scripts enabled to fetch prebuilt binaries
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- run ----------
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# Create non-root user
RUN useradd -m -u 1001 nextjs

# Copy only runtime artifacts from standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000

# Healthcheck using Node (no extra packages)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
