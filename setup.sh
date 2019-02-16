#!/bin/sh
LOCAL_IPV4=$(ifconfig docker0 | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')
ip address add 169.254.169.254/32 label lo:0 dev lo

networks=$(node startups/ifconfig.js)

for interface in $networks; do
  iptables \
    --append PREROUTING \
    --destination 169.254.169.254 \
    --protocol tcp \
    --dport 80 \
    --in-interface $interface \
    --jump DNAT \
    --table nat \
    --to-destination $LOCAL_IPV4:3000 \
    --wait
done

if [ "$1" == "dev" ]; then
  sh
  # cd api && npm run dev
else
  babel-node api/app.js
fi
