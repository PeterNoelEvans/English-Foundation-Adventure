#!/bin/bash

# Setup persistent tunnel for lms-pne.uk

echo "🔧 Setting up persistent tunnel for lms-pne.uk..."

# Create .cloudflared directory if it doesn't exist
mkdir -p /home/peter/.cloudflared

# Create a systemd service for the tunnel
sudo tee /etc/systemd/system/cloudflared-tunnel.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel for lms-pne.uk
After=network.target

[Service]
Type=simple
User=peter
WorkingDirectory=/mnt/LMS-database/repos/English-Foundation-Adventure
ExecStart=/usr/bin/cloudflared tunnel --config tunnel-config.yml run lms-pne-uk
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-tunnel.service
sudo systemctl start cloudflared-tunnel.service

echo "✅ Tunnel service created and enabled!"
echo "📋 Status:"
sudo systemctl status cloudflared-tunnel.service --no-pager -l

echo ""
echo "🌐 Your tunnel will now auto-start on boot and persist across logins."
echo "📝 To check status: sudo systemctl status cloudflared-tunnel.service"
echo "📝 To restart: sudo systemctl restart cloudflared-tunnel.service"
echo "📝 To stop: sudo systemctl stop cloudflared-tunnel.service"





