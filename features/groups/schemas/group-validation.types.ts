export {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_MAX_INVITEES,
  GROUP_MAX_MEMBERS,
  GROUP_NAME_MAX_LENGTH,
} from "../types/group.types";

export type GroupValidationField =
  | "name"
  | "description"
  | "defaultCurrency"
  | "inviteeIds";

export type GroupValidationCode =
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "DESCRIPTION_TOO_LONG"
  | "CURRENCY_INVALID"
  | "INVITEES_REQUIRED"
  | "INVITEES_TOO_MANY"
  | "INVITEES_DUPLICATE"
  | "INVITEE_INVALID";

export interface GroupValidationIssue {
  field: GroupValidationField;
  code: GroupValidationCode;
}

export type GroupValidationErrors = Partial<
  Record<GroupValidationField, GroupValidationCode>
>;
