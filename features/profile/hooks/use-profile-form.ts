import { useState } from "react";

import {
  ProfileValidationErrors,
  toProfileFieldErrors,
  validateProfileFormValues,
} from "../schemas/profile.schema";
import {
  ProfileFormValues,
  UpdateProfileDto,
} from "../types/profile.types";

export interface UseProfileFormOptions {
  initialValues: ProfileFormValues;
  fieldErrors: ProfileValidationErrors;
  onSubmit: (input: UpdateProfileDto) => void;
}

export interface UseProfileFormResult {
  values: ProfileFormValues;
  errors: ProfileValidationErrors;
  updateValue: <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) => void;
  submit: () => void;
}

/** Owns the profile form values and their client-side validation. */
export function useProfileForm({
  initialValues,
  fieldErrors,
  onSubmit,
}: UseProfileFormOptions): UseProfileFormResult {
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
  const [localErrors, setLocalErrors] = useState<ProfileValidationErrors>({});

  const errors: ProfileValidationErrors = { ...localErrors, ...fieldErrors };

  function updateValue<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setLocalErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function submit() {
    const validation = validateProfileFormValues(values);

    if (!validation.ok) {
      setLocalErrors(toProfileFieldErrors(validation.error));
      return;
    }

    setLocalErrors({});
    onSubmit(validation.value);
  }

  return { values, errors, updateValue, submit };
}
