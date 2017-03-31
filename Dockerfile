FROM node:7.5
RUN apt-get update && apt-get install iptables net-tools -y

RUN npm install webpack hapi -g
COPY package.json /code/package.json
WORKDIR /code
RUN npm install

COPY . /code
RUN npm run build


ENTRYPOINT /code/run-prod.sh
