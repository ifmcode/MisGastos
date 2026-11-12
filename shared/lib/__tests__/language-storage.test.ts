import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  LANGUAGE_PREFERENCE_KEY,
  loadLanguagePreference,
  saveLanguagePreference,
} from "../language-storage";

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

describe("language storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the stored language", async () => {
    mockGetItem.mockResolvedValue("en");

    await expect(loadLanguagePreference()).resolves.toBe("en");
    expect(mockGetItem).toHaveBeenCalledWith(LANGUAGE_PREFERENCE_KEY);
  });

  it("returns null for missing or invalid values", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await expect(loadLanguagePreference()).resolves.toBeNull();

    mockGetItem.mockResolvedValueOnce("fr");
    await expect(loadLanguagePreference()).resolves.toBeNull();
  });

  it("persists the language", async () => {
    mockSetItem.mockResolvedValue(undefined);

    await saveLanguagePreference("es");

    expect(mockSetItem).toHaveBeenCalledWith(LANGUAGE_PREFERENCE_KEY, "es");
  });
});
