#!/bin/bash

echo "🔧 Setting up tunnel credentials for lms-pne.uk..."

# Step 1: Authenticate with Cloudflare
echo "📋 Step 1: Authenticating with Cloudflare..."
echo "Please visit this URL in your browser:"
echo "https://dash.cloudflare.com/argotunnel?aud=&callback=https%3A%2F%2Flogin.cloudflareaccess.org%2FmdNJTY5fb6pZZqHqFcLeGff7vxfbh6MKOv9wDV5iAyQ%3D"
echo ""
echo "After authenticating, press Enter to continue..."
read -p "Press Enter when done..."

# Step 2: Create tunnel
echo "📋 Step 2: Creating tunnel..."
cloudflared tunnel create lms-pne-uk

# Step 3: Route DNS
echo "📋 Step 3: Setting up DNS routes..."
cloudflared tunnel route dns lms-pne-uk lms-pne.uk
cloudflared tunnel route dns lms-pne-uk api.lms-pne.uk

# Step 4: Create systemd service
echo "📋 Step 4: Creating persistent service..."
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

echo "✅ Tunnel setup complete!"
echo "🌐 Your tunnel will now auto-start on boot and persist across logins."
echo "📝 To check status: sudo systemctl status cloudflared-tunnel.service"





