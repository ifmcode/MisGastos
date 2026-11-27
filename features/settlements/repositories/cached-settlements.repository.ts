import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";

import type {
  CreateSettlementDto,
  Settlement,
} from "../types/settlement.types";
import {
  cacheSettlement,
  cacheSettlements,
  readCachedSettlements,
} from "./local-settlement.cache";
import type { ISettlementsRepository } from "./settlements.repository";

/**
 * Read-through settlements. A list read mirrors the collection; a remote failure
 * falls back to the cache. Mutations delegate to the remote and mirror the
 * resulting record.
 */
export class CachedSettlementsRepository implements ISettlementsRepository {
  constructor(private readonly remote: ISettlementsRepository) {}

  async getSettlement(settlementId: string): Promise<Settlement | null> {
    try {
      const settlement = await this.remote.getSettlement(settlementId);
      if (settlement) {
        await this.mirror(settlement);
        return settlement;
      }

      const cached = await this.readCached();
      return (
        cached?.find((candidate) => candidate.id === settlementId) ?? null
      );
    } catch (error) {
      const cached = await this.readCached();
      const match = cached?.find((settlement) => settlement.id === settlementId);
      if (match) return match;
      throw error;
    }
  }

  async getSettlements(viewerUid: string): Promise<Settlement[]> {
    try {
      const settlements = await this.remote.getSettlements(viewerUid);
      const mirrored = await this.cacheList(viewerUid, settlements);

      // Same merge as shared expenses: a settlement created offline must be
      // visible and count in the balances before the server sees it.
      if (!mirrored) return settlements;

      return (await readCachedSettlements(viewerUid)) ?? settlements;
    } catch (error) {
      const cached = await this.readCached();
      if (cached) return cached;
      throw error;
    }
  }

  async createSettlement(
    dto: CreateSettlementDto,
    notification: Parameters<ISettlementsRepository["createSettlement"]>[1],
  ): Promise<Settlement> {
    return this.mirror(await this.remote.createSettlement(dto, notification));
  }

  async updateSettlement(
    viewerUid: string,
    settlementId: string,
    update: Parameters<ISettlementsRepository["updateSettlement"]>[2],
    notification: Parameters<ISettlementsRepository["updateSettlement"]>[3],
  ): Promise<Settlement> {
    return this.mirror(
      await this.remote.updateSettlement(
        viewerUid,
        settlementId,
        update,
        notification,
      ),
    );
  }

  async softDeleteSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: Parameters<ISettlementsRepository["softDeleteSettlement"]>[3],
  ): Promise<void> {
    await this.remote.softDeleteSettlement(
      viewerUid,
      settlementId,
      deletedAt,
      notification,
    );
    await this.refresh(settlementId);
  }

  private async readCached(): Promise<Settlement[] | null> {
    const ownerId = readCurrentOwnerId();
    if (!ownerId) return null;

    return readCachedSettlements(ownerId);
  }

  private async cacheList(
    viewerUid: string,
    settlements: readonly Settlement[],
  ): Promise<boolean> {
    try {
      await cacheSettlements(viewerUid, settlements, new Date().toISOString());
      return true;
    } catch {
      // Best effort: the online read already succeeded.
      return false;
    }
  }

  private async mirror(settlement: Settlement): Promise<Settlement> {
    const viewerId = readCurrentOwnerId();
    if (!viewerId) return settlement;

    try {
      await cacheSettlement(viewerId, settlement, new Date().toISOString());
    } catch {
      // Best effort.
    }

    return settlement;
  }

  private async refresh(settlementId: string): Promise<void> {
    try {
      const updated = await this.remote.getSettlement(settlementId);
      if (updated) await this.mirror(updated);
    } catch {
      // Best effort: the mutation already succeeded.
    }
  }
}
