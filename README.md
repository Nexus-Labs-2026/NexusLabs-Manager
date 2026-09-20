# NexusLabs Manager

NexusLabs Manager is a lightweight, static server/RDP VM inventory dashboard built with HTML, CSS, and vanilla JavaScript.

It lets you add, edit, and delete endpoint profiles for RDP, SSH, VNC, and WinRM targets. The current version is a **frontend-only management UI**: server entries are stored in the browser's `localStorage`, and the **Connect** action is a UI/demo handoff rather than a native RDP/SSH session.

## Features

- Dashboard with server and VM inventory statistics
- Add server / RDP VM profiles
- Edit existing profiles
- Delete profiles with confirmation
- Search and group filtering
- RDP, SSH, VNC, and WinRM protocol profiles
- Browser persistence using `localStorage`
- JSON export/import support where provided by the UI
- Responsive desktop/mobile layout
- Docker image based on Nginx
- Docker Compose deployment
- Suitable for hosting inside a Proxmox VM or LXC that runs Docker

## Important security note

This application is **not a remote-access gateway**. It does not provide a secure browser-based RDP server, SSH server, VPN, or credential vault.

Do not put real passwords, private keys, API tokens, or other secrets into the frontend source code or a public GitHub repository. Browser `localStorage` is not a secure secrets store.

For production remote access, use an authenticated backend/gateway, TLS, MFA, RBAC, auditing, short-lived credentials, and a protected network path such as a VPN or zero-trust gateway. Avoid exposing RDP directly to the public internet.

---

# Testing locally

## Option 1: Python

No Node.js installation is required for the static frontend.

From the project directory:

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

Stop the server with `Ctrl+C`.

## Option 2: Docker

Build and run the application:

```bash
docker build -t nexuslabs-manager:local .
docker run --rm -p 8080:80 nexuslabs-manager:local
```

Open:

```text
http://localhost:8080
```

## Option 3: Docker Compose

```bash
docker compose up -d --build
```

Check the container:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop it:

```bash
docker compose down
```

The default host port is `8080`.

---

# Functional test checklist

After opening the dashboard, verify the following:

1. Dashboard loads without a JavaScript error.
2. Open **Servers**.
3. Click **Add Server**.
4. Enter a test name such as `Test RDP VM`.
5. Enter a test IP such as `192.0.2.50`.
6. Select **RDP** and port `3389`.
7. Save the server.
8. Confirm it appears in the inventory.
9. Edit the server and change its name or port.
10. Refresh the browser and confirm the entry remains.
11. Search for the entry.
12. Delete the test entry and confirm it disappears.
13. Test the other navigation views.
14. Open browser developer tools and check the **Console** for errors.
15. Test the application in a second browser if you need to verify browser-local storage behavior.

### Browser persistence

Server data is stored in the browser's `localStorage`. This means:

- Data is local to the browser/profile.
- A different browser or device will not automatically see the same servers.
- Clearing site data can remove the saved inventory.
- Docker restarts do not preserve browser data on the server because the data lives in the user's browser.

---

# Docker deployment

The included Dockerfile serves the static application with Nginx.

Build:

```bash
docker build -t nexuslabs-manager:latest .
```

Run:

```bash
docker run -d \\
  --name nexuslabs-manager \\
  --restart unless-stopped \\
  -p 8080:80 \\
  nexuslabs-manager:latest
```

Open:

```text
http://SERVER-IP:8080
```

Check status:

```bash
docker ps
```

Check logs:

```bash
docker logs nexuslabs-manager
```

Update after changing the source:

```bash
docker stop nexuslabs-manager
docker rm nexuslabs-manager
docker build -t nexuslabs-manager:latest .
docker run -d --name nexuslabs-manager --restart unless-stopped -p 8080:80 nexuslabs-manager:latest
```

## Docker Compose deployment

The recommended simple deployment is:

```bash
git clone https://github.com/YOUR-USERNAME/NexusLabs-Manager.git
cd NexusLabs-Manager
docker compose up -d --build
```

Then visit:

```text
http://SERVER-IP:8080
```

To update:

```bash
git pull
docker compose up -d --build
```

