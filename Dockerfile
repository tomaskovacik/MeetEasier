# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS build
WORKDIR /app

# Install deps first for better layer caching.
COPY package.json npm-shrinkwrap.json ./
COPY ui-react/package.json ui-react/npm-shrinkwrap.json ui-react/
RUN npm install

# Build the React front-end (root "build" script runs it inside ui-react/).
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/ui-react/build ./ui-react/build
COPY server.js ./
COPY app ./app
COPY config ./config
COPY static ./static

RUN mkdir -p /app/data

EXPOSE 8080
CMD ["node", "server.js"]
