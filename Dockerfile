FROM node:22-slim

# Prisma necesita openssl
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

COPY . .
RUN mkdir -p uploads

EXPOSE 3000
# Render inyecta PORT y las variables (BddString, JWT_SECRET, CORS_ORIGIN)
CMD ["node", "src/server.js"]
