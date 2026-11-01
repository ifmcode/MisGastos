import { useMemo } from "react";

import { getCategoryService } from "../services/category.factory";

export function useCategoryService() {
  return useMemo(() => getCategoryService(), []);
}
