import { SonarIssue, FixSuggestion, BatchAnalysis } from "./types/index.js";
import { SonarClient } from "./sonar-client.js";

export class IssueResolver {
  private sonarClient: SonarClient;
  private baseUrl: string = "";
  private token?: string;

  constructor(baseUrl?: string, token?: string) {
    this.sonarClient = new SonarClient();
    this.baseUrl = baseUrl || "";
    this.token = token;
  }

  /**
   * 设置 Sonar 服务器信息
   */
  setSonarConfig(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * 生成修复建议
   */
  async generateFixSuggestion(issue: SonarIssue): Promise<FixSuggestion> {
    const priority = this.calculatePriority(issue);
    const suggestion = await this.getSuggestionByRule(issue);

    return {
      issueKey: issue.key,
      severity: issue.severity,
      type: issue.type,
      message: issue.message,
      suggestion,
      priority,
      estimatedEffort: issue.effort,
    };
  }

  /**
   * 批量分析问题
   */
  async batchAnalyze(issues: SonarIssue[]): Promise<BatchAnalysis> {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    issues.forEach((issue) => {
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    });

    const prioritizedIssuesPromises = issues.map((issue) =>
      this.generateFixSuggestion(issue)
    );
    const prioritizedIssues = (await Promise.all(prioritizedIssuesPromises))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 20); // 返回前 20 个优先级最高的问题

    const summary = this.generateSummary(issues, bySeverity, byType);

    return {
      totalIssues: issues.length,
      bySeverity,
      byType,
      prioritizedIssues,
      summary,
    };
  }

  /**
   * 计算问题优先级
   */
  private calculatePriority(issue: SonarIssue): number {
    const severityWeight: Record<string, number> = {
      BLOCKER: 100,
      CRITICAL: 80,
      MAJOR: 60,
      MINOR: 40,
      INFO: 20,
    };

    const typeWeight: Record<string, number> = {
      BUG: 1.5,
      VULNERABILITY: 2.0,
      CODE_SMELL: 1.0,
      SECURITY_HOTSPOT: 1.8,
    };

    const basePriority = severityWeight[issue.severity] || 0;
    const typeMultiplier = typeWeight[issue.type] || 1.0;

    return Math.round(basePriority * typeMultiplier);
  }

  /**
   * 根据规则生成修复建议
   */
  private async getSuggestionByRule(issue: SonarIssue): Promise<string> {
    if (!this.baseUrl) {
      return `请查看 Sonar 规则 ${issue.rule} 的详细说明，并根据最佳实践进行修复。`;
    }

    try {
      const ruleDetails = await this.sonarClient.getRuleDetails(
        this.baseUrl,
        issue.rule,
        this.token
      );
      if (ruleDetails && ruleDetails.htmlDesc) {
        // 从 HTML 描述中提取修复建议
        const suggestion = this.extractSuggestionFromHtml(ruleDetails.htmlDesc);
        return suggestion;
      }

      return `请查看 Sonar 规则 ${issue.rule} 的详细说明，并根据最佳实践进行修复。`;
    } catch (error) {
      console.error(
        `[WARN] Failed to fetch rule details for ${issue.rule}:`,
        error instanceof Error ? error.message : error
      );
      return `请查看 Sonar 规则 ${issue.rule} 的详细说明，并根据最佳实践进行修复。`;
    }
  }

  /**
   * 从 HTML 描述中提取修复建议
   */
  private extractSuggestionFromHtml(htmlDesc: string): string {
    let text = htmlDesc
      .replace(/<[^>]*>/g, "") // 去 HTML 标签
      .replace(/[\n\r\t]/g, "") // 去换行符/回车/制表
      .trim(); // 去首尾空白

      // TODO 这里包含了错误&正确案例 以及 解释 内容太多了是否过于增加token消耗
      // TODO 根据问题类型缓存
      // TODO 只展示正确案例？或开头200字？

    return text;
  }

  /**
   * 生成分析摘要
   */
  private generateSummary(
    issues: SonarIssue[],
    bySeverity: Record<string, number>,
    byType: Record<string, number>
  ): string {
    const lines: string[] = [];

    lines.push(`共发现 ${issues.length} 个问题需要解决。\n`);

    lines.push("按严重程度分布：");
    Object.entries(bySeverity)
      .sort((a, b) => b[1] - a[1])
      .forEach(([severity, count]) => {
        lines.push(`  - ${severity}: ${count} 个`);
      });

    lines.push("\n按类型分布：");
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        lines.push(`  - ${type}: ${count} 个`);
      });

    lines.push("\n建议优先处理 BLOCKER 和 CRITICAL 级别的问题。");

    return lines.join("\n");
  }
}
