import type { CurrencyCode } from "@/shared/constants/currencies";

/** One member's net in one currency; `netCents` is never zero. */
export interface GroupMemberNet {
  currency: CurrencyCode;
  netCents: number;
}

/**
 * Port over TICKET-010's ledger, implemented by the group-expenses feature
 * because it owns the expenses and settlements. The groups service only needs
 * "is this member settled in every currency"; the port returns the non-zero
 * nets, or an empty list when the member is settled.
 */
export interface IGroupBalancePort {
  /**
   * Net of one member per currency, zero lines dropped. The caller has already
   * proven the group exists and the member belongs to it.
   */
  getMemberNets(
    groupId: string,
    memberId: string,
  ): Promise<GroupMemberNet[]>;
}
