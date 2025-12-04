export interface SonarIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  project: string;
  line?: number;
  message: string;
  type: string;
  status: string;
  effort?: string;
  debt?: string;
  tags: string[];
}

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
