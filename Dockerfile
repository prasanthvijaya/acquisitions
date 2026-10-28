FROM node:22-bookworm-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.js ./
RUN mkdir -p logs

FROM base AS development

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]

FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node src ./src
RUN mkdir -p logs && chown node:node logs

USER node

EXPOSE 3000

CMD ["npm", "start"]
