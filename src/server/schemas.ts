import { z } from "zod";

export const analyzeProjectSchema = z.object({
  url: z
    .string()
    .describe(
      "Sonar 项目的 URL，例如：https://sonar.devops.com.cn/dashboard?id=ai-managerweb"
    ),
  token: z
    .string()
    .optional()
    .describe("Sonar 认证 Token（可选，如果需要访问私有项目）"),
});

export const getIssueDetailsSchema = z.object({
  issueKey: z.string().describe("Sonar 问题的唯一标识符"),
  sonarUrl: z.string().describe("Sonar 服务器的基础 URL"),
  token: z
    .string()
    .optional()
    .describe("Sonar 认证 Token（可选，如果需要访问私有项目）"),
});

export const suggestFixSchema = z.object({
  issueKey: z.string().describe("Sonar 问题的唯一标识符"),
  sonarUrl: z.string().describe("Sonar 服务器的基础 URL"),
  token: z
    .string()
    .optional()
    .describe("Sonar 认证 Token（可选，如果需要访问私有项目）"),
});

export const batchAnalyzeSchema = z.object({
  url: z.string().describe("Sonar 项目的 URL"),
  severity: z
    .enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"])
    .optional()
    .describe("过滤特定严重程度的问题（可选）"),
  token: z
    .string()
    .optional()
    .describe("Sonar 认证 Token（可选，如果需要访问私有项目）"),
});
