import {
  SCHEMA_INDEX_STATEMENTS,
  SCHEMA_TABLE_STATEMENTS,
} from "./schema.tables";

export {
  LOCAL_DB_PRIMARY_KEYS,
  LOCAL_DB_UNIQUE_KEYS,
} from "./schema.keys";

/** Everything version 1 creates: tables first, then indexes. */
export const SCHEMA_V1_STATEMENTS: readonly string[] = [
  ...SCHEMA_TABLE_STATEMENTS,
  ...SCHEMA_INDEX_STATEMENTS,
];
