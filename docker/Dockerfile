FROM node:12

RUN mkdir /app
WORKDIR /app

COPY yarn.lock /app
COPY package.json /app

RUN yarn install

COPY . /app

ENTRYPOINT ["/app/docker/entrypoint.sh"]
