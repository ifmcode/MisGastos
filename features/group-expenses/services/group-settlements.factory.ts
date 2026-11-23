import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";

import { FirebaseGroupExpensesRepository } from "../repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "../repositories/firebase-group-settlements.repository";
import { GroupSettlementsService } from "./group-settlements.service";

let groupSettlementsServiceInstance: GroupSettlementsService | null = null;

/**
 * Wire the Firebase implementations once; the hooks share the instance. The
 * settlement repository owns the movement port default, so the service only
 * needs the three repositories.
 */
export function getGroupSettlementsService(): GroupSettlementsService {
  if (!groupSettlementsServiceInstance) {
    groupSettlementsServiceInstance = new GroupSettlementsService(
      new FirebaseGroupSettlementsRepository(),
      new FirebaseGroupsRepository(),
      new FirebaseGroupExpensesRepository(),
    );
  }

  return groupSettlementsServiceInstance;
}
