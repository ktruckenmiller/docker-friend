#!/bin/sh
docker run -it --entrypoint="/bin/sh" \
  -e IAM_ROLE_ARN="arn:aws:iam::601394826940:role/dockercloud/instancerole/prod-dockercloud-autospot-DockercloudEC2InstanceRo-1X1N3V6P5PQA2" \
  ktruckenmiller/awscli

# docker run -it --entrypoint="/bin/sh" \
#   -e IAM_ROLE="prod-kloudcover-asg-docke-DockercloudEC2InstanceRo-PEDJUU4CQDZ2" \
#   ktruckenmiller/awscli
