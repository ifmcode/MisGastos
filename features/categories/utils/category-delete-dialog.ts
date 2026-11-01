import { Alert } from "react-native";

import { Category } from "../types/category.types";

export interface DeleteCategoryDialogOptions {
  category: Category;
  onConfirm: () => void;
}

/** Confirms a destructive category delete before calling the service. */
export function showDeleteCategoryDialog({
  category,
  onConfirm,
}: DeleteCategoryDialogOptions) {
  Alert.alert(
    "Eliminar categoría",
    `¿Seguro que quieres eliminar "${category.name}"? Solo es posible si no se usa en ningún movimiento.`,
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onConfirm },
    ],
  );
}
