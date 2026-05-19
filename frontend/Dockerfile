FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

COPY . .

CMD sh -c '[ -d node_modules/.bin ] || npm ci && exec npm run dev'
