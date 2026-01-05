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
# สร้าง Prisma Client
RUN npx prisma generate
# Build โปรเจกต์
RUN npm run build

# --- 3. Runner (Production) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy ไฟล์ที่จำเป็นสำหรับ Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ✅✅ เพิ่มบรรทัดนี้: Copy โฟลเดอร์ Prisma มาด้วย (สำคัญมาก!)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]