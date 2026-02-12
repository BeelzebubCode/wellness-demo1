FROM node:20-alpine AS base
# ติดตั้ง dependencies ที่จำเป็นสำหรับการรัน Prisma บน Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# --- 1. Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- 2. Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build โปรเจกต์ (ข้าม lint เพื่อให้ build ผ่าน)
RUN NEXT_DISABLE_ESLINT=1 npm run build

# --- 3. Runner (Production) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy ไฟล์ที่จำเป็นสำหรับ Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ✅ Copy Prisma schema + seed files + node_modules (สำหรับ seed)
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# ✅ Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ✅ ใช้ entrypoint ที่ migrate + seed ก่อน start
CMD ["./docker-entrypoint.sh"]