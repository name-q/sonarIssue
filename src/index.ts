#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SonarClient } from "./sonar-client.js";
import { IssueResolver } from "./issue-resolver.js";

// 初始化 Sonar 客户端和问题解决器
const sonarClient = new SonarClient();
const issueResolver = new IssueResolver();

// 创建 MCP 服务器
const server = new McpServer({
  name: "sonarissues",
  version: "1.0.0",
});

// 注册工具：分析 Sonar 项目
const analyzeProjectSchema = z.object({
  url: z
    .string()
    .describe(
      "Sonar 项目的 URL，例如：https://sonar.devops.mcd.com.cn/dashboard?id=ai-managerweb"
    ),
  token: z
    .string()
    .optional()
    .describe("Sonar 认证 Token（可选，如果需要访问私有项目）"),
});

server.registerTool(
  "analyze_sonar_project",
  {
    description:
      "分析 Sonar 项目并获取所有待解决的问题。支持通过项目 URL 或项目 Key 来获取问题列表。",
    inputSchema: analyzeProjectSchema as any,
  },
  // @ts-ignore
  async (params: { url: string; token?: string }) => {
    const { url, token } = params;
    const projectKey = sonarClient.extractProjectKey(url);
    const baseUrl = sonarClient.extractBaseUrl(url);

    const issues = await sonarClient.getProjectIssues(
      baseUrl,
      projectKey,
      token
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectKey,
              totalIssues: issues.length,
              issues: issues.map((issue) => ({
                key: issue.key,
                severity: issue.severity,
                type: issue.type,
                message: issue.message,
                component: issue.component,
                line: issue.line,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// 注册工具：获取问题详情
const getIssueDetailsSchema = z.object({
  issueKey: z.string().describe("Sonar 问题的唯一标识符"),
  sonarUrl: z.string().describe("Sonar 服务器的基础 URL"),
  token: z.string().optional().describe("Sonar 认证 Token（可选）"),
});

server.registerTool(
  "get_issue_details",
  {
    description:
      "获取特定 Sonar 问题的详细信息，包括代码位置、问题描述和建议的修复方案。",
    inputSchema: getIssueDetailsSchema as any,
  },
  //@ts-ignore
  async (params: { issueKey: string; sonarUrl: string; token: string }) => {
    const { issueKey, sonarUrl, token } = params;
    const issue = await sonarClient.getIssueDetails(sonarUrl, issueKey, token);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(issue, null, 2),
        },
      ],
    };
  }
);

// 注册工具：生成修复建议
const suggestFixSchema = z.object({
  issueKey: z.string().describe("Sonar 问题的唯一标识符"),
  sonarUrl: z.string().describe("Sonar 服务器的基础 URL"),
  token: z.string().optional().describe("Sonar 认证 Token（可选）"),
});
server.registerTool(
  "suggest_fix",
  {
    description: "根据 Sonar 问题类型，生成自动修复建议和代码补丁。",
    inputSchema: suggestFixSchema as any,
  },
  // @ts-ignore
  async (params: { issueKey: string; sonarUrl: string; token?: string }) => {
    const { issueKey, sonarUrl, token } = params;
    const issue = await sonarClient.getIssueDetails(sonarUrl, issueKey, token);
    const suggestion = issueResolver.generateFixSuggestion(issue);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(suggestion, null, 2),
        },
      ],
    };
  }
);

// 注册工具：批量分析问题
const batchAnalyzeSchema = z.object({
  url: z.string().describe("Sonar 项目的 URL"),
  token: z.string().optional().describe("Sonar 认证 Token（可选）"),
  severity: z
    .enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"])
    .optional()
    .describe("过滤特定严重程度的问题（可选）"),
});

server.registerTool(
  "batch_analyze_issues",
  {
    description:
      "批量分析项目中的所有问题，按严重程度和类型分类，并生成修复优先级报告。",
    inputSchema: batchAnalyzeSchema as any,
  },
  // @ts-ignore
  async (params: {
    url: string;
    token?: string;
    severity?: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
  }) => {
    const { url, token, severity } = params;
    const projectKey = sonarClient.extractProjectKey(url);
    const baseUrl = sonarClient.extractBaseUrl(url);

    const issues = await sonarClient.getProjectIssues(
      baseUrl,
      projectKey,
      token,
      severity
    );

    const analysis = issueResolver.batchAnalyze(issues);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }
);

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sonar Issues MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
