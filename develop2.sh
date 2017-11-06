#!/bin/sh
docker run -it \
  -v $(PWD)/nginx.conf:/etc/nginx/conf.d/default.conf \
  -p 127.0.0.1:8010:80 \
  --rm \
  --name="docker-friend-nginx" \
  nginx
