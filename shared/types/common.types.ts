export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type Nullable<T> = T | null;

export type Maybe<T> = T | null | undefined;

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: string | Date;
  updatedAt: string | Date;
}
