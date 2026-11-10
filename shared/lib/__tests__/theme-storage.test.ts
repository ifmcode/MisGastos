import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  loadThemePreference,
  saveThemePreference,
  THEME_PREFERENCE_KEY,
} from "../theme-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

describe("theme storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the stored preference", async () => {
    mockGetItem.mockResolvedValue("dark");

    await expect(loadThemePreference()).resolves.toBe("dark");
    expect(mockGetItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY);
  });

  it("falls back to system for missing or invalid values", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await expect(loadThemePreference()).resolves.toBe("system");

    mockGetItem.mockResolvedValueOnce("sepia");
    await expect(loadThemePreference()).resolves.toBe("system");
  });

  it("persists the preference", async () => {
    mockSetItem.mockResolvedValue(undefined);

    await saveThemePreference("light");

    expect(mockSetItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY, "light");
  });
});
