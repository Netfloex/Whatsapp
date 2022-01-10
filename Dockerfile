ARG NODE_IMAGE=node:12-alpine

FROM $NODE_IMAGE AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM $NODE_IMAGE AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline

FROM $NODE_IMAGE AS runner
WORKDIR /app


COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json


CMD [ "node", "dist/index.js" ]