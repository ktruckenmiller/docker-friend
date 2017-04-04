# FROM node:7.8-alpine
# RUN apt-get update && apt-get install iptables net-tools -y
FROM node:7.8-alpine
RUN apk update && apk add net-tools iptables

RUN npm install webpack hapi -g
COPY package.json /code/package.json
WORKDIR /code
RUN npm install

# frontend stuff
COPY ./build /code/build
COPY ./config /code/config
COPY ./src /code/src
COPY ./index.html /code/index.html
COPY ./setup.sh /code/setup.sh
RUN npm run build

# backend stuff
COPY ./api /code/api


ENTRYPOINT /code/run-prod.sh
