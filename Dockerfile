FROM node:7.8-alpine
RUN apk update && apk add net-tools iptables curl jq

RUN npm install webpack hapi -g
COPY package.json /code/package.json
WORKDIR /code
RUN npm install

# frontend stuff
COPY ./build /code/build
COPY ./config /code/config
COPY ./src /code/src
COPY index.html setup.sh /code/
RUN npm run build

# backend stuff
COPY ./api /code/api


ENTRYPOINT /code/setup.sh
