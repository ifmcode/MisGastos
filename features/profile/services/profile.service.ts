import type { IProfileRepository } from "../repositories/profile.repository";
import { validateProfileSaveInput } from "../schemas/profile.schema";
import {
  Profile,
  ProfileSaveInput,
} from "../types/profile.types";
import { ProfileValidationError } from "./profile.errors";

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async getProfile(uid: string): Promise<Profile | null> {
    const normalizedUid = uid.trim();
    if (normalizedUid.length === 0) return null;

    return this.profileRepository.getProfile(normalizedUid);
  }

  async saveProfile(input: ProfileSaveInput): Promise<Profile> {
    const validation = validateProfileSaveInput(input);

    if (!validation.ok) {
      throw new ProfileValidationError(validation.error);
    }

    return this.profileRepository.saveProfile(validation.value);
  }
}
