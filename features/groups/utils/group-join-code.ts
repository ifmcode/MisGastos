import {
  GROUP_JOIN_CODE_ALPHABET,
  GROUP_JOIN_CODE_LENGTH,
} from "../types/group-join.types";
import { GROUP_ID_SEPARATOR } from "./group-ids";

const CODE_PATTERN = new RegExp(
  `^[${GROUP_JOIN_CODE_ALPHABET}]{${GROUP_JOIN_CODE_LENGTH}}$`,
);

const CODE_DRAWS = 1000;

export function isGroupJoinCode(value: unknown): value is string {
  return typeof value === "string" && CODE_PATTERN.test(value);
}

/**
 * Uppercases and drops spaces, hyphens and underscores; returns `""` when any
 * character falls outside the alphabet, so a typo never reaches a lookup.
 */
export function normalizeGroupJoinCode(value: unknown): string {
  if (typeof value !== "string") return "";

  const normalized = value.toUpperCase().replace(/[\s_-]/g, "");

  return isGroupJoinCode(normalized) ? normalized : "";
}

/** `ABCD-EFGH` for display; an invalid code formats to `""`. */
export function formatGroupJoinCode(value: unknown): string {
  const code = normalizeGroupJoinCode(value);
  if (code.length === 0) return "";

  const half = GROUP_JOIN_CODE_LENGTH / 2;
  return `${code.slice(0, half)}-${code.slice(half)}`;
}

/**
 * Samples one alphabet index with rejection: a value outside the largest
 * multiple of the alphabet size is retried, so no symbol is over-represented.
 * The injected `random` makes the sequence deterministic in tests.
 */
function pickAlphabetIndex(random: () => number): number {
  const usable = Math.floor(CODE_DRAWS / GROUP_JOIN_CODE_ALPHABET.length) *
    GROUP_JOIN_CODE_ALPHABET.length;

  for (;;) {
    const draw = Math.floor(random() * CODE_DRAWS);
    // A broken injected RNG must not hang the generator; fall back to index 0.
    if (!Number.isFinite(draw) || draw < 0) return 0;
    if (draw < usable) return draw % GROUP_JOIN_CODE_ALPHABET.length;
  }
}

/**
 * 8-character code (40 bits) generated on the client. `Math.random` is not a
 * CSPRNG and is accepted for V1: a code only allows requesting to join, and the
 * owner still has to accept. `expo-crypto` is the future hardening step; tests
 * inject `random` to get a deterministic sequence.
 */
export function generateGroupJoinCode(
  random: () => number = Math.random,
): string {
  let code = "";

  for (let index = 0; index < GROUP_JOIN_CODE_LENGTH; index += 1) {
    code += GROUP_JOIN_CODE_ALPHABET[pickAlphabetIndex(random)];
  }

  return code;
}

/** Deterministic id `groupId__requesterId`, mirroring the rules contract. */
export function createGroupJoinRequestId(
  groupId: unknown,
  requesterId: unknown,
): string {
  const group = typeof groupId === "string" ? groupId.trim() : "";
  const requester = typeof requesterId === "string" ? requesterId.trim() : "";

  if (group.length === 0 || requester.length === 0) return "";

  return `${group}${GROUP_ID_SEPARATOR}${requester}`;
}

/**
 * Shape guard only: the mapper also rebuilds the id from the stored ids, so a
 * well-formed but foreign id is still dropped.
 */
export function isGroupJoinRequestId(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const parts = value.split(GROUP_ID_SEPARATOR);

  return parts.length >= 3 && parts.every((part) => part.length > 0);
}
