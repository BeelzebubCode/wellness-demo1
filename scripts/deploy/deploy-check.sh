#!/bin/sh

echo "=================================================="
echo "   Wellness App - ZeroTier Deployment Check"
echo "=================================================="

# Check for ZeroTier interface
ZT_IFACE=$(ip addr show | grep 'zt' | awk -F': ' '{print $2}' | head -n 1)

if [ -z "$ZT_IFACE" ]; then
  echo "⚠️  WARNING: ZeroTier interface not found!"
  echo "   Please install ZeroTier and join a network first."
  echo "   Command: curl -s https://install.zerotier.com | sudo bash"
  echo "   Join: sudo zerotier-cli join <NETWORK_ID>"
else
  echo "✅ ZeroTier Interface detected: $ZT_IFACE"
  
  # Get IP Address
  ZT_IP=$(ip -4 addr show $ZT_IFACE | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
  
  echo "--------------------------------------------------"
  echo "   ACCESS URLS (Share these with your team)"
  echo "--------------------------------------------------"
  echo "   App:        http://$ZT_IP:3000"
  echo "   Admin (DB): http://$ZT_IP:8080"
  echo "--------------------------------------------------"
fi

echo ""
echo "Docker Containers Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep wellness
