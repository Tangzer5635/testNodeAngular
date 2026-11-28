FROM node:24-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json prisma.config.js ./
COPY prisma ./prisma
RUN npm ci --include=dev && npm prune --omit=dev

COPY . .

RUN mkdir -p uploads && chown node:node uploads

USER node

EXPOSE 3000
CMD ["node", "index.js"]
