import { expect, it } from "vitest";
import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import es from "./lib/locales/es.json";

it("has Spanish entries for every literal interface translation key", () => {
  const missing: string[] = [];
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (
        /\.tsx?$/.test(path) &&
        !path.includes(".test.") &&
        !path.includes("test-setup")
      ) {
        const tree = ts.createSourceFile(
          path,
          readFileSync(path, "utf8"),
          ts.ScriptTarget.Latest,
          true,
          path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        function visit(node: ts.Node) {
          if (
            ts.isCallExpression(node) &&
            ["t", "tr"].includes(node.expression.getText(tree)) &&
            node.arguments[0] &&
            ts.isStringLiteral(node.arguments[0]) &&
            !Object.hasOwn(es, node.arguments[0].text)
          )
            missing.push(`${entry.name}: ${node.arguments[0].text}`);
          ts.forEachChild(node, visit);
        }
        visit(tree);
      }
    }
  }
  inspect(join(process.cwd(), "src"));
  expect(missing).toEqual([]);
});
