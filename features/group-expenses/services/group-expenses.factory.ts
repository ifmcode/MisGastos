import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";

import { FirebaseGroupExpensesRepository } from "../repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "../repositories/firebase-group-settlements.repository";
import { GroupExpensesService } from "./group-expenses.service";

let groupExpensesServiceInstance: GroupExpensesService | null = null;

/** Wire the Firebase implementations once; hooks share the instance. */
export function getGroupExpensesService(): GroupExpensesService {
  if (!groupExpensesServiceInstance) {
    // The same instance serves the social and the linked paths; the balance
    // reads also need the group settlements of TICKET-010 Phase B.
    const expensesRepository = new FirebaseGroupExpensesRepository();

    groupExpensesServiceInstance = new GroupExpensesService(
      expensesRepository,
      new FirebaseGroupsRepository(),
      expensesRepository,
      new FirebaseGroupSettlementsRepository(),
    );
  }

  return groupExpensesServiceInstance;
}
