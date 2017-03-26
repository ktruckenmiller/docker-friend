#!/bin/sh
docker run -it \
  -v ~/.aws:/root/.aws:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --net=host \
  --name="docker-friend" \
  --privileged=true \
  --entrypoint="/code/setup.sh" \
  ktruckenmiller/dockerfriend

  # docker-friend:
  #   image: dockerfriend
  #   # build: .
  #   entrypoint: /code/setup.sh
  #   privileged: true
  #   volumes:
  #     - ./:/code
  #     - ~/.aws:/root/.aws:ro
  #     - /var/run/docker.sock:/var/run/docker.sock
  #   network_mode: host
  # frontend:
  #   depends_on:
  #     - docker-friend
  #   image: nginx
  #   volumes:
  #     - ./nginx.conf:/etc/nginx/conf.d/default.conf
  #   ports:
  #     - 127.0.0.1:8009:80







# # docker build -t docker-friend .
# docker run -it --rm \
#   -p 8010:80 \
#   -v ~/.aws:/root/.aws:ro \
#   -v $(PWD):/code \
#   -v /var/run/docker.sock:/var/run/docker.sock \
#   --workdir="/code" \
#   --privileged \
#   docker-friend node build/dev-server.js
# #
# # frontend:
# #   depends_on:
# #     - docker-friend
# #   image: nginx
# #   volumes:
# #     - ./nginx.conf:/etc/nginx/conf.d/default.conf
# #   ports:
# #     - 8009:80
