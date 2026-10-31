# Runtime / Compose / deploy image (small Alpine).
# Cursor Dev Container uses Dockerfile.dev (Bookworm) — see .devcontainer/
FROM node:24.16.0-alpine

WORKDIR /app

# Install only inside the image (do not COPY host node_modules).
# No package-lock.json — npm install resolves from package.json on each build.
COPY package.json ./
RUN npm install

COPY src ./src
COPY tests ./tests

EXPOSE 3000

CMD ["npm", "run", "start"]