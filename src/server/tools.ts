import { z } from "zod";
import { SonarClient } from "../sonar-client.js";
import { IssueResolver } from "../issue-resolver.js";
import {
  analyzeProjectSchema,
  getIssueDetailsSchema,
  suggestFixSchema,
  batchAnalyzeSchema,
} from "./schemas.js";

const sonarClient = new SonarClient();
const issueResolver = new IssueResolver();

type Tool<T extends z.ZodSchema> = {
  name: string;
  schema: T;
  description: string;
  handler: (params: z.infer<T>) => Promise<{ content: Array<{ type: "text"; text: string }> }>;
};

const analyzeProjectTool: Tool<typeof analyzeProjectSchema> = {
  name: "analyze_sonar_project",
  schema: analyzeProjectSchema,
  description:
    "分析 Sonar 项目并获取所有待解决的问题。支持通过项目 URL 或项目 Key 来获取问题列表。",
  handler: async ({ url, token }) => {
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
  },
};

const getIssueDetailsTool: Tool<typeof getIssueDetailsSchema> = {
  name: "get_issue_details",
  schema: getIssueDetailsSchema,
  description:
    "获取特定 Sonar 问题的详细信息，包括代码位置、问题描述和建议的修复方案。",
  handler: async ({ issueKey, sonarUrl, token }) => {
    const issue = await sonarClient.getIssueDetails(sonarUrl, issueKey, token);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(issue, null, 2),
        },
      ],
    };
  },
};

const suggestFixTool: Tool<typeof suggestFixSchema> = {
  name: "suggest_fix",
  schema: suggestFixSchema,
  description: "根据 Sonar 问题类型，生成自动修复建议和代码补丁。",
  handler: async ({ issueKey, sonarUrl, token }) => {
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
  },
};

const batchAnalyzeTool: Tool<typeof batchAnalyzeSchema> = {
  name: "batch_analyze_issues",
  schema: batchAnalyzeSchema,
  description:
    "批量分析项目中的所有问题，按严重程度和类型分类，并生成修复优先级报告。",
  handler: async ({ url, token, severity }) => {
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
  },
};

export const tools = [
  analyzeProjectTool,
  getIssueDetailsTool,
  suggestFixTool,
  batchAnalyzeTool,
];
