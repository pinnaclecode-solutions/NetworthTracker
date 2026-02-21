FROM node:20-alpine

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl bash

WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Expose dev port
EXPOSE 3000

# Start dev server (migrations run via entrypoint in docker-compose)
CMD ["npm", "run", "dev"]
