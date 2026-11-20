import {
  validateGroupInput,
  validateGroupInviteeIds,
  validateGroupUpdateInput,
} from "../schemas/group.schema";
import type {
  GroupInput,
  GroupUpdateInput,
  ValidatedGroup,
  ValidatedGroupMetadata,
} from "../types/group.types";
import { GroupValidationError } from "./group.errors";

/** Validates the creation form and throws the field-level domain error. */
export function validateGroupOrThrow(
  input: GroupInput,
  ownerId: string,
): ValidatedGroup {
  const validation = validateGroupInput(input, ownerId);

  if (!validation.ok) throw new GroupValidationError(validation.error);

  return validation.value;
}

export function validateGroupUpdateOrThrow(
  input: GroupUpdateInput,
): ValidatedGroupMetadata {
  const validation = validateGroupUpdateInput(input);

  if (!validation.ok) throw new GroupValidationError(validation.error);

  return validation.value;
}

/** Extra invite round: at least one id, no duplicates, never the owner. */
export function validateInviteesOrThrow(
  inviteeIds: readonly string[],
  ownerId: string,
): string[] {
  const validation = validateGroupInviteeIds(inviteeIds, ownerId);

  if (!validation.ok) throw new GroupValidationError(validation.error);

  return validation.value;
}
