# Multi-stage build
# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . .


# Stage 2: Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production && npm cache clean --force

COPY --from=builder /app .

RUN mkdir -p output


EXPOSE 3000

CMD ["npm", "start"]
