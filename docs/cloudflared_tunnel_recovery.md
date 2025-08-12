## Cloudflare Tunnel recovery and hardening (lms-pne.uk)

This guide restores a stable Cloudflare named tunnel that serves both hostnames:
- lms-pne.uk → http://localhost:3001 (frontend)
- api.lms-pne.uk → http://localhost:3000 (backend)

It replaces any token-based/quick tunnels, ensures correct credentials and permissions, installs a deterministic systemd service, and verifies DNS + connectivity. Use these steps whenever you see context canceled loops, Unauthorized: Failed to get tunnel, or persistent 530 errors.

### 0) Prerequisites
- OS user: `peter`
- You can open a browser on this machine to complete `cloudflared tunnel login`.
- Cloudflare account access to the zone: `lms-pne.uk`.

### 1) Stop and remove competing instances

```bash
sudo systemctl stop cloudflared 2>/dev/null || true
sudo systemctl disable cloudflared 2>/dev/null || true
sudo systemctl stop cloudflared-tunnel 2>/dev/null || true
sudo systemctl disable cloudflared-tunnel 2>/dev/null || true
pkill -f cloudflared || true
sudo rm -f /etc/systemd/system/cloudflared.service /etc/systemd/system/cloudflared-tunnel.service
sudo systemctl daemon-reload
```

If you ever see a unit starting with `--token`, it’s a quick tunnel and will ignore your config. Remove it and continue.

### 2) Ensure Cloudflare account certificate exists (cert.pem)

```bash
cloudflared tunnel login
ls -l ~/.cloudflared/cert.pem
```

This writes `~/.cloudflared/cert.pem`. It is required to manage DNS and generate named-tunnel credentials.

### 3) Use a named tunnel (reuse or create)

List tunnels:
```bash
cloudflared tunnel list | cat
```

- Reuse an existing tunnel ID if valid, or create a new one:
```bash
# Reuse (example)
TUNNEL_ID=3c67ffb3-8c6f-4319-bb3b-e55630ad8038
# Generate (if reuse fails)
cloudflared tunnel create lms-prod-$(date +%s)
# Get newest ID
TUNNEL_ID=$(ls -t ~/.cloudflared/*.json | head -n1 | xargs -n1 basename | sed 's/.json$//')
echo "$TUNNEL_ID"
```

Generate (or regenerate) credentials JSON for this named tunnel:
```bash
cloudflared tunnel credentials create "$TUNNEL_ID"
ls -l ~/.cloudflared/"$TUNNEL_ID".json
```

### 4) Centralize config and creds under /etc/cloudflared

```bash
sudo useradd -r -s /usr/sbin/nologin cloudflared 2>/dev/null || true
sudo mkdir -p /etc/cloudflared
sudo cp -f ~/.cloudflared/"$TUNNEL_ID".json /etc/cloudflared/
sudo cp -f ~/.cloudflared/cert.pem /etc/cloudflared/

sudo tee /etc/cloudflared/config.yml >/dev/null <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: /etc/cloudflared/${TUNNEL_ID}.json
origincert: /etc/cloudflared/cert.pem
protocol: http2

ingress:
  - hostname: lms-pne.uk
    service: http://localhost:3001
  - hostname: api.lms-pne.uk
    service: http://localhost:3000
  - service: http_status:404

loglevel: info
transport-loglevel: info
EOF

sudo chown -R cloudflared:cloudflared /etc/cloudflared
sudo chmod 640 /etc/cloudflared/config.yml
sudo chmod 600 /etc/cloudflared/${TUNNEL_ID}.json /etc/cloudflared/cert.pem
```

Notes:
- `protocol: http2` avoids some QUIC/UDP issues.
- Permissions matter: the service runs as `cloudflared` and must be able to read its files.

### 5) Create a deterministic systemd service

```bash
sudo tee /etc/systemd/system/cloudflared.service >/dev/null <<'UNIT'
[Unit]
Description=cloudflared tunnel
After=network-online.target
Wants=network-online.target

[Service]
User=cloudflared
Group=cloudflared
ExecStart=/usr/bin/cloudflared --config /etc/cloudflared/config.yml --no-autoupdate tunnel run
Restart=always
RestartSec=2
AmbientCapabilities=
CapabilityBoundingSet=
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared
```

Verify it references `--config /etc/cloudflared/config.yml` and not `--token`:
```bash
sudo systemctl cat cloudflared | sed -n '1,200p'
```

