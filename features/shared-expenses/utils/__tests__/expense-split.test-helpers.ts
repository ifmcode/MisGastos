import type { SplitParticipantInput } from "../../types/shared-expense.types";
import { splitExpenseAmount } from "../expense-split";

export function row(userId: string, value: number): SplitParticipantInput {
  return { userId, value };
}

export const PAIR: SplitParticipantInput[] = [row("user-a", 0), row("user-b", 0)];

export function sumCents(
  result: ReturnType<typeof splitExpenseAmount>,
): number | null {
  if (!result.ok) return null;

  return result.value.reduce((total, item) => total + item.shareCents, 0);
}

export function sharesOf(
  result: ReturnType<typeof splitExpenseAmount>,
): number[] {
  return result.ok ? result.value.map((item) => item.shareCents) : [];
}

export function idsOf(
  result: ReturnType<typeof splitExpenseAmount>,
): string[] {
  return result.ok ? result.value.map((item) => item.userId) : [];
}
