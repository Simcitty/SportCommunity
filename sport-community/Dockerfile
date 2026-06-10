# ── Stage 1: Build ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve mit nginx ────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist/sport-community/browser /usr/share/nginx/html

# Angular Router braucht diese nginx Config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
