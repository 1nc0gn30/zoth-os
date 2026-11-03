---
title: "RealToolWorkspacePage"
tags: [studio, page]
---

# RealToolWorkspacePage

`RealToolWorkspacePage` serves as the dynamic individual workstation and interactive execution sandbox mounted at route `/tools/:toolId` in Zoth Studio v2.

## What it renders

- **Dynamic Tool Resolution**: Resolves tool metadata and documentation from `microTools` using the `:toolId` route parameter (also receiving redirected traffic from `/workstations/:workstationId`). Renders a recovery 404 container if the tool ID is not recognized.
- **Sovereign Runtime Evaluation**: Uses `useSovereignRuntime` to detect environment capabilities (`isLocal`, `hasWebGPU`, `evaluateTool`):
  - *Local Node*: Activates bare-metal execution HUD with loopback socket privileges on `127.0.0.1`.
  - *Client-Side Execution*: Displays hardware-accelerated WebGPU or WASM execution HUD for zero-egress in-browser tools.
  - *Air-Gap Lockout (`AirGapToolLockout`)*: Blurs and locks remote bare-metal execution on public web deployments with an explicit preview unlock override.
- **Embedded Enclave Component (`ENCLAVE_TOOL_COMPONENTS`)**: Dynamically mounts the dedicated interactive workspace component for the specific tool (such as `HexStrikeTool`, `EnvGuardVaultTool`, `PromptMasterTool`, `AdytumPlannerTool`, `BoltDiyTool`, or `WebGPUToolWorkstation`).
- **Tool Dossier & MCP Configuration**:
  - Displays category badges, version numbers, GitHub links, and git clone terminal instructions.
  - Generates ready-to-use Model Context Protocol (`mcpServers`) JSON configuration blocks with one-click copy support.
  - Includes `ToolOfferLine` commercial options and `SovereignFunnel` for local deployment.

- **Source:** `zoth-studio-v2/src/pages/RealToolWorkspacePage.jsx`
- **Route:** `/tools/:toolId`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route tools-toolId|/tools/:toolId]] · [[MOC Studio Tools]] · [[MOC Workstations]]