To stop:

```bash
docker compose down
```

---

# Proxmox host setup

A clean setup is to run NexusLabs Manager inside a small Linux VM or an LXC that has Docker support. The Proxmox host itself does not need to serve the application.

## Recommended layout

```text
Proxmox
└── Linux VM/LXC
    ├── Docker
    ├── Docker Compose
    └── NexusLabs Manager
        └── Nginx :80
```

The exact VM/LXC choice depends on your Proxmox environment and Docker policy. A small Debian/Ubuntu VM is the most straightforward option when you want standard Docker support without LXC-specific configuration.

## 1. Create the guest in Proxmox

Create a small Debian or Ubuntu VM in Proxmox.

Suggested starting point for this lightweight frontend:

- 1-2 vCPU
- 512 MB-1 GB RAM
- 4-8 GB disk
- A normal bridged network interface

The application itself has very low resource requirements. Increase resources if the same guest will host additional services.

Give the guest a stable LAN IP using either a static address or a DHCP reservation. Example:

```text
192.168.1.50
```

Use your own network address instead of the example above.

## 2. Install Docker in the guest

Follow Docker's official installation instructions for your selected Linux distribution. After installation, verify:

```bash
docker --version
docker compose version
```

If your distribution uses the Docker Compose plugin, the command is:

```bash
docker compose
```

## 3. Copy the project to the guest

Using Git is easiest:

```bash
git clone https://github.com/YOUR-USERNAME/NexusLabs-Manager.git
cd NexusLabs-Manager
```

If the repository is private, authenticate with GitHub using your preferred secure method.

## 4. Start NexusLabs Manager

```bash
docker compose up -d --build
```

Check:

```bash
docker compose ps
docker compose logs --tail=100
```

From another computer on the LAN, open:

```text
http://192.168.1.50:8080
```

Replace `192.168.1.50` with the actual Proxmox guest IP.

## 5. Firewall considerations

Only expose port `8080` to networks that should access the dashboard.

For a LAN-only installation, allow access from your management VLAN/LAN and avoid port-forwarding it from the public internet.

If you use a firewall on the guest or Proxmox, allow TCP `8080` from the intended management network.

## 6. Optional reverse proxy / HTTPS

For a production installation, place the application behind an HTTPS reverse proxy such as an existing Nginx Proxy Manager, Caddy, or another approved reverse proxy.

Typical flow:

```text
Client
  |
  | HTTPS :443
  v
Reverse Proxy
  |
  | HTTP :8080
  v
NexusLabs Manager container
```

The reverse proxy should handle the public TLS certificate and restrict access to the intended users/networks.

Do not expose the Nginx container's port `80` directly to the public internet just because it is running in Docker.

---

# GitHub workflow

After making changes locally:

```bash
git add .
git commit -m "Update NexusLabs Manager"
git push
```

On the Proxmox guest, update the deployment with:

```bash
git pull
docker compose up -d --build
```

---

# Publishing with GitHub Pages

Because the application is static, it can also be hosted with GitHub Pages.

In the GitHub repository:

1. Open **Settings**.
2. Open **Pages**.
3. Select **Deploy from a branch**.
4. Select the `main` branch.
5. Select `/ (root)`.
6. Save.

GitHub will provide the Pages URL after deployment.

GitHub Pages is suitable for the frontend demo/inventory UI, but it does not turn the application into an RDP gateway or secure backend.

---

# Project structure

```text
NexusLabs-Manager/
├── index.html
├── app.js
├── styles.css
├── package.json
├── ts/
│   └── app.ts
├── Dockerfile
├── compose.yaml
├── nginx.conf
├── .dockerignore
└── README.md
```

## Future production architecture

If you want this to become a real remote-management platform rather than a browser-only inventory UI, a possible architecture is:

```text
Browser
   |
 HTTPS
   v
Reverse Proxy / Auth
   |
   v
NexusLabs API
   |
   +---- Database
   |
   +---- Credential/secret service
   |
   +---- RDP/SSH gateway or controlled agent
   |
   +---- Audit/logging
```

Keep credentials and privileged operations on the server side rather than embedding them in JavaScript or browser storage.
