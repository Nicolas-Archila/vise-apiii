# vise-api/Dockerfile
FROM node:18-alpine
WORKDIR /app

# Solo instalar deps primero (mejor cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
