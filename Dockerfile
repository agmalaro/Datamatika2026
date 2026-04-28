FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS runner
RUN apk add --no-cache curl
RUN addgroup -S nodejs && adduser -S astro -G nodejs
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY package.json ./

ENV HOST=0.0.0.0
ENV PORT=3000

USER astro
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
