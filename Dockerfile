# Stage 1 BUILD STAGE
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# build TypeScript → JavaScript
RUN npm run build


# Stage 2 PRODUCTION STAGE
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

# install ONLY production dependencies no TypeScript compiler, no jest etc
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src/database ./src/database

EXPOSE 3000

CMD ["node", "dist/main.js"]