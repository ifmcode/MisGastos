import { describe, expect, it } from "@jest/globals";

import { LOCAL_DB_MIGRATIONS } from "../migrations";
import { SCHEMA_CURRENT_STATEMENTS } from "../schema";

const TABLE_CONSTRAINT = /^(PRIMARY KEY|UNIQUE|FOREIGN KEY|CHECK)\b/;

/**
 * The in-memory adapter records DDL without parsing it, so a missing comma
 * between the last column and a primary key only fails on a real device as
 * `LOCAL_DB_MIGRATION_FAILED`. This guard reads the statements the way SQLite
 * would and fails in Jest instead.
 */
function statementsMissingComma(
  statements: readonly string[],
): readonly string[] {
  const offenders: string[] = [];

  for (const statement of statements) {
    if (!statement.includes("CREATE TABLE")) continue;

    const lines = statement.split("\n");
    lines.forEach((line, index) => {
      if (!TABLE_CONSTRAINT.test(line.trim())) return;

      let previous = index - 1;
      while (previous >= 0 && lines[previous].trim() === "") previous -= 1;

      const previousLine = previous >= 0 ? lines[previous].trim() : "";
      if (!previousLine.endsWith(",") && !previousLine.endsWith("(")) {
        offenders.push(`${previousLine} -> ${line.trim()}`);
      }
    });
  }

  return offenders;
}

describe("local database DDL", () => {
  it("puts a comma before every table constraint in the current schema", () => {
    expect(statementsMissingComma(SCHEMA_CURRENT_STATEMENTS)).toEqual([]);
  });

  it("puts a comma before every table constraint in every migration", () => {
    expect(statementsMissingComma(LOCAL_DB_MIGRATIONS.flatMap((m) => [...m.statements]))).toEqual(
      [],
    );
  });
});
