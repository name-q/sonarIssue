import { tools } from "./src/server/tools.js";

/**
 * 调试tool脚本
 */

const baseConfig = {
  sonarUrl: "https://sonar.devops.com.cn",
  projectUrl: "https://sonar.devops.com.cn/dashboard?id=managerweb",
  token: "xxxxxxxxxxxxxxxxxxx",
};

let cachedIssueKey: string | null = null;

async function getIssueKeyFromAnalyze(): Promise<string | null> {
  if (cachedIssueKey) {
    return cachedIssueKey;
  }

  const analyzeTool = tools.find((t) => t.name === "analyze_sonar_project");
  if (!analyzeTool) {
    console.error("[ERROR] analyze_sonar_project tool not found");
    return null;
  }

  try {
    console.log("[INFO] Fetching issues from analyze_sonar_project...");
    const result = await analyzeTool.handler({
      url: baseConfig.projectUrl,
      token: baseConfig.token,
    } as any);

    const output = JSON.parse(result.content[0].text);
    const firstIssue = output.issues?.[0];

    if (firstIssue?.key) {
      cachedIssueKey = firstIssue.key;
      console.log(`[INFO] Got issueKey: ${cachedIssueKey}`);
      return cachedIssueKey;
    } else {
      console.error("[ERROR] No issues found in analyze_sonar_project result");
      return null;
    }
  } catch (error) {
    console.error(
      `[ERROR] Failed to get issueKey: ${error instanceof Error ? error.message : error}`
    );
    return null;
  }
}

async function debugTool(toolName: string) {
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    console.error(`[ERROR] Tool not found: ${toolName}`);
    return;
  }

  let testCase: any;

  // 构建测试参数
  if (toolName === "analyze_sonar_project") {
    testCase = {
      url: baseConfig.projectUrl,
      token: baseConfig.token,
    };
  } else if (toolName === "get_issue_details") {
    const issueKey = await getIssueKeyFromAnalyze();
    if (!issueKey) {
      console.error(
        "[ERROR] Cannot test get_issue_details: no issues available for debugging"
      );
      return;
    }
    testCase = {
      issueKey,
      sonarUrl: baseConfig.sonarUrl,
      token: baseConfig.token,
    };
  } else if (toolName === "suggest_fix") {
    const issueKey = await getIssueKeyFromAnalyze();
    if (!issueKey) {
      console.error(
        "[ERROR] Cannot test suggest_fix: no issues available for debugging"
      );
      return;
    }
    testCase = {
      issueKey,
      sonarUrl: baseConfig.sonarUrl,
      token: baseConfig.token,
    };
  } else if (toolName === "batch_analyze_issues") {
    testCase = {
      url: baseConfig.projectUrl,
      token: baseConfig.token,
      severity: "BLOCKER",
    };
  }

  if (!testCase) {
    console.error(`[ERROR] Test case not found for: ${toolName}`);
    return;
  }

  console.log(`\n${"-".repeat(60)}`);
  console.log(`[TEST] ${toolName}`);
  console.log(`${"-".repeat(60)}`);
  console.log(`Description: ${tool.description}`);
  console.log(`Input:`, JSON.stringify(testCase, null, 2));

  try {
    console.log(`[RUNNING] Executing...`);
    const result = await tool.handler(testCase as any);
    console.log(`[SUCCESS] Completed!`);
    console.log(`Output:`, result.content[0].text);
  } catch (error) {
    console.error(`[ERROR] ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("[INFO] Sonar Issues Tool Debugger");
    console.log("\nAvailable tools:");
    tools.forEach((tool) => {
      console.log(`  - ${tool.name}`);
    });
    console.log("\nUsage: pnpm debug <tool-name>");
    console.log("Example: pnpm debug analyze_sonar_project");
    console.log("\nOr debug all tools: pnpm debug:all");
    return;
  }

  if (args[0] === "all") {
    for (const tool of tools) {
      await debugTool(tool.name);
    }
  } else {
    await debugTool(args[0]);
  }
}

main().catch(console.error);
