import { FirebaseProfileRepository } from "../repositories/firebase-profile.repository";
import { ProfileService } from "./profile.service";

let profileServiceInstance: ProfileService | null = null;

export function getProfileService(): ProfileService {
  if (!profileServiceInstance) {
    profileServiceInstance = new ProfileService(
      new FirebaseProfileRepository(),
    );
  }

  return profileServiceInstance;
}
