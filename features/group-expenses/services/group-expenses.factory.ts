import { CachedGroupsRepository } from "@/features/groups/repositories/cached-groups.repository";
import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedGroupExpensesRepository } from "../repositories/cached-group-expenses.repository";
import { CachedGroupSettlementsRepository } from "../repositories/cached-group-settlements.repository";
import { FirebaseGroupExpensesRepository } from "../repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "../repositories/firebase-group-settlements.repository";
import { OfflineGroupExpensesRepository } from "../repositories/offline-group-expenses.repository";
import { OfflineGroupSettlementsRepository } from "../repositories/offline-group-settlements.repository";
import { GroupExpensesService } from "./group-expenses.service";

let groupExpensesServiceInstance: GroupExpensesService | null = null;

/** Wire the implementations once; hooks share the instance. */
export function getGroupExpensesService(): GroupExpensesService {
  if (!groupExpensesServiceInstance) {
    const offline = isOfflineFirstEnabled();
    const remote = new FirebaseGroupExpensesRepository();
    const expensesRepository = offline
      ? new OfflineGroupExpensesRepository(
          new CachedGroupExpensesRepository(remote),
        )
      : remote;
    const groupsRepository = offline
      ? new CachedGroupsRepository(new FirebaseGroupsRepository())
      : new FirebaseGroupsRepository();
    const remoteSettlements = new FirebaseGroupSettlementsRepository();
    const settlementsRepository = offline
      ? new OfflineGroupSettlementsRepository(
          new CachedGroupSettlementsRepository(remoteSettlements),
        )
      : remoteSettlements;

    groupExpensesServiceInstance = new GroupExpensesService(
      expensesRepository,
      groupsRepository,
      expensesRepository,
      settlementsRepository,
    );
  }

  return groupExpensesServiceInstance;
}
