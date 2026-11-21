import { normalizeGroupJoinCode } from "./group-join-code";

/** Local failure of the code field; `required` and `invalid` have their own copy. */
export type GroupJoinInputError = "required" | "invalid" | null;

export interface GroupJoinCodeInput {
  /** Normalized code, `""` when the field cannot be looked up. */
  code: string;
  error: GroupJoinInputError;
}

/**
 * Gate the join field before any service call: a blank or malformed code never
 * reaches the lookup. The normalized code keeps the service contract (uppercase,
 * no separators) and lets hyphens and spaces from a screenshot still work.
 */
export function readGroupJoinCodeInput(value: string): GroupJoinCodeInput {
  if (value.trim().length === 0) return { code: "", error: "required" };

  const code = normalizeGroupJoinCode(value);

  return code.length > 0 ? { code, error: null } : { code: "", error: "invalid" };
}
