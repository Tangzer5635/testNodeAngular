# Étape 1 : compiler l'application Angular
FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : servir les fichiers compilés avec nginx (l'image finale ne contient ni Node ni node_modules)
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/front/browser /usr/share/nginx/html

EXPOSE 80
