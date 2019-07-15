FROM node:11
RUN npm install -g yarn truffle

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=development

COPY . /usr/src/app

RUN yarn install

EXPOSE 9545