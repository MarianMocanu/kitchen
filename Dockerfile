FROM node:24.16.0-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY src ./src

COPY tests ./tests

# COPY vitest.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]