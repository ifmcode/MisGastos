import {
  Profile,
  ValidatedProfileSaveInput,
} from "../types/profile.types";

export interface IProfileRepository {
  getProfile(uid: string): Promise<Profile | null>;
  saveProfile(input: ValidatedProfileSaveInput): Promise<Profile>;
}
