import type { IGroupsRepository } from "@/features/groups/repositories/groups.repository";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { Group } from "@/features/groups/types/group.types";
import {
  buildGroupSettlementNotification,
  type GroupSettlementNotificationEvent,
} from "@/features/groups/repositories/group-notification.port";

import type { IGroupExpensesRepository } from "../repositories/group-expenses.repository";
import type { IGroupSettlementsRepository } from "../repositories/group-settlements.repository";
import type { GroupSettlement } from "../types/group-settlement.types";
import { getGroupSettlementCounterpart } from "./group-settlement-persist";

/**
 * Dependencies of the group settlement use cases. The ledger is read through
 * the expense and settlement repositories so the debt bound always sees every
 * active row.
 */
export interface GroupSettlementWriteDeps {
  repository: IGroupSettlementsRepository;
  groupsRepository: IGroupsRepository;
  expensesRepository: IGroupExpensesRepository;
}

/**
 * `group-settlement` event of the other member of the pair. It carries ids,
 * cents and the denormalized group name only; `friendUid` is the actor.
 */
export function buildGroupSettlementEvent({
  settlement,
  group,
  actorUid,
  event,
  notifiedAt,
}: {
  settlement: GroupSettlement;
  group: Group;
  actorUid: string;
  event: GroupSettlementNotificationEvent;
  notifiedAt: string;
}): NotificationWrite {
  return buildGroupSettlementNotification({
    settlementId: settlement.id,
    groupId: group.id,
    groupName: group.name,
    recipientUid: getGroupSettlementCounterpart(settlement, actorUid),
    actorUid,
    event,
    amountCents: settlement.amountCents,
    currency: settlement.currency,
    notifiedAt,
  });
}
