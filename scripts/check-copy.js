/**
 * Guard against new hardcoded UI copy. It parses TSX with the TypeScript
 * compiler and flags literal JSX text and copy-bearing literal props.
 *
 * Run with: npm run check:copy
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOTS = ["features", "shared", "app", "components"];
const COPY_PROPS = new Set([
  "accessibilityLabel",
  "accessibilityHint",
  "placeholder",
  "title",
  "message",
  "label",
  "helperText",
  "confirmLabel",
  "cancelLabel",
]);
const ALLOWED_LITERALS = new Set(["no-hide-descendants"]);

function walk(directory, files) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "locales") continue;
      walk(fullPath, files);
      continue;
    }

    if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".styles.ts")) {
      files.push(fullPath);
    }
  }
}

function hasLetters(value) {
  return /[A-Za-zÀ-ÿ]/.test(value);
}

function report(file, node, kind, value) {
  const { line } = ts.getLineAndCharacterOfPosition(
    node.getSourceFile(),
    node.getStart(),
  );
  console.log(`${file}:${line + 1} [${kind}] ${value.trim()}`);
}

function inspect(file, sourceFile) {
  let violations = 0;

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = node.getText();
      if (hasLetters(value) && !ALLOWED_LITERALS.has(value.trim())) {
        report(file, node, "jsx-text", value);
        violations += 1;
      }
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText();
      const initializer = node.initializer;

      if (
        COPY_PROPS.has(name) &&
        initializer &&
        (ts.isStringLiteral(initializer) ||
          ts.isNoSubstitutionTemplateLiteral(initializer)) &&
        hasLetters(initializer.text) &&
        !ALLOWED_LITERALS.has(initializer.text.trim())
      ) {
        report(file, node, `prop:${name}`, initializer.text);
        violations += 1;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

const files = [];
for (const root of ROOTS) {
  if (fs.existsSync(root)) walk(root, files);
}

let total = 0;
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  total += inspect(file, sourceFile);
}

if (total > 0) {
  console.error(`\nFound ${total} hardcoded copy string(s).`);
  process.exit(1);
}

console.log(`Copy audit passed (${files.length} TSX files checked).`);
