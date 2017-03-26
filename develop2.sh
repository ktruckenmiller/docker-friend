#!/bin/sh
docker run -it \
  -v $(PWD)/nginx.conf:/etc/nginx/conf.d/default.conf \
  -p 127.0.0.1:8009:80 \
  --name="docker-friend-nginx" \
  nginx
# frontend:
#   depends_on:
#     - docker-friend
#   image: nginx
#   volumes:
#     - ./nginx.conf:/etc/nginx/conf.d/default.conf
#   ports:
#     - 127.0.0.1:8009:80
