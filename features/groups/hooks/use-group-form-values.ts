import { useCallback, useState } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";

import {
  toggleGroupInviteeId,
  type GroupFormValues,
} from "../utils/group-form";

export interface GroupFormState {
  values: GroupFormValues;
  changeName: (name: string) => void;
  changeDescription: (description: string) => void;
  changeCurrency: (currency: CurrencyCode) => void;
  changeSimplifyDebts: (simplifyDebts: boolean) => void;
  toggleInvitee: (uid: string) => void;
}

/**
 * Editable values of the group form. The page-sheet shell unmounts its content
 * when it closes, so every open starts from the values the entry point passed.
 */
export function useGroupFormValues(
  initialValues: GroupFormValues,
): GroupFormState {
  const [values, setValues] = useState<GroupFormValues>(initialValues);

  const changeName = useCallback((name: string) => {
    setValues((current) => ({ ...current, name }));
  }, []);

  const changeDescription = useCallback((description: string) => {
    setValues((current) => ({ ...current, description }));
  }, []);

  const changeCurrency = useCallback((defaultCurrency: CurrencyCode) => {
    setValues((current) => ({ ...current, defaultCurrency }));
  }, []);

  const changeSimplifyDebts = useCallback((simplifyDebts: boolean) => {
    setValues((current) => ({ ...current, simplifyDebts }));
  }, []);

  const toggleInvitee = useCallback((uid: string) => {
    setValues((current) => ({
      ...current,
      inviteeIds: toggleGroupInviteeId(current.inviteeIds, uid),
    }));
  }, []);

  return {
    values,
    changeName,
    changeDescription,
    changeCurrency,
    changeSimplifyDebts,
    toggleInvitee,
  };
}
