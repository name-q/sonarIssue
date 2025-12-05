/**
 * 错误处理工具
 */

export class SonarAuthError extends Error {
  constructor(sonarUrl: string) {
    const message = `
[认证失败] 无法访问 Sonar 服务器

原因: 缺少有效的认证 Token

解决方案:
1. 访问 Sonar 获取 Token:
   ${sonarUrl}/account/security

2. 选择以下任一方式提供 Token:
   
   方式 A: 配置文件（推荐）
   编辑 .kiro/settings/mcp.json，添加:
   "env": {
     "SONAR_TOKEN": "your_token_here"
   }
   
   方式 B: 在对话中提供
   在调用工具时提供 token 参数

3. 重新连接 MCP 服务器后重试
`;
    super(message);
    this.name = "SonarAuthError";
  }
}

export function handleSonarError(error: any, sonarUrl: string): Error {
  // 检查是否是认证错误 (401)
  if (error.response?.status === 401) {
    return new SonarAuthError(sonarUrl);
  }

  // 检查是否是网络错误
  if (error.code === "ECONNREFUSED") {
    return new Error(
      `[连接失败] 无法连接到 Sonar 服务器: ${sonarUrl}\n\n请检查:\n1. URL 是否正确\n2. Sonar 服务器是否在线`
    );
  }

  // 其他错误
  return error;
}
