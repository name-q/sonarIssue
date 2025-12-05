<p align="center">
  <img src="https://github.com/name-q/sonarIssue/blob/main/logo.png" width="180" />
</p>

[Click here for English version →](./README.md)

# Sonar Issues MCP 服务端

「一个 MCP 服务端，会把 Sonar 的问题揪出来并顺手解决，让你不必再假装‘我马上就会修的’。」

---

## 快速开始（npx）

不用安装，不用依赖，不用折腾：

```bash
SONAR_TOKEN=your_token npx sonarissues@latest
```

如果报错，大概率是你的 Token 不争气。

---

## 在 Kiro 中启用

如果没这个文件就自己建一个：

```
.kiro/settings/mcp.json
```

填入：

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

重启 Kiro。  
如果还是看不到，就假装这是软件的一个特性。

---

## 能力

- 自动拉取 Sonar 问题，让你少受点折磨  
- 获取你本来不想知道的详细信息  
- 生成可能有用也可能没用的修复建议  
- 批量分析，让你看起来特别忙  

---

## 获取 Token

打开：

```
https://your-sonar-server/account/security
```

点击 **Generate Tokens**。  
名字随便填，反正没人在意。

---

## 环境变量

| 名称 | 描述 |
|------|------|
| SONAR_TOKEN | 必填，像氧气一样重要 |

---

## 许可证

MIT —— 因为没人有空写长的。
