import axios, { AxiosInstance } from "axios";
import { SonarIssue } from "./types/index.js";

export class SonarClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * 从 Sonar URL 中提取项目 Key
   */
  extractProjectKey(url: string): string {
    const match = url.match(/[?&]id=([^&]+)/);
    if (!match) {
      throw new Error("无法从 URL 中提取项目 Key");
    }
    return match[1];
  }

  /**
   * 从 Sonar URL 中提取基础 URL
   */
  extractBaseUrl(url: string): string {
    const match = url.match(/^(https?:\/\/[^\/]+)/);
    if (!match) {
      throw new Error("无法从 URL 中提取基础 URL");
    }
    return match[1];
  }

  /**
   * 获取项目的所有问题
   */
  async getProjectIssues(
    baseUrl: string,
    projectKey: string,
    token?: string,
    severity?: string
  ): Promise<SonarIssue[]> {
    const headers: Record<string, string> = {};
    if (token) {
      // Sonar uses Basic Auth with token as username and empty password
      const auth = Buffer.from(`${token}:`).toString('base64');
      headers["Authorization"] = `Basic ${auth}`;
    }

    const params: Record<string, string> = {
      componentKeys: projectKey,
      resolved: "false",
      ps: "500", // 每页数量
    };

    if (severity) {
      params.severities = severity;
    }

    try {
      const response = await this.axiosInstance.get(
        `${baseUrl}/api/issues/search`,
        {
          headers,
          params,
        }
      );

      return response.data.issues || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Sonar API 请求失败: ${error.response?.status} - ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }

  /**
   * 获取特定问题的详细信息
   */
  async getIssueDetails(
    baseUrl: string,
    issueKey: string,
    token?: string
  ): Promise<SonarIssue> {
    const headers: Record<string, string> = {};
    if (token) {
      // Sonar uses Basic Auth with token as username and empty password
      const auth = Buffer.from(`${token}:`).toString('base64');
      headers["Authorization"] = `Basic ${auth}`;
    }

    try {
      const response = await this.axiosInstance.get(
        `${baseUrl}/api/issues/search`,
        {
          headers,
          params: {
            issues: issueKey,
          },
        }
      );

      const issues = response.data.issues || [];
      if (issues.length === 0) {
        throw new Error(`未找到问题: ${issueKey}`);
      }

      return issues[0];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Sonar API 请求失败: ${error.response?.status} - ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }

  /**
   * 获取规则详情
   */
  async getRuleDetails(
    baseUrl: string,
    ruleKey: string,
    token?: string
  ): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
      // sonar uses basic auth token
      const auth = Buffer.from(`${token}:`).toString('base64');
      headers["Authorization"] = `Basic ${auth}`;
    }

    try {
      const response = await this.axiosInstance.get(
        `${baseUrl}/api/rules/show`,
        {
          headers,
          params: {
            key: ruleKey,
          },
        }
      );

      return response.data.rule;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `获取规则详情失败: ${error.response?.status} - ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }
}
