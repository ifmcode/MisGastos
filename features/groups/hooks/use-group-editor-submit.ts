import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  toGroupFieldErrors,
  validateGroupInput,
  validateGroupUpdateInput,
  type GroupValidationErrors,
} from "../schemas/group.schema";
import {
  getGroupErrorCode,
  GroupValidationError,
} from "../services/group.errors";
import type { Group } from "../types/group.types";
import {
  toGroupInput,
  toGroupUpdateInput,
  type GroupFormValues,
} from "../utils/group-form";
import { useGroupsService } from "./use-groups-service";

export interface UseGroupEditorSubmitOptions {
  viewerUid: string | undefined;
  editingGroup: Group | null;
  onSaved: () => void;
}

export interface GroupEditorSubmitState {
  formError: string | null;
  fieldErrors: GroupValidationErrors;
  submitting: boolean;
  resetErrors: () => void;
  submit: (values: GroupFormValues) => void;
}

/** Persists a group and maps validation and service failures to form errors. */
export function useGroupEditorSubmit({
  viewerUid,
  editingGroup,
  onSaved,
}: UseGroupEditorSubmitOptions): GroupEditorSubmitState {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<GroupValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const resetErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
  }, []);

  const submit = useCallback(
    (values: GroupFormValues) => {
      if (!viewerUid) {
        setFormError(tr("errors.SIGN_IN_REQUIRED"));
        return;
      }

      const target = editingGroup;

      const persist = async () => {
        setSubmitting(true);
        setFormError(null);
        setFieldErrors({});

        try {
          if (target) {
            const input = toGroupUpdateInput(values);
            const validation = validateGroupUpdateInput(input);

            if (!validation.ok) {
              setFieldErrors(toGroupFieldErrors(validation.error));
              return;
            }

            await service.updateGroup(viewerUid, target.id, input);
          } else {
            const input = toGroupInput(values);
            const validation = validateGroupInput(input, viewerUid);

            if (!validation.ok) {
              setFieldErrors(toGroupFieldErrors(validation.error));
              return;
            }

            await service.createGroup(viewerUid, input);
          }

          onSaved();
        } catch (error: unknown) {
          if (error instanceof GroupValidationError) {
            setFieldErrors(error.fieldErrors);
          }
          setFormError(tr(`errors.${getGroupErrorCode(error, "SAVE_FAILED")}`));
        } finally {
          setSubmitting(false);
        }
      };

      void persist();
    },
    [editingGroup, onSaved, service, tr, viewerUid],
  );

  return { formError, fieldErrors, submitting, resetErrors, submit };
}
