#!/bin/sh
# nsenter -t 1 -m -u -n -i sh
LOCAL_IPV4=$(ifconfig docker0 | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')

ip address add 169.254.169.254/32 label lo:0 dev lo
# iptables -t nat -I OUTPUT --src localhost --dst 169.254.169.254 -p tcp --dport 80 -j REDIRECT --to-ports 3000

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

  sh
