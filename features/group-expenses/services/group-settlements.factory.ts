import { CachedGroupsRepository } from "@/features/groups/repositories/cached-groups.repository";
import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedGroupExpensesRepository } from "../repositories/cached-group-expenses.repository";
import { CachedGroupSettlementsRepository } from "../repositories/cached-group-settlements.repository";
import { FirebaseGroupExpensesRepository } from "../repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "../repositories/firebase-group-settlements.repository";
import { OfflineGroupExpensesRepository } from "../repositories/offline-group-expenses.repository";
import { OfflineGroupSettlementsRepository } from "../repositories/offline-group-settlements.repository";
import { GroupSettlementsService } from "./group-settlements.service";

let groupSettlementsServiceInstance: GroupSettlementsService | null = null;

/**
 * Wire the implementations once; the hooks share the instance. The settlement
 * repository owns the movement port default, so the service only needs the
 * three repositories.
 */
export function getGroupSettlementsService(): GroupSettlementsService {
  if (!groupSettlementsServiceInstance) {
    const offline = isOfflineFirstEnabled();
    const remoteSettlements = new FirebaseGroupSettlementsRepository();
    const settlementsRepository = offline
      ? new OfflineGroupSettlementsRepository(
          new CachedGroupSettlementsRepository(remoteSettlements),
        )
      : remoteSettlements;
    const remoteExpenses = new FirebaseGroupExpensesRepository();
    const expensesRepository = offline
      ? new OfflineGroupExpensesRepository(
          new CachedGroupExpensesRepository(remoteExpenses),
        )
      : remoteExpenses;
    const groupsRepository = offline
      ? new CachedGroupsRepository(new FirebaseGroupsRepository())
      : new FirebaseGroupsRepository();

    groupSettlementsServiceInstance = new GroupSettlementsService(
      settlementsRepository,
      groupsRepository,
      expensesRepository,
    );
  }

  return groupSettlementsServiceInstance;
}
