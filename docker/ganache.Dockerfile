FROM node:16

RUN npm install --global ganache@beta

ADD docker/ganache.entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
