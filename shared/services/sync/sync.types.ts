import type {
  LocalConflictKind,
  LocalConflictResolution,
  OutboxMutation,
} from "@/shared/lib/local-db/local-db.types";

/** Stable conflict kinds; the UI translates them into copy. */
export type SyncConflictKind = LocalConflictKind;

export type SyncConflictResolution = LocalConflictResolution;

/** Wallet state a successful push leaves on the server. */
export type RemoteWalletBalance = {
  id: string;
  balance: number;
  revision: number;
  updatedAt?: string;
};

/** Result of applying one queued mutation against the server. */
export type RemoteMutationOutcome =
  | {
      status: "applied" | "replayed";
      revisionAfter: number;
      wallets: RemoteWalletBalance[];
    }
  | {
      status: "conflict";
      kind: SyncConflictKind;
      errorCode: string;
      remoteSnapshot: Record<string, unknown>;
    }
  | { status: "retry"; errorCode: string }
  | { status: "failed"; errorCode: string };

/** Port the sync engine drains the outbox through (Firestore today). */
export interface RemoteMutationExecutor {
  execute(mutation: OutboxMutation): Promise<RemoteMutationOutcome>;
}

export type SyncRunStatus = "done" | "offline" | "blocked";

/** One full push-then-pull cycle, as the UI reports it. */
export type SyncRunResult = {
  status: SyncRunStatus;
  pushed: number;
  conflicts: number;
  failed: number;
  pulled: boolean;
  /**
   * The pull was skipped because Firestore still had no server connection
   * (it served a cached, empty snapshot). Not an error: retry shortly.
   */
  deferred: boolean;
  pending: number;
  errorCode: string | null;
};
