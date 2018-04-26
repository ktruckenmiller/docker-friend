#!/bin/sh
LOCAL_IPV4=$(ifconfig docker0 | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')
ip address add 169.254.169.254/32 label lo:0 dev lo

# Gather all the possible bridged networks so we can make sure and redirect them to the perm container
curl  -sS --unix-socket /var/run/docker.sock http://boston/networks/?type=custom > networks

networks=$(cat networks | jq '.[] | select(.Driver | contains("bridge")) | .Options."com.docker.network.bridge.name"' | tr -d '"')

echo $LOCAL_IPV4
# for interface in $networks; do
iptables \
  --append PREROUTING \
  --destination 169.254.169.254 \
  --protocol tcp \
  --dport 80 \
  --in-interface docker0 \
  --jump DNAT \
  --table nat \
  --to-destination $LOCAL_IPV4:3000 \
  --wait
# done

if [ "$1" == "dev" ]; then
  sh
  # cd api && npm run dev
else
  babel-node api/app.js
fi
