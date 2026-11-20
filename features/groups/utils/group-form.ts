import {
  DEFAULT_CURRENCY,
  resolveCurrencyCode,
  type CurrencyCode,
} from "@/shared/constants/currencies";

import type {
  Group,
  GroupInput,
  GroupUpdateInput,
} from "../types/group.types";

/** Creation/edition form state: text fields stay strings until submit. */
export interface GroupFormValues {
  name: string;
  description: string;
  defaultCurrency: CurrencyCode;
  inviteeIds: string[];
}

/**
 * Create and edit share the form; invitees are always picked fresh, because an
 * edit can never change membership.
 */
export function getInitialGroupFormValues(
  group?: Group | null,
): GroupFormValues {
  if (!group) {
    return {
      name: "",
      description: "",
      defaultCurrency: DEFAULT_CURRENCY,
      inviteeIds: [],
    };
  }

  return {
    name: group.name,
    description: group.description ?? "",
    defaultCurrency: resolveCurrencyCode(group.defaultCurrency),
    inviteeIds: [],
  };
}

/** Toggles one invitee without mutating the array or duplicating it. */
export function toggleGroupInviteeId(
  inviteeIds: readonly string[],
  uid: unknown,
): string[] {
  const invitee = typeof uid === "string" ? uid.trim() : "";
  if (invitee.length === 0) return [...inviteeIds];

  return inviteeIds.includes(invitee)
    ? inviteeIds.filter((value) => value !== invitee)
    : [...inviteeIds, invitee];
}

export function toGroupInput(values: GroupFormValues): GroupInput {
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    description: description.length > 0 ? description : null,
    defaultCurrency: values.defaultCurrency,
    inviteeIds: values.inviteeIds.map((uid) => uid.trim()),
  };
}

/** An edit never sends invitees: membership only grows by acceptance. */
export function toGroupUpdateInput(values: GroupFormValues): GroupUpdateInput {
  const input = toGroupInput(values);

  return {
    name: input.name,
    description: input.description,
    defaultCurrency: input.defaultCurrency,
  };
}
