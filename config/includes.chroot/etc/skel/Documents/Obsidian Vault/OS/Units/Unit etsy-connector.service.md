---
title: "etsy-connector.service"
tags: [os, systemd]
---
# etsy-connector.service

ZothOS Etsy Connector & Antigravity MCP Bridge

- **Unit:** `etsy-connector.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/bin/python3 -m etsy_connector.web_cockpit --host 127.0.0.1 --port 8108`

- **Description:** ZothOS Etsy Connector & Antigravity MCP Bridge
- **ExecStart:** `/usr/bin/python3 -m etsy_connector.web_cockpit --host 127.0.0.1 --port 8108`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio etsy-connector|Etsy Connector]] · [[Workstation etsy-connector|Etsy Connector // Open API v3 & MCP Bridge]] · [[CLI etsy-connector|etsy-connector]] · [[Daemon etsy_connector|etsy-connector]]