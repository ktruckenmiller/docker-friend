#!/bin/sh
docker build -t ktruckenmiller/docker-friend .
docker build -t ktruckenmiller/docker-friend-nginx -f Dockerfile.nginx .
# docker push ktruckenmiller/docker-friend
# docker push ktruckenmiller/docker-friend-nginx
