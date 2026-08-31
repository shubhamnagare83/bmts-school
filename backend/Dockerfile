# syntax=docker/dockerfile:1

# ============================================================
# Build stage
# ============================================================
FROM node:20-alpine AS builder

# Puppeteer's bundled Chromium is built against glibc and cannot run on Alpine
# (musl). The runtime image installs Chromium from apk instead, so skip the
# download here — otherwise every build pulls ~150 MB it can never use.
# Both variable names are set: v19+ reads PUPPETEER_SKIP_DOWNLOAD, older
# versions read PUPPETEER_SKIP_CHROMIUM_DOWNLOAD.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build


# ============================================================
# Production stage
# ============================================================
FROM node:20-alpine AS production

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Chromium + fonts for server-side PDF rendering.
# The binary is named `chromium` on current Alpine releases and
# `chromium-browser` on older ones; symlink so a single path always works.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      ttf-dejavu \
      tini \
 && if [ ! -e /usr/bin/chromium-browser ] && [ -e /usr/bin/chromium ]; then \
      ln -s /usr/bin/chromium /usr/bin/chromium-browser; \
    fi \
 && /usr/bin/chromium-browser --version

WORKDIR /app

COPY package.json package-lock.json* ./
# `prisma` and `tsx` are runtime dependencies so that `prisma migrate deploy`
# and `prisma db seed` work inside the container.
RUN npm ci --omit=dev && npm cache clean --force

# Prisma schema + migrations are needed at runtime for `migrate deploy`.
COPY prisma ./prisma/
RUN npx prisma generate

# Compiled server and the static assets embedded into generated PDFs.
COPY --from=builder /app/dist ./dist
COPY assets ./assets/

# `uploads` holds user files (student photos, signatures) and is mounted as a
# named volume by docker-compose so it survives image rebuilds.
RUN mkdir -p /app/uploads \
 && chown -R node:node /app/uploads

USER node

EXPOSE 3000

# tini reaps zombie Chromium processes left behind by PDF generation.
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
