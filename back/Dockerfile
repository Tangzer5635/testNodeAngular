FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# 1. Dépendances d'abord : cette couche reste en cache tant que package*.json ne change pas
COPY package*.json ./
RUN npm ci --omit=dev

# 2. Puis le code
COPY . .

# Ne pas faire tourner l'application en root
USER node

EXPOSE 3000
# Pas de --env-file : les variables sont fournies par docker-compose
CMD ["node", "index.js"]
