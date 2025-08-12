#!/bin/bash

# Cloudflare Tunnel Manager for LMS

TUNNEL_LOG="cloudflare-tunnel.log"
TUNNEL_PID_FILE="tunnel.pid"

start_tunnel() {
    echo "🚀 Starting Cloudflare Tunnel..."
    
    # Kill any existing tunnel
    pkill cloudflared 2>/dev/null
    
    # Start new tunnel
    nohup cloudflared tunnel --url http://localhost:3001 > $TUNNEL_LOG 2>&1 &
    echo $! > $TUNNEL_PID_FILE
    
    echo "⏳ Waiting for tunnel to initialize..."
    sleep 10
    
    # Extract URL from log
    URL=$(grep "Your quick Tunnel has been created" -A 2 $TUNNEL_LOG | grep "https://" | grep -o "https://[^[:space:]]*")
    
    if [ ! -z "$URL" ]; then
        echo "✅ Tunnel started successfully!"
        echo "🌐 Public URL: $URL"
        echo ""
        echo "📋 Your LMS is now accessible at:"
        echo "   $URL"
        echo ""
        echo "📝 To access different parts:"
        echo "   - Teacher Portal: $URL/teacher"
        echo "   - Student Portal: $URL/student"
        echo "   - Login: $URL/login"
    else
        echo "❌ Failed to start tunnel. Check $TUNNEL_LOG for details."
    fi
}

stop_tunnel() {
    echo "🛑 Stopping Cloudflare Tunnel..."
    pkill cloudflared
    rm -f $TUNNEL_PID_FILE
    echo "✅ Tunnel stopped."
}

status_tunnel() {
    if pgrep cloudflared > /dev/null; then
        echo "✅ Tunnel is running"
        URL=$(grep "Your quick Tunnel has been created" -A 2 $TUNNEL_LOG | grep "https://" | grep -o "https://[^[:space:]]*" | tail -1)
        if [ ! -z "$URL" ]; then
            echo "🌐 Public URL: $URL"
        fi
    else
        echo "❌ Tunnel is not running"
    fi
}

case "$1" in
    start)
        start_tunnel
        ;;
    stop)
        stop_tunnel
        ;;
    status)
        status_tunnel
        ;;
    restart)
        stop_tunnel
        sleep 2
        start_tunnel
        ;;
    url)
        URL=$(grep "Your quick Tunnel has been created" -A 2 $TUNNEL_LOG | grep "https://" | grep -o "https://[^[:space:]]*" | tail -1)
        if [ ! -z "$URL" ]; then
            echo "$URL"
        else
            echo "No tunnel URL found. Run './tunnel-manager.sh start' first."
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|url}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the Cloudflare tunnel"
        echo "  stop    - Stop the Cloudflare tunnel"
        echo "  status  - Check tunnel status"
        echo "  restart - Restart the tunnel"
        echo "  url     - Show the current public URL"
        exit 1
        ;;
esac

