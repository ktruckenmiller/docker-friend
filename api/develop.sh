#!/bin/sh
docker build -t dockerfriend-api .
docker rm dockerfriend-api -f || true
docker run -it --rm -v $(pwd):/build -v ~/.aws:/root/.aws:ro --workdir=/build dockerfriend-api bash
