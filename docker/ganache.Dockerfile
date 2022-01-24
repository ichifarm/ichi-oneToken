FROM node:12

WORKDIR /app

COPY yarn.lock /app
COPY package.json /app

RUN yarn install

COPY . /app

ENTRYPOINT ["/entrypoint.sh"]
