#!/bin/sh
docker run -it \
  --rm \
  -v ~/.aws:/root/.aws:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --net=host \
  --name="docker-friend" \
  --privileged=true \
  --entrypoint="/code/setup.sh" \
  docker-friend
