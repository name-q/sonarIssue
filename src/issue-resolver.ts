import { SonarIssue } from "./sonar-client.js";

export interface FixSuggestion {
  issueKey: string;
  severity: string;
  type: string;
  message: string;
  suggestion: string;
  codeExample?: string;
  priority: number;
  estimatedEffort?: string;
}

export interface BatchAnalysis {
  totalIssues: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  prioritizedIssues: FixSuggestion[];
  summary: string;
}

export class IssueResolver {
  /**
   * 生成修复建议
   */
  generateFixSuggestion(issue: SonarIssue): FixSuggestion {
    const priority = this.calculatePriority(issue);
    const suggestion = this.getSuggestionByRule(issue);

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
  batchAnalyze(issues: SonarIssue[]): BatchAnalysis {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    issues.forEach((issue) => {
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    });

    const prioritizedIssues = issues
      .map((issue) => this.generateFixSuggestion(issue))
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
  private getSuggestionByRule(issue: SonarIssue): string {
    const rule = issue.rule.toLowerCase();

    // 常见的 Sonar 规则修复建议
    if (rule.includes("null")) {
      return "添加空值检查，使用 Optional 或者在使用前验证对象不为 null。";
    }

    if (rule.includes("unused")) {
      return "删除未使用的变量、方法或导入语句，保持代码整洁。";
    }

    if (rule.includes("complexity")) {
      return "降低方法的圈复杂度，考虑将复杂逻辑拆分为多个小方法。";
    }

    if (rule.includes("duplicate")) {
      return "消除重复代码，提取公共逻辑到独立的方法或类中。";
    }

    if (rule.includes("security") || rule.includes("sql")) {
      return "修复安全漏洞，使用参数化查询、输入验证或安全的 API。";
    }

    if (rule.includes("exception")) {
      return "改进异常处理，避免捕获通用异常，提供具体的错误处理逻辑。";
    }

    if (rule.includes("resource")) {
      return "确保资源正确关闭，使用 try-with-resources 或 finally 块。";
    }

    if (rule.includes("naming")) {
      return "遵循命名规范，使用有意义的变量名、方法名和类名。";
    }

    return `请查看 Sonar 规则 ${issue.rule} 的详细说明，并根据最佳实践进行修复。`;
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