### 6) Route DNS for both hostnames to the tunnel

```bash
cloudflared tunnel route dns -f "$TUNNEL_ID" lms-pne.uk
cloudflared tunnel route dns -f "$TUNNEL_ID" api.lms-pne.uk
```

If records already exist, `-f` overwrites them to point at `<TUNNEL_ID>.cfargotunnel.com`. You can confirm:
```bash
dig +short lms-pne.uk CNAME
dig +short api.lms-pne.uk CNAME
```

### 7) Verify health

```bash
systemctl status cloudflared --no-pager
journalctl -u cloudflared -e --no-pager
cloudflared tunnel info "$TUNNEL_ID"

curl -I https://lms-pne.uk
curl -I https://api.lms-pne.uk
```

You should see multiple active connections in `tunnel info` and HTTP/2 200 responses from both hostnames.

### Common issues and quick fixes

- Duplicate/competing instances
  - Stop and disable all services; ensure only one systemd unit remains.
  - Remove any unit using `--token`.

- Unauthorized: Failed to get tunnel
  - The ID does not belong to the logged-in account or its credentials are invalid.
  - Regenerate credentials: `cloudflared tunnel credentials create "$TUNNEL_ID"` and reinstall to `/etc/cloudflared`.
  - If still failing, create a new named tunnel, update `/etc/cloudflared/config.yml` with the new ID, and reroute DNS with `-f`.

- context canceled loops
  - Usually caused by mixed token/named runs, missing `cert.pem`, or credentials path/permissions.
  - Ensure `origincert` and `credentials-file` paths are valid and readable by the `cloudflared` user.
  - Force HTTP/2 by keeping `protocol: http2`.
  - Check time sync: `timedatectl` then `sudo systemctl restart systemd-timesyncd`.
  - Confirm local backends are up: `curl -I http://localhost:3001` and `curl -I http://localhost:3000`.

- DNS conflicts
  - Use `cloudflared tunnel route dns -f "$TUNNEL_ID" <hostname>` to overwrite existing records.

### Cheat sheet (copy/paste)

```bash
# Login and pick account/zone in browser
cloudflared tunnel login

# Create new tunnel and capture ID
cloudflared tunnel create lms-prod-$(date +%s)
TUNNEL_ID=$(ls -t ~/.cloudflared/*.json | head -n1 | xargs -n1 basename | sed 's/.json$//')

# Install config and service
sudo useradd -r -s /usr/sbin/nologin cloudflared 2>/dev/null || true
sudo mkdir -p /etc/cloudflared
sudo cp -f ~/.cloudflared/${TUNNEL_ID}.json ~/.cloudflared/cert.pem /etc/cloudflared/
sudo tee /etc/cloudflared/config.yml >/dev/null <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: /etc/cloudflared/${TUNNEL_ID}.json
origincert: /etc/cloudflared/cert.pem
protocol: http2
ingress:
  - hostname: lms-pne.uk
    service: http://localhost:3001
  - hostname: api.lms-pne.uk
    service: http://localhost:3000
  - service: http_status:404
EOF
sudo chown -R cloudflared:cloudflared /etc/cloudflared
sudo chmod 640 /etc/cloudflared/config.yml
sudo chmod 600 /etc/cloudflared/${TUNNEL_ID}.json /etc/cloudflared/cert.pem

sudo tee /etc/systemd/system/cloudflared.service >/dev/null <<'UNIT'
[Unit]
Description=cloudflared tunnel
After=network-online.target
Wants=network-online.target
[Service]
User=cloudflared
Group=cloudflared
ExecStart=/usr/bin/cloudflared --config /etc/cloudflared/config.yml --no-autoupdate tunnel run
Restart=always
RestartSec=2
[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared

# Route DNS to this tunnel
cloudflared tunnel route dns -f ${TUNNEL_ID} lms-pne.uk
cloudflared tunnel route dns -f ${TUNNEL_ID} api.lms-pne.uk

# Verify
cloudflared tunnel info ${TUNNEL_ID}
curl -I https://lms-pne.uk
curl -I https://api.lms-pne.uk
```

### Current known-good mapping
- Hostnames: `lms-pne.uk` → 3001, `api.lms-pne.uk` → 3000
- Example working tunnel ID (at time of writing): `27f6d0fc-b547-4023-9ff3-03e484877777`

If you recreate the tunnel, remember to update `/etc/cloudflared/config.yml` with the new ID and rerun the DNS route commands with `-f`.




