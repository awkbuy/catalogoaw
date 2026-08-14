FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias de sistema para SQLite y Prisma
RUN apk add --no-cache python3 make g++

# Copiar package files y instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente y de Prisma
COPY . .

# Generar cliente Prisma y construir la aplicación Next.js standalone
RUN npx prisma generate && \
    npm run build

# Etapa final: imagen mínima de producción
FROM node:22-alpine AS production

WORKDIR /app

# Instalar solo producción de dependencias (mejor tamaño)
COPY package.json ./
RUN npm ci --omit=dev

# Copiar el build standalone desde la etapa builder
COPY --from=builder /app/dist/app ./dist/app

# Copiar Prisma migrations y schema para poder hacer migraciones en runtime si es necesario
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Establecer variables de entorno por defecto (sobreescribibles con .env)
ENV NODE_ENV=production
ENV PORT=3000

# Exponer el puerto en que escucha Next.js standalone
EXPOSE 3000

# Comando de inicio: Next.js standalone
# El servidor escucha en 127.0.0.1:3000 por defecto en modo standalone
CMD ["npm", "start"]