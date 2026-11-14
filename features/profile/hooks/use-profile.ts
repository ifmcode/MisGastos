import { useContext } from "react";

import { ProfileContext } from "../context/profile-context";

/** Profile state shared by Settings, the profile screen and the dashboard. */
export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider.");
  }

  return context;
}
