FROM node:lts-alpine

RUN corepack enable

WORKDIR /ask-pdf

COPY . .

RUN pnpm install --frozen-lockfile && pnpm build

CMD ["node", ".output/server/index.mjs"]