#!/bin/sh
arn=$(docker run -it \
  -e IAM_ROLE="prod-kloudcover-asg-docke-DockercloudEC2InstanceRo-1XXEYC1C79HIP" \
  --entrypoint="aws" \
  --rm \
  ktruckenmiller/awscli \
  sts get-caller-identity --query 'Arn')

if [[ $arn == *"1XXEYC1C79HIP"* ]]; then
  echo "Role 1 is solid"
else
  echo "FAIL"
fi

arn2=$(docker run -it \
  -e IAM_ROLE="prod-kloudcover-asg-docke-DockercloudEC2InstanceRo-PEDJUU4CQDZ2" \
  --entrypoint="aws" \
  --rm \
  ktruckenmiller/awscli \
  sts get-caller-identity --query 'Arn')

if [[ $arn2 == *"PEDJUU4CQDZ2"* ]]; then
  echo "Role 2 is solid"
else
  echo "FAIL"
  echo $arn2
fi
