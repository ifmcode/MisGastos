import type { GroupActivityInput } from "../types/group-activity.types";
import { buildGroupActivityData } from "./group-activity.data";
import { newGroupActivityRef } from "./group-activity.operations";

/**
 * Narrow writer shared by `Transaction` and `WriteBatch`: both expose the same
 * `set(documentRef, data)` call, so one helper serves every atomic write.
 */
interface ActivityWriter {
  set(
    reference: ReturnType<typeof newGroupActivityRef>,
    data: Record<string, unknown>,
  ): unknown;
}

/**
 * Appends one event with the write it describes: the caller passes the same
 * `Transaction` or `WriteBatch` that persists the expense, settlement or group
 * change, so a failure leaves neither the record nor the history behind.
 */
export function addGroupActivity(
  writer: ActivityWriter,
  input: GroupActivityInput,
): void {
  writer.set(newGroupActivityRef(input.groupId), buildGroupActivityData(input));
}
