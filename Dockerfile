FROM node:14-alpine

ARG port=8080
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .

EXPOSE $port
CMD ["node", "."]