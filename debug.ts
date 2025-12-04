import { tools } from "./src/server/tools.js";

/**
 * 调试脚本：逐个验证每个 tool
 * 使用方法：
 * 1. 修改下面的 testCases 中的参数
 * 2. 运行: npx tsx debug.ts
 */

const testCases = {
  analyze_sonar_project: {
    url: "https://sonar.devops.com.cn/dashboard?id=managerweb",
    token: "",
  },
  get_issue_details: {
    issueKey: "managerweb:src/App.tsx:1",//<---这个是analyze_sonar_project返回的component和line的值
    sonarUrl: "https://sonar.devops.com.cn",
    token: "",
  },
  suggest_fix: {
    issueKey: "managerweb:src/App.tsx:1",
    sonarUrl: "https://sonar.devops.com.cn",
    token: "",
  },
  batch_analyze_issues: {
    url: "https://sonar.devops.com.cn/dashboard?id=managerweb",
    token: "",
    severity: "BLOCKER",
  },
};

async function debugTool(toolName: string) {
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    console.error(`Tool not found: ${toolName}`);
    return;
  }

  const testCase = testCases[toolName as keyof typeof testCases];
  if (!testCase) {
    console.error(`Test case not found for: ${toolName}`);
    return;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${toolName}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Description: ${tool.description}`);
  console.log(`Input:`, JSON.stringify(testCase, null, 2));

  try {
    console.log(`Running...`);
    const result = await tool.handler(testCase as any);
    console.log(`Success!`);
    console.log(`Output:`, result.content[0].text);
  } catch (error) {
    console.error(`Error:`, error instanceof Error ? error.message : error);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Sonar Issues Tool Debugger");
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
