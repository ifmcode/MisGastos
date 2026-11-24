import type { LocalQueryOptions } from "./database.port";
import type {
  LocalColumnValue,
  LocalRow,
  LocalTableName,
  LocalWhere,
} from "./local-db.types";
import { LOCAL_DB_PRIMARY_KEYS } from "./schema.keys";

export type SQLiteParams = Record<string, LocalColumnValue>;

export type SqlStatement = {
  sql: string;
  params: SQLiteParams;
};

/**
 * Quotes an internal table or column name. Identifiers are constants defined in
 * this layer, never user input; values always travel as bound parameters.
 */
export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function buildWhere(
  where: LocalWhere | undefined,
  prefix: string,
  params: SQLiteParams,
): string {
  const entries = Object.entries(where ?? {});
  if (entries.length === 0) return "";

  const predicates = entries.map(([column, value], index) => {
    const name = `$${prefix}${index}`;
    params[name] = value;

    // `IS` is null-safe equality, so a null filter matches `IS NULL`.
    return `${quoteIdentifier(column)} IS ${name}`;
  });

  return ` WHERE ${predicates.join(" AND ")}`;
}

export function buildSelect(
  table: LocalTableName,
  options: LocalQueryOptions = {},
): SqlStatement {
  const params: SQLiteParams = {};
  const orderBy = (options.orderBy ?? [])
    .map(
      ({ column, direction }) =>
        `${quoteIdentifier(column)} ${direction === "desc" ? "DESC" : "ASC"}`,
    )
    .join(", ");
  const orderClause = orderBy.length > 0 ? ` ORDER BY ${orderBy}` : "";
  let limitClause = "";

  if (options.limit !== undefined) {
    params.$limit = options.limit;
    limitClause = " LIMIT $limit";
  }

  const whereClause = buildWhere(options.where, "w", params);

  return {
    sql: `SELECT * FROM ${quoteIdentifier(table)}${whereClause}${orderClause}${limitClause}`,
    params,
  };
}

/**
 * Inserts a whole row or updates the columns of the row that collides on the
 * PRIMARY KEY only. `INSERT OR REPLACE` is forbidden here: it would delete any
 * row that conflicts on another unique key (for example a queued mutation) and
 * drop columns absent from the payload.
 */
export function buildUpsert(table: LocalTableName, row: LocalRow): SqlStatement {
  const columns = Object.keys(row);
  const primaryKeys = LOCAL_DB_PRIMARY_KEYS[table];
  const params: SQLiteParams = {};
  const placeholders = columns.map((column, index) => {
    const name = `$v${index}`;
    params[name] = row[column];

    return name;
  });
  const updates = columns
    .filter((column) => !primaryKeys.includes(column))
    .map(
      (column) =>
        `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`,
    );
  const conflictAction =
    updates.length > 0 ? `DO UPDATE SET ${updates.join(", ")}` : "DO NOTHING";

  return {
    sql:
      `INSERT INTO ${quoteIdentifier(table)} (${columns
        .map(quoteIdentifier)
        .join(", ")}) VALUES (${placeholders.join(", ")})` +
      ` ON CONFLICT (${primaryKeys.map(quoteIdentifier).join(", ")}) ${conflictAction}`,
    params,
  };
}

export function buildUpdate(
  table: LocalTableName,
  where: LocalWhere,
  changes: LocalRow,
): SqlStatement {
  const params: SQLiteParams = {};
  const assignments = Object.entries(changes).map(([column, value], index) => {
    const name = `$s${index}`;
    params[name] = value;

    return `${quoteIdentifier(column)} = ${name}`;
  });
  const whereClause = buildWhere(where, "w", params);

  return {
    sql: `UPDATE ${quoteIdentifier(table)} SET ${assignments.join(", ")}${whereClause}`,
    params,
  };
}

export function buildDelete(
  table: LocalTableName,
  where: LocalWhere,
): SqlStatement {
  const params: SQLiteParams = {};
  const whereClause = buildWhere(where, "w", params);

  return {
    sql: `DELETE FROM ${quoteIdentifier(table)}${whereClause}`,
    params,
  };
}

export function buildCount(
  table: LocalTableName,
  where?: LocalWhere,
): SqlStatement {
  const params: SQLiteParams = {};
  const whereClause = buildWhere(where, "w", params);

  return {
    sql: `SELECT COUNT(*) AS "total" FROM ${quoteIdentifier(table)}${whereClause}`,
    params,
  };
}
