# syntax=docker/dockerfile:1

# ============================================================
# Build stage
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# No VITE_API_URL is provided on purpose: the client falls back to the
# relative `/api` base, which Nginx proxies to the backend container.
# Setting it here would hard-code an absolute origin into the bundle.
RUN npm run build


# ============================================================
# Serve stage
# ============================================================
FROM nginx:alpine AS production

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
