#Used 
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN chown -R node:node /app

#used non-root user for security
USER node

EXPOSE 3000

CMD ["npm", "start"]