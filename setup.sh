# From http://apple.stackexchange.com/questions/230300/what-is-the-modern-way-to-do-port-forwarding-on-el-capitan-forward-port-80-to

# This creates a local device on 169.254.169.254
sudo ifconfig lo0 alias 169.254.169.254 255.255.255.255
grep -F '169.254.169.254 localhost' /etc/hosts || echo '169.254.169.254 localhost' | sudo tee -a /etc/hosts

echo "
rdr pass on lo0 inet proto tcp from (lo0) to 169.254.169.254 port 80 -> 127.0.0.1 port 8010
" | sudo pfctl -ef -
