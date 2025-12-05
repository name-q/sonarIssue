<p align="center">
  <img src="https://github.com/name-q/sonarIssue/blob/main/logo.png" width="180" />
</p>

[中文版点这里 →](./README_CN.md)

# Sonar Issues MCP Server

“An MCP server that extracts and resolves your Sonar issues, so you no longer have to pretend you’ll ‘get to them soon’.”

---

## Quick Start (npx)

Just run it. No installation, no dependencies, no nonsense:

```bash
SONAR_TOKEN=your_token npx sonarissues@latest
```

If it crashes, it's probably your token’s fault.

---

## Enable in Kiro

Create this file if it doesn’t exist:

```
.kiro/settings/mcp.json
```

Add the following:

```json
{
  "mcpServers": {
    "sonarissues": {
      "command": "npx",
      "args": ["sonarissues@latest"],
      "env": {
        "SONAR_TOKEN": "your_sonar_token_here"
      }
    }
  }
}
```

Restart Kiro. If it still doesn’t show up, pretend this is a feature.

---

## Capabilities

- Pulls Sonar issues so you don’t have to do it manually  
- Fetches way-too-detailed issue info  
- Generates “helpful” fix suggestions (results may vary)  
- Batch analysis that makes you look productive  

---

## Get Your Sonar Token

Visit:

```
https://your-sonar-server/account/security
```

Click **Generate Tokens**.  
Give it a name.  
Pretend the name matters.

---

## Environment Variables

| Name | Description |
|------|-------------|
| SONAR_TOKEN | Required, like oxygen |

---

## License

MIT — because life is too short for complicated licenses.
