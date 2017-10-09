FROM node:alpine
RUN apk update && apk add net-tools iptables curl jq





# backend stuff
RUN npm install webpack hapi babel-cli -g
# WORKDIR ./api
# RUN npm run build
COPY ./api /code/api
WORKDIR /code/api
RUN npm install


# frontend stuff
WORKDIR /code
COPY package.json /code/package.json
RUN npm install
COPY ./build /code/build
COPY ./config /code/config
COPY ./src /code/src
COPY index.html setup.sh /code/
RUN npm run build

ENTRYPOINT /code/setup.sh
