import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";

import { FirebaseGroupExpensesRepository } from "../repositories/firebase-group-expenses.repository";
import { GroupExpensesService } from "./group-expenses.service";

let groupExpensesServiceInstance: GroupExpensesService | null = null;

/** Wire the Firebase implementations once; hooks share the instance. */
export function getGroupExpensesService(): GroupExpensesService {
  if (!groupExpensesServiceInstance) {
    groupExpensesServiceInstance = new GroupExpensesService(
      new FirebaseGroupExpensesRepository(),
      new FirebaseGroupsRepository(),
    );
  }

  return groupExpensesServiceInstance;
}
