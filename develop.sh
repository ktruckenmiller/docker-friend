#!/bin/sh
docker build -t docker-friend-dev -f Dockerfile --target FRIEND .
docker run -it \
  -v $(PWD)/nginx.conf:/etc/nginx/conf.d/default.conf \
  -p 127.0.0.1:8010:80 \
  -d \
  --rm \
  --name="docker-friend-nginx" \
  nginx:alpine
# npm run dev & \
docker run -it \
  --rm \
  -v $(PWD):/code \
  -v ~/.aws:/root/.aws:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --net=host \
  --name="docker-friend" \
  --privileged=true \
  --entrypoint="/code/setup.sh" \
  docker-friend-dev \
  dev
