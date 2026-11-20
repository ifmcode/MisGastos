import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import type { Friend } from "@/features/friends/types/friend.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useGroupFormValues } from "../hooks/use-group-form-values";
import type { GroupValidationErrors } from "../schemas/group-validation.types";
import { groupsStyles as styles } from "../styles/groups.styles";
import { GROUP_MAX_INVITEES } from "../types/group.types";
import type { GroupFormValues } from "../utils/group-form";
import { GroupFormFields } from "./group-form-fields";
import { GroupInviteeSelector } from "./group-invitee-selector";

export interface GroupFormProps {
  isEditing: boolean;
  initialValues: GroupFormValues;
  /** Accepted friends offered on create; edits never change membership. */
  friends: readonly Friend[];
  fieldErrors: GroupValidationErrors;
  error: string | null;
  submitting: boolean;
  onSubmit: (values: GroupFormValues) => void;
  onCancel: () => void;
}

/** Page sheet of the group create/edit form; owns the field values. */
export function GroupForm({
  isEditing,
  initialValues,
  friends,
  fieldErrors,
  error,
  submitting,
  onSubmit,
  onCancel,
}: GroupFormProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("groups");
  const form = useGroupFormValues(initialValues);
  const hasFieldError = Object.values(fieldErrors).some(Boolean);
  const notice = error ?? (hasFieldError ? t("form.validationSummary") : null);
  const inviteesError = fieldErrors.inviteeIds
    ? tr(`errors.${fieldErrors.inviteeIds}`)
    : null;

  return (
    <SafeAreaView
      style={[styles.formContainer, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.formContainer}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <FormHeader
            title={isEditing ? t("form.editTitle") : t("form.createTitle")}
            subtitle={
              isEditing ? t("form.editSubtitle") : t("form.createSubtitle")
            }
            closeAccessibilityLabel={t("form.closeAccessibility")}
            disabled={submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <GroupFormFields
              values={form.values}
              errors={fieldErrors}
              disabled={submitting}
              onChangeName={form.changeName}
              onChangeDescription={form.changeDescription}
              onChangeCurrency={form.changeCurrency}
            />

            {isEditing ? null : (
              <GroupInviteeSelector
                friends={friends}
                selectedIds={form.values.inviteeIds}
                maxSelected={GROUP_MAX_INVITEES}
                error={inviteesError}
                disabled={submitting}
                onToggle={form.toggleInvitee}
              />
            )}

            <ErrorBanner message={notice} />

            <FormActions
              submitting={submitting}
              isEditing={isEditing}
              cancelLabel={t("form.cancel")}
              cancelAccessibilityLabel={t("form.cancelAccessibility")}
              submitLabel={isEditing ? t("form.save") : t("form.create")}
              submitAccessibilityLabel={
                isEditing
                  ? t("form.submitAccessibilitySave")
                  : t("form.submitAccessibilityCreate")
              }
              onCancel={onCancel}
              onSubmit={() => onSubmit(form.values)}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
