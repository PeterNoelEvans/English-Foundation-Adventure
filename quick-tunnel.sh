#!/bin/bash

echo "🚀 Setting up Cloudflare Tunnel for LMS..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed. Please install it first."
    exit 1
fi

echo "📋 Steps to complete:"
echo ""
echo "1. Authenticate with Cloudflare:"
echo "   cloudflared tunnel login"
echo ""
echo "2. Create a tunnel:"
echo "   cloudflared tunnel create lms-tunnel"
echo ""
echo "3. Start the tunnel:"
echo "   cloudflared tunnel run lms-tunnel"
echo ""
echo "4. Or use the quick command:"
echo "   cloudflared tunnel --url http://localhost:3001"
echo ""
echo "📝 Notes:"
echo "- Replace 'lms.yourdomain.com' with your actual domain"
echo "- Make sure your domain is managed by Cloudflare"
echo "- The tunnel will provide a public URL you can share"
echo ""
echo "🔗 Your application will be available at the provided URL"
