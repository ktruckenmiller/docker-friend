FROM mhart/alpine-node:latest
MAINTAINER kmtruckenmiller@gmail.com
RUN mkdir -p /code
ADD package.json /code/package.json
WORKDIR /code
RUN npm install --only=production
ADD index.js /code/index.js
CMD ["node", "/code/index.js"]
